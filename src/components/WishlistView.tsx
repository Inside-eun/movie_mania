"use client";

import { useState } from "react";
import CalendarView from "./CalendarView";

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

interface WishlistViewProps {
  wishlistMovies: MovieSchedule[];
  wishlistCount: number;
  onMovieClick: (movie: MovieSchedule) => void;
  onToggleWishlist: (movie: MovieSchedule) => void;
  onClearAll: () => void;
  getWishlistByDate: () => { date: string; movies: MovieSchedule[] }[];
}

export default function WishlistView({
  wishlistMovies,
  wishlistCount,
  onMovieClick,
  onToggleWishlist,
  onClearAll,
  getWishlistByDate,
}: WishlistViewProps) {
  const [wishlistViewMode, setWishlistViewMode] = useState<"list" | "calendar">("calendar");

  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, '0');
    const day = String(seoulDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6">

      {/* 달력/리스트 전환 탭 */}
      {wishlistCount > 0 && (
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
          <button
            onClick={() => setWishlistViewMode("calendar")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              wishlistViewMode === "calendar"
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            달력
          </button>
          <button
            onClick={() => setWishlistViewMode("list")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              wishlistViewMode === "list"
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            리스트
          </button>
        </div>
      )}

      {wishlistCount === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-lg mb-2 text-gray-900 dark:text-gray-100">아직 찜한 영화가 없습니다</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">영화 카드의 하트 아이콘을 클릭해서 찜 목록에 추가해보세요!</p>
        </div>
      ) : wishlistViewMode === "calendar" ? (
        <CalendarView
          wishlistMovies={wishlistMovies}
          onMovieClick={onMovieClick}
          onRemoveFromWishlist={onToggleWishlist}
        />
      ) : (
        <div className="space-y-8">
          {getWishlistByDate().map(({ date, movies }) => (
            <div key={date} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({movies.length}개)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map((movie) => {
                  const now = new Date();
                  const movieDateTime = new Date(movie.showtime || `${date}T${movie.time}:00`);
                  const isPast = movieDateTime < now;
                  const isToday = date === getLocalDateString(new Date());
                  
                  return (
                    <div
                      key={`${movie.title}-${movie.theater}-${movie.time}`}
                      onClick={() => onMovieClick(movie)}
                      className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                        isPast ? 'bg-gray-100 dark:bg-gray-800 opacity-80' : 'bg-gray-50 dark:bg-gray-700'
                      } border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <time className={`text-sm font-bold px-2 py-1 rounded ${
                          isPast
                            ? 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700'
                            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                        }`}>
                          {movie.time}
                        </time>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(movie);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors z-10 relative"
                          title="찜 목록에서 제거"
                        >
                          <svg className="w-5 h-5 text-red-500 dark:text-red-400 fill-current" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      <h3 className={`text-base font-semibold mb-2 leading-tight ${
                        isPast ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
                      }`} style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'keep-all'
                      }}>
                        {movie.title}
                      </h3>

                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium truncate">{movie.theater}</p>
                        {movie.area && <p className="text-gray-500 dark:text-gray-500">{movie.area}</p>}
                        {movie.screen && <p className="text-gray-500 dark:text-gray-500 truncate">{movie.screen}</p>}
                      </div>
                    
                      {isPast && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                          {isToday ? '이미 상영이 시작되었습니다' : '지난 상영 일정입니다'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 전체 삭제 버튼 */}
      {wishlistCount > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              if (window.confirm('찜 목록을 모두 삭제하시겠어요?\n삭제된 데이터는 복구되지 않습니다.')) {
                onClearAll();
              }
            }}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            전체 삭제
          </button>
        </div>
      )}
    </div>
  );
}

