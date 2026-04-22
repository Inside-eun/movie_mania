"use client";

import { MovieSchedule } from "@/types";
import { SortType, UserLocation } from "@/hooks/useMovieFilter";
import { calculateDistance } from "@/utils/date";

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
  selectedMovies,
  selectedTheaters,
  onMovieClick,
  onToggleWishlist,
  isInWishlist,
  sortType = "time",
  userLocation = null,
  locationError = null,
  onSortTypeChange,
}: MovieGridProps) {
  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, '0');
    const day = String(seoulDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseMovieTime = (timeStr: string, selectedDate: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const movieDate = new Date(selectedDate);
    movieDate.setHours(hours, minutes, 0, 0);
    return movieDate;
  };

  const now = new Date();
  const isToday = selectedDate === getLocalDateString(new Date());
  
  const futureMovies = movies.filter((movie) => {
    if (!isToday) return true;
    const movieTime = parseMovieTime(movie.time, selectedDate);
    return movieTime > now;
  });

  const sortedMovies = [...futureMovies].sort((a, b) => {
    if (sortType === "time") {
      const timeA = parseMovieTime(a.time, selectedDate).getTime();
      const timeB = parseMovieTime(b.time, selectedDate).getTime();
      return timeA - timeB;
    } else if (sortType === "distance" && userLocation) {
      const distanceA = a.latitude && a.longitude 
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.latitude,
            a.longitude
          )
        : Infinity;
      const distanceB = b.latitude && b.longitude
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude
          )
        : Infinity;
      return distanceA - distanceB;
    }
    return 0;
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {futureMovies.length}개 상영
        </span>
        
        <div className="flex items-center gap-1">
          {sortType === "distance" && locationError && (
            <span className="text-xs text-red-500 dark:text-red-400 mr-2">
              {locationError}
            </span>
          )}
          
          {onSortTypeChange && (
            <div className="flex gap-1">
              <button
                onClick={() => onSortTypeChange("time")}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  sortType === "time"
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="빠른 상영 시간순으로 정렬"
              >
                시간순
              </button>
              <button
                onClick={() => onSortTypeChange("distance")}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  sortType === "distance"
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="가까운 영화관순으로 정렬"
              >
                거리순
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedMovies.map((movie, index) => {
          const posterUrl = movie.tmdbPosterUrl || movie.posterUrl || null;
          const year = movie.tmdbReleaseDate
            ? movie.tmdbReleaseDate.slice(0, 4)
            : movie.prodYear || null;

          return (
            <div
              key={index}
              onClick={() => onMovieClick(movie)}
              className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 overflow-hidden flex flex-col"
            >
              {/* 포스터 영역 */}
              <div className="relative w-full aspect-[2/3] bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                )}

                {/* 상영 시간 뱃지 (포스터 위 좌측 하단) */}
                <div className="absolute bottom-2 left-2">
                  <time className="text-xs font-bold px-2 py-1 rounded-md bg-black/70 text-white backdrop-blur-sm">
                    {movie.time}
                  </time>
                </div>

                {/* 위시리스트 버튼 (포스터 위 우측 상단) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(movie);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-all active:scale-90 backdrop-blur-sm"
                  title={isInWishlist(movie) ? "위시리스트에서 제거" : "위시리스트에 추가"}
                >
                  <svg
                    className={`w-4 h-4 ${
                      isInWishlist(movie) ? 'text-red-400 fill-current' : 'text-white'
                    }`}
                    fill={isInWishlist(movie) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* 영화 정보 영역 */}
              <div className="p-3 flex flex-col gap-1 flex-1">
                <h2
                  className="text-sm font-bold leading-snug text-gray-900 dark:text-gray-100"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'keep-all',
                  }}
                >
                  {movie.title}
                </h2>

                {(movie.director || year) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {[movie.director, year].filter(Boolean).join(' · ')}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-auto pt-1">
                  <span className="font-medium truncate">{movie.theater}</span>
                  {sortType === "distance" && userLocation && movie.latitude && movie.longitude && (
                    <span className="text-gray-500 dark:text-gray-500 ml-1 flex-shrink-0">
                      {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        movie.latitude,
                        movie.longitude
                      ).toFixed(1)}km
                    </span>
                  )}
                  {(sortType === "time" || !userLocation) && movie.area && (
                    <span className="text-gray-500 dark:text-gray-500 ml-1 flex-shrink-0">
                      {movie.area}
                    </span>
                  )}
                </div>

                {movie.screen && (
                  <p className="text-gray-400 dark:text-gray-500 text-xs truncate">
                    {movie.screen}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
