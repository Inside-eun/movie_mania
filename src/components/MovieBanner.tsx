"use client";

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { mockEvents, CuratedEvent } from '@/mock/events';
import { getLocalDateString } from '@/utils/date';
import { trackQuizBannerClicked, trackBannerIndicatorClicked } from '@/utils/gtm';

import PosterImage from './PosterImage';

interface MovieBannerProps {
  onEventClick?: (eventId: string) => void;
}

interface EventSlide {
  event: CuratedEvent;
  posterUrl: string;
}

const POSTER_SESSION_STORAGE_KEY = "eventPosters:v1";

// 기획전은 사람이 검수해서 주 1회 정도만 갱신되고, 상영작 포스터도 한 번 정해지면
// 바뀔 일이 거의 없다. 그날그날의 실제 상영 스케줄을 조회해 포스터를 찾을 필요가
// 없으므로, 날짜와 무관하게 제목 기준으로 24시간 캐싱되는 /api/movie-credits를
// 그대로 재사용한다(기획전 상세 화면의 감독/연도 표시도 같은 엔드포인트를 쓴다).
function usePosterByTitle(titles: string[]) {
  const [posterByTitle, setPosterByTitle] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const titlesKey = titles.join("|");

  useEffect(() => {
    if (titles.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const cached = sessionStorage.getItem(POSTER_SESSION_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Record<string, string>;
        if (titles.every((t) => t in parsed)) {
          setPosterByTitle(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // 캐시가 깨졌으면 무시하고 새로 받는다.
      }
    }

    fetch("/api/movie-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles }),
    })
      .then((res) => res.json())
      .then((data: { success: boolean; data?: Record<string, { posterUrl: string | null } | null> }) => {
        if (cancelled || !data.success || !data.data) return;
        const result: Record<string, string> = {};
        for (const title of titles) {
          const posterUrl = data.data[title]?.posterUrl;
          if (posterUrl) result[title] = posterUrl;
        }
        setPosterByTitle(result);
        sessionStorage.setItem(POSTER_SESSION_STORAGE_KEY, JSON.stringify(result));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // titlesKey로 배열 내용이 바뀔 때만 재실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titlesKey]);

  return { posterByTitle, loading };
}

export default function MovieBanner({ onEventClick }: MovieBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const today = getLocalDateString(new Date());
  // 노출 기간(startDate~endDate) 안에 든 기획전만 후보로 삼는다.
  // endDate가 없으면 "상영 중"으로 보고 계속 노출한다(사람이 events.ts에서 직접 뺄 때까지).
  const activeEvents = useMemo(
    () =>
      mockEvents.filter(
        (e) => e.startDate <= today && (e.endDate === null || today <= e.endDate)
      ),
    [today]
  );

  const candidateTitles = useMemo(
    () => Array.from(new Set(activeEvents.flatMap((e) => e.movieTitles))),
    [activeEvents]
  );

  const { posterByTitle, loading } = usePosterByTitle(candidateTitles);

  // 기획전 상영작 중 포스터가 확인된 첫 작품을 대표 이미지로 쓴다.
  const eventSlides = useMemo<EventSlide[]>(() => {
    const slides: EventSlide[] = [];
    for (const event of activeEvents) {
      const title = event.movieTitles.find((t) => posterByTitle[t]);
      if (title) slides.push({ event, posterUrl: posterByTitle[title] });
    }
    return slides;
  }, [activeEvents, posterByTitle]);

  // index 0 ~ eventSlides.length-1 = 기획전 슬라이드, 마지막 index = 퀴즈 배너
  const totalSlides = eventSlides.length + 1;
  const quizIndex = totalSlides - 1;

  const goTo = useCallback(
    (idx: number) => {
      setFading(true);
      setTimeout(() => {
        setCurrentIndex(idx % totalSlides);
        setFading(false);
      }, 250);
    },
    [totalSlides],
  );

  const goToNext = useCallback(() => {
    goTo((currentIndex + 1) % totalSlides);
  }, [currentIndex, totalSlides, goTo]);

  const goToPrev = useCallback(() => {
    goTo((currentIndex - 1 + totalSlides) % totalSlides);
  }, [currentIndex, totalSlides, goTo]);

  // 좌우 스와이프로 슬라이드 이동
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || totalSlides <= 1) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0) {
      goToNext();
    } else {
      goToPrev();
    }
  };

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(goToNext, 4500);
    return () => clearInterval(interval);
  }, [totalSlides, goToNext]);

  // 슬라이드 개수가 바뀌면(기획전 로딩 완료 등) 범위를 벗어나지 않게 보정한다.
  useEffect(() => {
    if (currentIndex >= totalSlides) setCurrentIndex(0);
  }, [totalSlides, currentIndex]);

  // 포스터 조회 중엔 실제 슬라이드 대신 페이지 진입 시 스켈레톤과 동일한 높이/스타일의
  // 플레이스홀더를 보여준다(높이가 0으로 꺼졌다가 다시 나타나는 레이아웃 시프트 방지).
  if (loading) {
    return (
      <div
        className="w-full bg-gray-900/50 animate-pulse"
        style={{ height: "260px" }}
      />
    );
  }
  if (totalSlides === 0) return null;

  const isQuizSlide = currentIndex === quizIndex;
  const slide = isQuizSlide ? null : eventSlides[currentIndex];

  const handleClick = () => {
    if (isQuizSlide) {
      trackQuizBannerClicked();
      window.open('https://cine21.com/event/quiz', '_blank', 'noopener,noreferrer');
    } else if (slide && onEventClick) {
      onEventClick(slide.event.id);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-black cursor-pointer"
      style={{ height: "260px", touchAction: "pan-y" }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isQuizSlide ? (
        <div
          className="absolute inset-0 flex items-center px-4"
          style={{ opacity: fading ? 0 : 1, transition: "opacity 0.25s" }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/todayQuiz.png"
              alt="오늘의 퀴즈"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>
      ) : slide ? (
        <>
          {/* 블러 배경 */}
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${slide.posterUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px)",
              opacity: 0.35,
              transition: "opacity 0.3s",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70" />

          {/* 콘텐츠 */}
          <div
            className="absolute inset-0 flex items-center px-4 gap-4"
            style={{ opacity: fading ? 0 : 1, transition: "opacity 0.25s" }}
          >
            {/* 포스터 */}
            <div className="relative flex-shrink-0 h-52 aspect-[2/3] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <PosterImage
                src={slide.posterUrl}
                alt={slide.event.title}
                sizes="140px"
              />
            </div>

            {/* 기획전 정보 */}
            <div className="flex-1 min-w-0">
              <span className="inline-block bg-purple-500 text-black text-[10px] font-black px-2 py-0.5 mb-2 tracking-widest uppercase">
                기획전
              </span>
              <h2
                className="text-white font-bold text-lg leading-snug mb-1"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {slide.event.title}
              </h2>
              <p className="text-gray-400 text-xs mb-3 truncate">
                {slide.event.theaterNames.join(" · ")} · {slide.event.period}
              </p>
              <p
                className="text-gray-300 text-xs leading-relaxed"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {slide.event.summary}
              </p>
            </div>
          </div>
        </>
      ) : null}

      {/* 하단 인디케이터 */}
      {totalSlides > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                trackBannerIndicatorClicked("event", i);
                goTo(i);
              }}
              aria-label={i === quizIndex ? "퀴즈 배너로 이동" : `${i + 1}번 기획전으로 이동`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? "16px" : "6px",
                height: "6px",
                backgroundColor: i === currentIndex ? "#F97316" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
