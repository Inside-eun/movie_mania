"use client";

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { getBookingFallbackUrl } from '@/lib/bookingFallbacks';

import PosterImage from './PosterImage';

interface MovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
  movie: {
    title: string;
    theater: string;
    area: string;
    screen: string;
    time: string;
    movieCode?: string;
    director?: string;
    posterUrl?: string;
    tmdbPosterUrl?: string;
    prodYear?: string;
    runtime?: string;
    source?: string;
  } | null;
}

interface KOBISMovieInfo {
  movieCd?: string;
  movieNm?: string;
  movieNmEn?: string;
  movieNmOg?: string;
  prdtYear?: string;
  openDt?: string;
  showTm?: string;
  genres?: Array<{ genreNm: string }>;
  directors?: Array<{ peopleNm: string }>;
  actors?: Array<{ peopleNm: string; cast?: string }>;
  audits?: Array<{ auditNo: string; watchGradeNm: string }>;
}

interface KMDBApiData {
  cActors?: string;
  cCodeSubName2?: string;
}

export default function MovieModal({
  isOpen,
  onClose,
  movie,
  selectedDate,
}: MovieModalProps) {
  const [kobisData, setKobisData] = useState<KOBISMovieInfo | null>(null);
  const [kmdbData, setKmdbData] = useState<KMDBApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [bookingIsFallback, setBookingIsFallback] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && movie && movie.movieCode) {
      setLoading(true);
      const loadingTimer = setTimeout(() => setLoading(false), 1000);

      const fetchMovieInfo = async () => {
        try {
          const apiUrl = `/api/movie-info?movieCode=${movie.movieCode}&source=${
            movie.source || "KOBIS"
          }`;
          const response = await fetch(apiUrl);
          const result = await response.json();

          if (result.success && result.data) {
            const source = result.dataSource ?? movie.source;
            if (source === "KMDB_API") {
              setKmdbData(result.data);
              setKobisData(null);
            } else {
              setKobisData(result.data);
              setKmdbData(null);
            }
          } else {
            setKmdbData(null);
            setKobisData(null);
          }
        } catch {
          setKmdbData(null);
          setKobisData(null);
        } finally {
          clearTimeout(loadingTimer);
          setLoading(false);
        }
      };

      fetchMovieInfo();
    } else {
      setKobisData(null);
      setKmdbData(null);
      setLoading(false);
    }
  }, [isOpen, movie]);

  useEffect(() => {
    // 이전 요청 취소
    fetchAbortRef.current?.abort();

    if (!isOpen || !movie || !selectedDate) {
      setBookingUrl(null);
      setBookingIsFallback(false);
      return;
    }

    // 폴백 URL 즉시 표시 — 사용자가 기다리지 않아도 바로 클릭 가능
    const fallback = getBookingFallbackUrl(movie.theater);
    if (fallback) {
      setBookingUrl(fallback);
      setBookingIsFallback(true);
    } else {
      setBookingUrl(null);
      setBookingIsFallback(false);
    }

    // 정확한 상영 URL을 백그라운드에서 가져와 조용히 교체
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const params = new URLSearchParams({
      theater: movie.theater,
      title: movie.title,
      time: movie.time,
      date: selectedDate,
    });

    fetch(`/api/booking-url?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.url && !data.isFallback) {
          setBookingUrl(data.url);
          setBookingIsFallback(false);
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [isOpen, movie, selectedDate]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !movie) return null;

  const posterUrl = movie.tmdbPosterUrl || movie.posterUrl || "/NoPoster.png";

  const director =
    kobisData?.directors?.[0]?.peopleNm || movie.director || null;
  const prodYear = kobisData?.prdtYear || movie.prodYear || null;
  const runtime = kobisData?.showTm || movie.runtime || null;
  const genres = kobisData?.genres?.map((g) => g.genreNm).join(", ") || null;
  const rating =
    kobisData?.audits?.[0]?.watchGradeNm || kmdbData?.cCodeSubName2 || null;

  const endTime = (() => {
    if (!runtime) return null;
    const runtimeMin = parseInt(runtime);
    if (isNaN(runtimeMin)) return null;
    const isCineQ =
      movie.theater?.toLowerCase().includes("씨네큐") ||
      movie.theater?.toLowerCase().includes("cineq");
    const isCGV = movie.theater?.toLowerCase().includes("cgv");
    const extra = isCineQ || isCGV ? 10 : 0;
    const [h, m] = movie.time.split(":").map(Number);
    const end = new Date();
    end.setHours(h, m + runtimeMin + extra, 0, 0);
    return `${String(end.getHours()).padStart(2, "0")}:${String(
      end.getMinutes()
    ).padStart(2, "0")}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden shadow-2xl border border-gray-800">
        {/* 블러 배경 */}
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${posterUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px)",
            opacity: 0.3,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/75" />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/70 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 콘텐츠 */}
        <div className="relative flex items-center gap-5 px-5 py-6">
          {/* 포스터 */}
          <div className="relative flex-shrink-0 h-52 aspect-[2/3] overflow-hidden shadow-2xl ">
            <PosterImage
              src={posterUrl}
              alt={movie.title}
              priority
              sizes="140px"
            />
          </div>

          {/* 영화 정보 */}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-snug mb-3">
              {movie.title}
            </h2>

            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500" />
                <span className="text-xs text-gray-400">불러오는 중...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {director && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">
                      감독
                    </span>
                    <span className="text-gray-200 text-xs truncate">
                      {director}
                    </span>
                  </div>
                )}
                {prodYear && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">
                      제작년도
                    </span>
                    <span className="text-gray-200 text-xs">{prodYear}년</span>
                  </div>
                )}
                {runtime && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">
                      러닝타임
                    </span>
                    <span className="text-gray-200 text-xs">{runtime}분</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-xs w-16 flex-shrink-0">
                    상영시간
                  </span>
                  <span className="text-orange-400 text-xs font-semibold">
                    {movie.time}
                    {endTime && (
                      <span className="text-gray-400 font-normal">
                        {" "}
                        ~ {endTime}
                      </span>
                    )}
                  </span>
                </div>
                {genres && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">
                      장르
                    </span>
                    <span className="text-gray-200 text-xs">{genres}</span>
                  </div>
                )}
                {rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">
                      관람등급
                    </span>
                    <span className="text-gray-200 text-xs">{rating}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-gray-400 text-xs truncate">{movie.theater}</span>
              {bookingUrl && (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors"
                >
                  {bookingIsFallback ? "극장 바로가기" : "예매하기"}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
