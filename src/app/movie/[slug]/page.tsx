"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import PosterImage from "@/components/PosterImage";
import TheaterMapMock from "@/components/TheaterMapMock";
import TheaterDetailModal from "@/components/TheaterDetailModal";
import { getBookingFallbackUrl } from "@/lib/bookingFallbacks";
import { useWishlist } from "@/hooks";
import { MovieSchedule } from "@/types";
import { getRecommendations } from "@/mock/recommendations";

interface KOBISMovieInfo {
  movieCd?: string;
  prdtYear?: string;
  showTm?: string;
  genres?: Array<{ genreNm: string }>;
  directors?: Array<{ peopleNm: string }>;
  audits?: Array<{ auditNo: string; watchGradeNm: string }>;
}

interface KMDBApiData {
  cActors?: string;
  cCodeSubName2?: string;
}

interface StoredMovieDetail {
  movie: MovieSchedule;
  selectedDate: string;
}

export default function MovieDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [stored, setStored] = useState<StoredMovieDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [kobisData, setKobisData] = useState<KOBISMovieInfo | null>(null);
  const [kmdbData, setKmdbData] = useState<KMDBApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [bookingIsFallback, setBookingIsFallback] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const [isTheaterModalOpen, setIsTheaterModalOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`movieDetail:${params.slug}`);
    if (!raw) {
      setNotFound(true);
      return;
    }
    setStored(JSON.parse(raw));
  }, [params.slug]);

  const movie = stored?.movie ?? null;
  const selectedDate = stored?.selectedDate;
  const wishlist = useWishlist(selectedDate ?? "");

  // 감독/장르/등급 등 상세 정보
  useEffect(() => {
    if (!movie?.movieCode) return;
    setLoading(true);
    const loadingTimer = setTimeout(() => setLoading(false), 1000);

    const fetchMovieInfo = async () => {
      try {
        const apiUrl = `/api/movie-info?movieCode=${movie.movieCode}&source=${movie.source || "KOBIS"}`;
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
  }, [movie?.movieCode, movie?.source]);

  // 예매 링크
  useEffect(() => {
    fetchAbortRef.current?.abort();
    if (!movie || !selectedDate) return;

    const fallback = getBookingFallbackUrl(movie.theater);
    if (fallback) {
      setBookingUrl(fallback);
      setBookingIsFallback(true);
    }

    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const urlParams = new URLSearchParams({
      theater: movie.theater,
      title: movie.title,
      time: movie.time,
      date: selectedDate,
    });

    fetch(`/api/booking-url?${urlParams}`, { signal: controller.signal })
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
  }, [movie, selectedDate]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-gray-400">영화 정보를 찾을 수 없습니다.</p>
        <Link href="/" className="text-xs text-orange-500 underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!movie) {
    return <div className="min-h-screen bg-black" />;
  }

  const posterUrl = movie.tmdbPosterUrl || movie.posterUrl || "/NoPoster.png";
  const director = kobisData?.directors?.[0]?.peopleNm || movie.director || null;
  const prodYear = kobisData?.prdtYear || movie.prodYear || null;
  const runtime = kobisData?.showTm || movie.runtime || null;
  const genres = kobisData?.genres?.map((g) => g.genreNm).join(", ") || null;
  const rating = kobisData?.audits?.[0]?.watchGradeNm || kmdbData?.cCodeSubName2 || null;

  const endTime = (() => {
    if (!runtime) return null;
    const runtimeMin = parseInt(runtime);
    if (isNaN(runtimeMin)) return null;
    const isCineQ = movie.theater?.toLowerCase().includes("씨네큐");
    const isCGV = movie.theater?.toLowerCase().includes("cgv");
    const extra = isCineQ || isCGV ? 10 : 0;
    const [h, m] = movie.time.split(":").map(Number);
    const end = new Date();
    end.setHours(h, m + runtimeMin + extra, 0, 0);
    return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  })();

  const recommendation = getRecommendations(movie);
  const inWishlist = wishlist.isInWishlist(movie);

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-24">
      <div className="sticky top-0 z-40 bg-black border-b border-gray-800 px-4 py-2.5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-orange-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          뒤로
        </button>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-4">
        {/* 영화 정보 */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1 min-w-0 order-1">
            <h1 className="text-lg font-bold text-white leading-snug mb-3">{movie.title}</h1>

            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500" />
                <span className="text-xs text-gray-400">불러오는 중...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {director && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">감독</span>
                    <span className="text-gray-200 text-xs truncate">{director}</span>
                  </div>
                )}
                {prodYear && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">제작년도</span>
                    <span className="text-gray-200 text-xs">{prodYear}년</span>
                  </div>
                )}
                {runtime && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">러닝타임</span>
                    <span className="text-gray-200 text-xs">{runtime}분</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-xs w-16 flex-shrink-0">상영시간</span>
                  <span className="text-orange-400 text-xs font-semibold">
                    {movie.time}
                    {endTime && <span className="text-gray-400 font-normal"> ~ {endTime}</span>}
                  </span>
                </div>
                {genres && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">장르</span>
                    <span className="text-gray-200 text-xs">{genres}</span>
                  </div>
                )}
                {rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xs w-16 flex-shrink-0">관람등급</span>
                    <span className="text-gray-200 text-xs">{rating}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-orange-500 text-xs w-16 flex-shrink-0">영화관</span>
                  <button
                    onClick={() => setIsTheaterModalOpen(true)}
                    className="text-gray-200 text-xs underline decoration-dotted underline-offset-2 hover:text-orange-400 transition-colors truncate"
                  >
                    {movie.theater}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex-shrink-0 w-28 aspect-[2/3] overflow-hidden shadow-2xl order-2">
            <PosterImage src={posterUrl} alt={movie.title} priority sizes="112px" />
          </div>
        </div>

        {/* 지도 목업 */}
        <TheaterMapMock height={260} />
        <p className="text-[11px] text-gray-500 mt-2 mb-6">
          * 본 영화관은 정시 상영합니다.
        </p>

        {/* 추천작 */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white mb-3">{recommendation.reason}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {recommendation.items.map((item, i) => (
              <Link
                key={`${item.title}-${i}`}
                href={item.showing && item.theater && item.time
                  ? `/movie/${encodeURIComponent(item.title)}`
                  : "#"}
                onClick={(e) => {
                  if (!item.showing || !item.theater || !item.time || !selectedDate) {
                    e.preventDefault();
                    return;
                  }
                  const slug = encodeURIComponent(item.title);
                  sessionStorage.setItem(
                    `movieDetail:${slug}`,
                    JSON.stringify({
                      movie: {
                        title: item.title,
                        theater: item.theater,
                        time: item.time,
                        area: "",
                        screen: "",
                        showtime: selectedDate,
                        posterUrl: item.posterUrl,
                      } as MovieSchedule,
                      selectedDate,
                    })
                  );
                }}
                className="flex-shrink-0 w-24"
              >
                <div className="relative w-24 aspect-[2/3] overflow-hidden bg-gray-800 mb-1.5">
                  <PosterImage src={item.posterUrl ?? null} alt={item.title} sizes="96px" />
                  {!item.showing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[9px] text-gray-300 px-1 text-center">상영 예정</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-200 leading-tight truncate">{item.title}</p>
                {item.showing && item.theater && (
                  <p className="text-[10px] text-gray-500 truncate">{item.theater}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <TheaterDetailModal
        isOpen={isTheaterModalOpen}
        onClose={() => setIsTheaterModalOpen(false)}
        theaterName={movie.theater}
      />

      {/* 하단 고정바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-gray-800 px-4 py-3">
        <div className="container mx-auto max-w-2xl flex items-center gap-3">
          <button
            onClick={() => wishlist.toggleWishlist(movie)}
            aria-label={inWishlist ? "찜 목록에서 제거" : "찜 목록에 추가"}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center border border-gray-700 hover:border-orange-500 transition-colors"
          >
            <svg
              className={`w-5 h-5 ${inWishlist ? "text-orange-500" : "text-gray-300"}`}
              fill={inWishlist ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <a
            href={bookingUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!bookingUrl) e.preventDefault();
            }}
            className={`flex-1 py-3 text-center text-sm font-bold transition-colors ${
              bookingUrl
                ? "bg-orange-500 text-black hover:bg-orange-400"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {bookingIsFallback ? "극장 바로가기" : "예매하기"}
          </a>
        </div>
      </div>
    </div>
  );
}
