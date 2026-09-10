"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import PosterImage from "@/components/PosterImage";
import TheaterMap from "@/components/TheaterMap";
import { getBookingFallbackUrl } from "@/lib/bookingFallbacks";
import { useWishlist } from "@/hooks";
import { MovieSchedule, ScheduleResponse } from "@/types";
import { getRecommendations, isEventMovie, CreditsByTitle } from "@/mock/recommendations";
import { getTheaterDetailByName } from "@/mock/theaterDetails";

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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-orange-500 text-xs w-16 flex-shrink-0">{label}</span>
      {children}
    </div>
  );
}

function SkeletonRow({ label, width }: { label: string; width: string }) {
  return (
    <InfoRow label={label}>
      <span className={`skeleton-bar h-3 ${width}`} />
    </InfoRow>
  );
}

export default function MovieDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [stored, setStored] = useState<StoredMovieDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dateMovies, setDateMovies] = useState<MovieSchedule[]>([]);
  const [creditsByTitle, setCreditsByTitle] = useState<CreditsByTitle>({});
  const [creditsLoading, setCreditsLoading] = useState(true);

  const [kobisData, setKobisData] = useState<KOBISMovieInfo | null>(null);
  const [kmdbData, setKmdbData] = useState<KMDBApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [bookingIsFallback, setBookingIsFallback] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);


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
  const theaterDetail = movie?.theater ? getTheaterDetailByName(movie.theater) : undefined;
  const wishlist = useWishlist(selectedDate ?? "");

  // 추천작 섹션에 쓸 해당 날짜의 실제 상영 데이터 (홈 화면 캐시 우선, 없으면 조회)
  useEffect(() => {
    if (!selectedDate) return;

    try {
      const cached = localStorage.getItem(`schedules_v1_${selectedDate}`);
      if (cached) {
        const entry = JSON.parse(cached) as { movies: MovieSchedule[] };
        setDateMovies(entry.movies);
        return;
      }
    } catch {
      // 캐시 파싱 실패 시 API 조회로 진행
    }

    fetch(`/api/schedules?type=integrated&date=${selectedDate}`)
      .then((res) => res.json())
      .then((data: ScheduleResponse) => {
        if (data.success) setDateMovies(data.data);
      })
      .catch(() => {});
  }, [selectedDate]);

  // 추천작 감독/출연진 매칭용 크레딧 (해당 날짜 상영작 전체 + 현재 영화)
  useEffect(() => {
    if (!movie || dateMovies.length === 0) return;

    const titles = Array.from(new Set([movie.title, ...dateMovies.map((m) => m.title)]));
    const controller = new AbortController();

    setCreditsLoading(true);

    fetch("/api/movie-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { success: boolean; data?: CreditsByTitle }) => {
        if (data.success && data.data) setCreditsByTitle(data.data);
      })
      .catch(() => {})
      .finally(() => setCreditsLoading(false));

    return () => controller.abort();
  }, [movie, dateMovies]);

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

    const fallback = getBookingFallbackUrl(movie.theater, movie.title);
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
  // 멀티플렉스(CGV/롯데시네마/메가박스/씨네큐)는 광고·예고편이 붙어 정시 상영이 아니므로 안내 문구를 뺀다.
  const isMultiplexTheater = ["cgv", "롯데시네마", "메가박스", "씨네큐"].some((chain) =>
    movie.theater?.toLowerCase().includes(chain)
  );

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

  const recommendationReady =
    dateMovies.length > 0 && (isEventMovie(movie.title) || !creditsLoading);
  const recommendation = recommendationReady
    ? getRecommendations(movie, dateMovies, creditsByTitle)
    : null;
  const inWishlist = wishlist.isInWishlist(movie);

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-[calc(6rem_+_env(safe-area-inset-bottom))]">
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

            <div className="flex flex-col gap-1.5">
              {director ? (
                <InfoRow label="감독">
                  <span className="text-gray-200 text-xs truncate">{director}</span>
                </InfoRow>
              ) : loading ? (
                <SkeletonRow label="감독" width="w-20" />
              ) : null}

              {prodYear ? (
                <InfoRow label="제작년도">
                  <span className="text-gray-200 text-xs">{prodYear}년</span>
                </InfoRow>
              ) : loading ? (
                <SkeletonRow label="제작년도" width="w-10" />
              ) : null}

              {runtime ? (
                <InfoRow label="러닝타임">
                  <span className="text-gray-200 text-xs">{runtime}분</span>
                </InfoRow>
              ) : loading ? (
                <SkeletonRow label="러닝타임" width="w-12" />
              ) : null}

              <InfoRow label="상영시간">
                <span className="text-orange-400 text-xs font-semibold flex items-center gap-1.5">
                  {movie.time}
                  {endTime ? (
                    <span className="text-gray-400 font-normal"> ~ {endTime}</span>
                  ) : loading ? (
                    <span className="skeleton-bar h-2.5 w-10 inline-block" />
                  ) : null}
                </span>
              </InfoRow>

              {genres ? (
                <InfoRow label="장르">
                  <span className="text-gray-200 text-xs">{genres}</span>
                </InfoRow>
              ) : loading ? (
                <SkeletonRow label="장르" width="w-24" />
              ) : null}

              {rating ? (
                <InfoRow label="관람등급">
                  <span className="text-gray-200 text-xs">{rating}</span>
                </InfoRow>
              ) : loading ? (
                <SkeletonRow label="관람등급" width="w-14" />
              ) : null}

              <div className="flex items-center gap-2 pt-1">
                <span className="text-orange-500 text-xs w-16 flex-shrink-0">영화관</span>
                <span className="text-gray-200 text-xs truncate">{movie.theater}</span>
              </div>
            </div>
          </div>

          <div className="relative flex-shrink-0 w-28 aspect-[2/3] overflow-hidden shadow-2xl order-2">
            <PosterImage src={posterUrl} alt={movie.title} priority sizes="112px" />
          </div>
        </div>

        {/* 극장 위치 지도 */}
        <TheaterMap
          height={260}
          lat={theaterDetail?.lat}
          lng={theaterDetail?.lng}
          name={movie.theater}
          address={theaterDetail?.address}
        />
        <div className="mt-2 mb-6">
          {!isMultiplexTheater && (
            <p className="text-[11px] text-gray-500">* 본 영화관은 정시 상영합니다.</p>
          )}
        </div>

        {/* 추천작 */}
        {!recommendationReady && (
          <div className="mb-6">
            <span className="skeleton-bar inline-block h-4 w-32 mb-3" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-24">
                  <div className="skeleton-bar w-24 aspect-[2/3] mb-1.5" />
                  <span className="skeleton-bar block h-3 w-full mb-1" />
                  <span className="skeleton-bar block h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendationReady && recommendation && recommendation.items.length > 0 && (
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
        )}
      </div>

      {/* 하단 고정바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-gray-800 px-4 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
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
