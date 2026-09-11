"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { mockEvents, getEvent, CuratedEvent } from "@/mock/events";
import { useWeeklySchedules } from "@/hooks/useWeeklySchedules";
import { getLocalDateString } from "@/utils/date";
import { MovieSchedule } from "@/types";
import { CreditsByTitle } from "@/mock/recommendations";
import { trackEventListItemClicked, trackEventMovieClicked } from "@/utils/gtm";

function formatMonthDay(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatYear(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const year = dateStr.split("-")[0];
  return year || null;
}

function formatMovieList(titles: string[]): string {
  const shown = titles.slice(0, 3).join(" · ");
  return titles.length > 3 ? `${shown} 외 ${titles.length - 3}편` : shown;
}

// 이번 주(오늘 포함 7일) 데이터에서 극장 이름 + 제목이 둘 다 일치하는 첫 상영일을 찾는다.
// 제목만 보고 매칭하면 다른 극장(예: CGV아트하우스가 트는 재상영)까지 잡혀서
// "이 극장에서 상영 중"이라고 착각하게 만들 수 있어 theaterName도 반드시 같이 본다.
function findMatch(
  weekly: ReturnType<typeof useWeeklySchedules>,
  event: CuratedEvent,
  movieTitle: string
): { date: string; movie: MovieSchedule } | null {
  for (const date of weekly.dates) {
    const movies = weekly.scheduleByDate[date];
    if (!movies) continue;
    const movie = movies.find((m) => m.theater === event.theaterName && m.title === movieTitle);
    if (movie) return { date, movie };
  }
  return null;
}

function MovieRowSkeleton() {
  return (
    <div className="py-3 space-y-1.5">
      <span className="skeleton-bar block h-3.5 w-2/3" />
      <span className="skeleton-bar block h-3 w-1/3" />
    </div>
  );
}

interface EventsViewProps {
  initialEventId?: string | null;
  onExitToHome?: () => void;
}

export default function EventsView({ initialEventId = null, onExitToHome }: EventsViewProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId);
  const [creditsByTitle, setCreditsByTitle] = useState<CreditsByTitle>({});
  const [creditsLoading, setCreditsLoading] = useState(false);
  const weekly = useWeeklySchedules();
  // 홈 배너를 눌러 목록을 거치지 않고 바로 상세로 들어온 경우, 뒤로가기는 목록이 아니라 홈으로 가야 한다.
  const openedDirectlyFromHomeRef = useRef(initialEventId != null);

  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : null;

  useEffect(() => {
    if (!selectedEvent) return;

    const controller = new AbortController();
    setCreditsLoading(true);

    fetch("/api/movie-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles: selectedEvent.movieTitles }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { success: boolean; data?: CreditsByTitle }) => {
        if (data.success && data.data) setCreditsByTitle(data.data);
      })
      .catch(() => {})
      .finally(() => setCreditsLoading(false));

    return () => controller.abort();
  }, [selectedEvent]);

  // 극장 메인 화면(page.tsx)의 openMovieDetail과 동일한 방식으로 저장 후 이동한다.
  const openMovieDetail = (movie: MovieSchedule, date: string) => {
    const slug = encodeURIComponent(movie.movieCode || movie.title);
    sessionStorage.setItem(`movieDetail:${slug}`, JSON.stringify({ movie, selectedDate: date }));
    router.push(`/movie/${slug}`);
  };

  if (selectedEvent) {
    const today = getLocalDateString(new Date());

    return (
      <div>
        <button
          onClick={() => {
            if (openedDirectlyFromHomeRef.current && onExitToHome) {
              onExitToHome();
            } else {
              setSelectedEventId(null);
            }
          }}
          className="text-xs text-gray-400 hover:text-orange-400 mb-3 flex items-center gap-1"
        >
          {openedDirectlyFromHomeRef.current && onExitToHome ? "← 홈" : "← 기획전 목록"}
        </button>

        <div className="mb-5 bg-gray-900 border border-white/10 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-400">
              {selectedEvent.theaterName}
            </p>
            <p className="shrink-0 text-[10px] text-gray-500">{selectedEvent.period}</p>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">{selectedEvent.title}</h2>
        </div>

        <p className="text-sm text-gray-300 mb-6 leading-relaxed border-l-2 border-orange-500/60 pl-4">
          {selectedEvent.description}
        </p>

        {weekly.loading && (
          <p className="text-[11px] text-gray-500 mb-3">
            이번 주 상영 정보 확인 중... ({weekly.loadedDays}/{weekly.totalDays}일)
          </p>
        )}

        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-base font-bold text-white">상영작</h3>
          <span className="text-[11px] text-gray-500">{selectedEvent.movieTitles.length}편</span>
        </div>

        <div className="divide-y divide-white/10 border-t border-white/10">
          {creditsLoading
            ? selectedEvent.movieTitles.map((title) => <MovieRowSkeleton key={title} />)
            : selectedEvent.movieTitles.map((title) => {
                const credits = creditsByTitle[title];
                const match = findMatch(weekly, selectedEvent, title);
                const matchedDate = match?.date ?? null;
                const isShowingToday = matchedDate === today;
                const isScheduledLater = matchedDate !== null && !isShowingToday;
                const hasSchedule = matchedDate !== null;
                const year = formatYear(credits?.releaseDate);

                const RowWrapper = hasSchedule ? "button" : "div";

                return (
                  <RowWrapper
                    key={title}
                    {...(hasSchedule
                      ? {
                          onClick: () => {
                            trackEventMovieClicked(title, selectedEvent.title);
                            match && openMovieDetail(match.movie, match.date);
                          },
                        }
                      : {})}
                    className={`flex items-center justify-between gap-3 w-full text-left py-3 ${
                      hasSchedule ? "hover:bg-white/5 transition-colors" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{title}</p>
                      {(credits?.director || year) && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {credits?.director}
                          {credits?.director && year && " · "}
                          {year}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px]">
                      {isShowingToday ? (
                        <span className="text-green-400">현재 상영 중</span>
                      ) : isScheduledLater ? (
                        <span className="text-blue-400">{formatMonthDay(matchedDate!)} 상영 예정</span>
                      ) : (
                        <span className="text-gray-500">상영 정보 미등록</span>
                      )}
                    </span>
                  </RowWrapper>
                );
              })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-bold text-white text-center mb-5">기획전</h2>

      <div className="space-y-3">
        {mockEvents.map((e) => (
          <button
            key={e.id}
            data-testid="event-card"
            onClick={() => {
              trackEventListItemClicked(e.title);
              setSelectedEventId(e.id);
            }}
            className="block w-full text-left bg-gray-900 border border-white/10 p-3 hover:border-orange-500/70 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-400">
                {e.theaterName}
              </p>
              <p className="shrink-0 text-[10px] text-gray-500">{e.period}</p>
            </div>
            <p className="text-sm font-bold text-white leading-snug line-clamp-1">{e.title}</p>
            <p className="text-[13px] text-gray-300 mt-1.5 leading-relaxed line-clamp-2">{e.summary}</p>
            <p className="text-[11px] text-gray-500 mt-1 truncate">{formatMovieList(e.movieTitles)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
