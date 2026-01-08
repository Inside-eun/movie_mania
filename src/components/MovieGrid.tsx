"use client";

interface MovieSchedule {
  title: string;
  theater: string;
  area: string;
  screen: string;
  time: string;
  showtime: string;
  source?: string;
  movieCode?: string;
  director?: string;
  posterUrl?: string;
  prodYear?: string;
  runtime?: string;
  cActors?: string;
  cCodeSubName2?: string;
}

interface MovieGridProps {
  movies: MovieSchedule[];
  selectedDate: string;
  selectedMovies: string[];
  selectedTheaters: string[];
  onMovieClick: (movie: MovieSchedule) => void;
  onToggleWishlist: (movie: MovieSchedule) => void;
  isInWishlist: (movie: MovieSchedule) => boolean;
}

export default function MovieGrid({
  movies,
  selectedDate,
  selectedMovies,
  selectedTheaters,
  onMovieClick,
  onToggleWishlist,
  isInWishlist,
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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {movies.length}개 상영
        </span>
        {(selectedMovies.length > 0 || selectedTheaters.length > 0) && (
          <span className="text-xs text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded">
            필터 중
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {movies.map((movie, index) => {
          const movieTime = parseMovieTime(movie.time, selectedDate);
          const now = new Date();
          const isToday = selectedDate === getLocalDateString(new Date());
          const isPast = isToday && movieTime <= now;
          
          return (
            <div
              key={index}
              onClick={() => onMovieClick(movie)}
              className={`p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                isPast ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75' : 'bg-white dark:bg-gray-800'
              } border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500`}
            >
              <div className="flex justify-between items-start mb-3">
                <time className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                  isPast ? 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50'
                }`}>
                  {movie.time}
                </time>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(movie);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all active:scale-90 z-10 relative"
                  title={isInWishlist(movie) ? "위시리스트에서 제거" : "위시리스트에 추가"}
                >
                  <svg
                    className={`w-6 h-6 ${
                      isInWishlist(movie) ? 'text-red-500 dark:text-red-400 fill-current' : 'text-gray-400 dark:text-gray-500'
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

              <h2 className="text-base font-bold mb-2 leading-snug text-gray-900 dark:text-gray-100" style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'keep-all'
              }}>
                {movie.title}
              </h2>

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-medium truncate">
                  {movie.theater}
                </span>
                {movie.area && (
                  <span className="text-gray-500 dark:text-gray-500 ml-2 flex-shrink-0 text-xs">
                    {movie.area}
                  </span>
                )}
              </div>

              {movie.screen && (
                <p className="text-gray-500 dark:text-gray-500 text-xs truncate">
                  {movie.screen}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

