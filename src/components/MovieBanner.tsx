"use client";

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { MovieSchedule } from '@/types';
import { trackQuizBannerClicked } from '@/utils/gtm';

import PosterImage from './PosterImage';

interface MovieBannerProps {
  movies: MovieSchedule[];
  onMovieClick?: (movie: MovieSchedule) => void;
}

export default function MovieBanner({ movies, onMovieClick }: MovieBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const displayMovies = useMemo(() => {
    const withPosters = movies
      .filter((m) => m.tmdbPosterUrl || m.posterUrl)
      .reduce<MovieSchedule[]>((acc, movie) => {
        if (!acc.some((m) => m.title === movie.title)) acc.push(movie);
        return acc;
      }, []);
    const arr = [...withPosters];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 8);
  }, [movies]);

  // index 0 = 퀴즈 배너, index 1+ = 영화 슬라이드
  const totalSlides = displayMovies.length + 1;

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

  if (displayMovies.length === 0) return null;

  const isQuizSlide = currentIndex === 0;
  const movie = isQuizSlide ? null : displayMovies[currentIndex - 1];
  const posterUrl = movie ? (movie.tmdbPosterUrl || movie.posterUrl || "") : "";

  const handleClick = () => {
    if (isQuizSlide) {
      trackQuizBannerClicked();
      window.open('https://cine21.com/event/quiz', '_blank', 'noopener,noreferrer');
    } else if (movie && onMovieClick) {
      onMovieClick(movie);
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
      ) : (
        <>
          {/* 블러 배경 */}
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${posterUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(18px)",
              opacity: 0.25,
              transition: "opacity 0.3s",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60" />

          {/* 콘텐츠 */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: fading ? 0 : 1, transition: "opacity 0.25s" }}
          >
            <div className="w-full h-full max-w-4xl mx-auto flex items-center px-4 gap-4">
              {/* 포스터 */}
              <div className="relative flex-shrink-0 h-52 aspect-[2/3] overflow-hidden shadow-2xl">
                <PosterImage
                  src={posterUrl}
                  alt={movie!.title}
                  priority
                  sizes="140px"
                />
              </div>

              {/* 영화 정보 */}
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-orange-500 text-black text-[10px] font-black px-2 py-0.5 mb-2 tracking-widest uppercase">
                  Now Showing
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
                  {movie!.title}
                </h2>
                {movie!.director && (
                  <p className="text-gray-400 text-xs mb-3 truncate">{movie!.director}</p>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-gray-300 text-sm truncate">{movie!.theater}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-orange-400 text-sm font-bold">{movie!.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 하단 인디케이터 */}
      {totalSlides > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={i === 0 ? "퀴즈 배너로 이동" : `${i}번 영화로 이동`}
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
