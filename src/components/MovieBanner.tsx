"use client";

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { mockEvents, CuratedEvent } from '@/mock/events';
import { useWeeklySchedules } from '@/hooks/useWeeklySchedules';
import { trackQuizBannerClicked } from '@/utils/gtm';

import PosterImage from './PosterImage';

interface MovieBannerProps {
  onEventClick?: (eventId: string) => void;
}

interface EventSlide {
  event: CuratedEvent;
  posterUrl: string;
}

export default function MovieBanner({ onEventClick }: MovieBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const weekly = useWeeklySchedules();

  // 기획전 상영작 중 이번 주 상영이 확인되고 포스터가 있는 첫 작품을 대표 이미지로 쓴다.
  const eventSlides = useMemo<EventSlide[]>(() => {
    const slides: EventSlide[] = [];
    for (const event of mockEvents) {
      let posterUrl = "";
      outer: for (const title of event.movieTitles) {
        for (const date of weekly.dates) {
          const movies = weekly.scheduleByDate[date];
          if (!movies) continue;
          const movie = movies.find(
            (m) => m.theater === event.theaterName && m.title === title
          );
          const found = movie?.tmdbPosterUrl || movie?.posterUrl;
          if (found) {
            posterUrl = found;
            break outer;
          }
        }
      }
      if (posterUrl) slides.push({ event, posterUrl });
    }
    return slides;
  }, [weekly.dates, weekly.scheduleByDate]);

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

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(goToNext, 4500);
    return () => clearInterval(interval);
  }, [totalSlides, goToNext]);

  // 슬라이드 개수가 바뀌면(기획전 로딩 완료 등) 범위를 벗어나지 않게 보정한다.
  useEffect(() => {
    if (currentIndex >= totalSlides) setCurrentIndex(0);
  }, [totalSlides, currentIndex]);

  if (eventSlides.length === 0 && weekly.loading) return null;
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
      style={{ height: "260px" }}
      onClick={handleClick}
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
                {slide.event.theaterName} · {slide.event.period}
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
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
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
