"use client";

import {
  SortType,
  UserLocation,
} from '@/hooks/useMovieFilter';
import { MovieSchedule } from '@/types';
import { calculateDistance } from '@/utils/date';

import PosterImage from './PosterImage';

interface MovieGridProps {
  movies: MovieSchedule[];
  selectedDate: string;
  selectedMovies: string[];
  selectedTheaters: string[];
  onMovieClick: (movie: MovieSchedule) => void;
  onToggleWishlist: (movie: MovieSchedule) => void;
  isInWishlist: (movie: MovieSchedule) => boolean;
  sortType?: SortType;
  userLocation?: UserLocation | null;
  locationError?: string | null;
  onSortTypeChange?: (type: SortType) => void;
}

export default function MovieGrid({
  movies,
  selectedDate,
  onMovieClick,
  onToggleWishlist,
  isInWishlist,
  sortType = "time",
  userLocation = null,
  locationError = null,
  onSortTypeChange,
}: MovieGridProps) {
  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, "0");
    const day = String(seoulDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseMovieTime = (timeStr: string, date: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const movieDate = new Date(date);
    movieDate.setHours(hours, minutes, 0, 0);
    return movieDate;
  };

  const now = new Date();
  const isToday = selectedDate === getLocalDateString(new Date());

  const futureMovies = movies.filter((movie) => {
    if (!isToday) return true;
    return parseMovieTime(movie.time, selectedDate) > now;
  });

  const sortedMovies = [...futureMovies].sort((a, b) => {
    if (sortType === "time") {
      return (
        parseMovieTime(a.time, selectedDate).getTime() -
        parseMovieTime(b.time, selectedDate).getTime()
      );
    } else if (sortType === "distance" && userLocation) {
      const dA =
        a.latitude && a.longitude
          ? calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
          : Infinity;
      const dB =
        b.latitude && b.longitude
          ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
          : Infinity;
      return dA - dB;
    }
    return 0;
  });

  return (
    <div>
      {/* 정렬 컨트롤 */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{futureMovies.length}개 상영</span>
        <div className="flex items-center gap-1">
          {sortType === "distance" && locationError && (
            <span className="text-xs text-red-500 mr-2">{locationError}</span>
          )}
          {onSortTypeChange && (
            <div className="flex gap-1">
              <button
                onClick={() => onSortTypeChange("time")}
                className={`px-2.5 py-1 text-xs font-medium transition-all ${
                  sortType === "time"
                    ? "bg-orange-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                시간순
              </button>
              <button
                onClick={() => onSortTypeChange("distance")}
                className={`px-2.5 py-1 text-xs font-medium transition-all ${
                  sortType === "distance"
                    ? "bg-orange-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                거리순
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 영화 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedMovies.map((movie, index) => {
          const posterUrl = movie.tmdbPosterUrl || movie.posterUrl || null;
          const distance =
            userLocation && movie.latitude && movie.longitude
              ? calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  movie.latitude,
                  movie.longitude,
                ).toFixed(1) + "km"
              : movie.area || null;

          return (
            <div
              key={index}
              onClick={() => onMovieClick(movie)}
              className="overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-200 bg-gray-900 flex flex-col"
            >
              {/* 포스터 */}
              <div className="relative w-full aspect-[2/3] bg-gray-800 flex-shrink-0">
                <PosterImage
                  src={posterUrl}
                  alt={movie.title}
                  priority={index < 4}
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />

                {/* 위시리스트 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(movie);
                  }}
                  aria-label={isInWishlist(movie) ? "찜 목록에서 제거" : "찜 목록에 추가"}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-all active:scale-90"
                >
                  <svg
                    className={`w-3.5 h-3.5 ${isInWishlist(movie) ? "text-orange-500" : "text-white"}`}
                    fill={isInWishlist(movie) ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* 정보 영역 - 제목, 영화관, 거리 */}
              <div className="p-2.5 flex flex-col gap-1">
                <div className="flex items-start gap-1.5">
                  <h2 className="text-xs font-bold text-white leading-snug flex-1 min-w-0 truncate">
                    {movie.title}
                  </h2>
                  <time className="text-[14px] font-bold text-orange-500 flex-shrink-0 leading-snug">
                    {movie.time}
                  </time>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 truncate">{movie.theater}</span>
                  {distance && (
                    <span className="text-[11px] text-gray-500 ml-1 flex-shrink-0">{distance}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
