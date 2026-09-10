"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { mockEvents, getEvent, CuratedEvent } from "@/mock/events";
import { useWeeklySchedules } from "@/hooks/useWeeklySchedules";
import { getLocalDateString } from "@/utils/date";
import { MovieSchedule } from "@/types";
import { CreditsByTitle } from "@/mock/recommendations";
import PosterImage from "@/components/PosterImage";

function formatMonthDay(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatYear(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const year = dateStr.split("-")[0];
  return year || null;
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

function MovieCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800">
      <div className="skeleton-bar w-full aspect-[2/3]" />
      <div className="p-2 space-y-1.5">
        <span className="skeleton-bar block h-3 w-full" />
        <span className="skeleton-bar block h-3 w-2/3" />
      </div>
    </div>
  );
}

export default function EventsView() {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [creditsByTitle, setCreditsByTitle] = useState<CreditsByTitle>({});
  const [creditsLoading, setCreditsLoading] = useState(false);
  const weekly = useWeeklySchedules();

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
          onClick={() => setSelectedEventId(null)}
          className="text-xs text-gray-400 hover:text-orange-400 mb-3 flex items-center gap-1"
        >
          ← 기획전 목록
        </button>

        <div className="h-28 mb-4 flex items-end p-4" style={{ backgroundColor: selectedEvent.bannerColor }}>
          <div>
            <h2 className="text-lg font-bold text-white drop-shadow">{selectedEvent.title}</h2>
            <p className="text-xs text-white/80">{selectedEvent.theaterName} · {selectedEvent.period}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-6 leading-relaxed">{selectedEvent.description}</p>

        {weekly.loading && (
          <p className="text-[11px] text-gray-500 mb-3">
            이번 주 상영 정보 확인 중... ({weekly.loadedDays}/{weekly.totalDays}일)
          </p>
        )}

        <h3 className="text-sm font-bold text-white mb-2">상영작</h3>
        <div className="grid grid-cols-2 gap-3">
          {creditsLoading
            ? selectedEvent.movieTitles.map((title) => <MovieCardSkeleton key={title} />)
            : selectedEvent.movieTitles.map((title) => {
                const credits = creditsByTitle[title];
                const match = findMatch(weekly, selectedEvent, title);
                const matchedDate = match?.date ?? null;
                const isShowingToday = matchedDate === today;
                const isScheduledLater = matchedDate !== null && !isShowingToday;
                const hasSchedule = matchedDate !== null;
                const year = formatYear(credits?.releaseDate);

                const CardWrapper = hasSchedule ? "button" : "div";

                return (
                  <CardWrapper
                    key={title}
                    {...(hasSchedule
                      ? { onClick: () => match && openMovieDetail(match.movie, match.date) }
                      : {})}
                    className={`bg-gray-900 border border-gray-800 text-left overflow-hidden ${
                      hasSchedule ? "hover:border-orange-500 transition-colors" : ""
                    }`}
                  >
                    <div className="relative w-full aspect-[2/3] bg-gray-800">
                      <PosterImage src={credits?.posterUrl ?? null} alt={title} sizes="50vw" />
                      {!hasSchedule && (
                        <div className="absolute inset-0 bg-black/50" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-white leading-snug line-clamp-2 min-h-[2.25em]">
                        {title}
                      </p>
                      {(credits?.director || year) && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {credits?.director}
                          {credits?.director && year && " · "}
                          {year}
                        </p>
                      )}
                      <p className="text-[10px] mt-1">
                        {isShowingToday ? (
                          <span className="text-green-400">현재 상영 중</span>
                        ) : isScheduledLater ? (
                          <span className="text-blue-400">{formatMonthDay(matchedDate!)} 상영 예정</span>
                        ) : (
                          <span className="text-gray-500">상영 정보 미등록</span>
                        )}
                      </p>
                    </div>
                  </CardWrapper>
                );
              })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-bold text-white">기획전</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          영화관별 기획전을 둘러보세요.
        </p>
      </div>

      <div className="space-y-3">
        {mockEvents.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedEventId(e.id)}
            className="block w-full text-left border border-gray-800 overflow-hidden hover:border-orange-500 transition-colors"
          >
            <div className="h-20 flex items-end p-3" style={{ backgroundColor: e.bannerColor }}>
              <p className="text-base font-bold text-white drop-shadow">{e.title}</p>
            </div>
            <div className="bg-gray-900 px-3 py-2.5">
              <p className="text-[11px] text-gray-400">{e.theaterName} · {e.period}</p>
              <p className="text-xs text-gray-300 mt-1">{e.summary}</p>
              <p className="text-[10px] text-gray-500 mt-1">{e.movieTitles.length}개 작품</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
