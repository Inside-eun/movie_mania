"use client";

import { useState, useMemo } from "react";

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

interface CalendarViewProps {
  wishlistMovies: MovieSchedule[];
  onMovieClick: (movie: MovieSchedule) => void;
  onRemoveFromWishlist: (movie: MovieSchedule) => void;
}

export default function CalendarView({ wishlistMovies, onMovieClick, onRemoveFromWishlist }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // 서울 시간 기준 날짜 문자열 생성 함수 (Asia/Seoul 시간대)
  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, '0');
    const day = String(seoulDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜별 영화 그룹화
  const moviesByDate = useMemo(() => {
    const grouped: { [date: string]: MovieSchedule[] } = {};
    
    wishlistMovies.forEach((movie) => {
      let date = getLocalDateString(new Date());
      
      if (movie.showtime) {
        try {
          const parsedDate = new Date(movie.showtime);
          if (!isNaN(parsedDate.getTime())) {
            date = getLocalDateString(parsedDate);
          }
        } catch (e) {
          // 날짜 파싱 실패 시 기본값 사용
        }
      }
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(movie);
    });

    // 각 날짜의 영화를 시간순 정렬
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  }, [wishlistMovies]);

  // 달력 생성을 위한 날짜 배열
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 해당 월의 첫날과 마지막날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 시작 주의 일요일부터 시작
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // 마지막 주의 토요일까지
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return getLocalDateString(date) === getLocalDateString(today);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const getDateString = (date: Date) => {
    return getLocalDateString(date);
  };

  const hasMovies = (date: Date) => {
    const dateStr = getDateString(date);
    return moviesByDate[dateStr] && moviesByDate[dateStr].length > 0;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = getDateString(date);
    if (hasMovies(date)) {
      setSelectedDateForModal(dateStr);
      setIsDateModalOpen(true);
    }
  };

  const closeDateModal = () => {
    setIsDateModalOpen(false);
    setSelectedDateForModal(null);
  };

  const handleMovieClickFromModal = (movie: MovieSchedule) => {
    closeDateModal();
    onMovieClick(movie);
  };

  return (
    <div className="space-y-4">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </h3>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-semibold py-2 ${
              index === 0 ? 'text-red-500 dark:text-red-400' : 
              index === 6 ? 'text-blue-500 dark:text-blue-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {calendarDays.map((date, index) => {
          const dateStr = getDateString(date);
          const movies = moviesByDate[dateStr] || [];
          const today = isToday(date);
          const currentMonthDay = isCurrentMonth(date);
          const now = new Date();
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`min-h-[80px] sm:min-h-[120px] border rounded-lg p-2 relative ${
                currentMonthDay 
                  ? movies.length > 0 
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
              } ${today ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} ${
                movies.length > 0 ? 'cursor-pointer hover:shadow-md transition-all' : ''
              }`}
            >
              <div className={`text-right text-sm font-medium mb-1 ${
                !currentMonthDay ? 'text-gray-400 dark:text-gray-600' :
                index % 7 === 0 ? 'text-red-500 dark:text-red-400' :
                index % 7 === 6 ? 'text-blue-500 dark:text-blue-400' :
                movies.length > 0 ? 'text-blue-600 dark:text-blue-400 font-bold' :
                'text-gray-700 dark:text-gray-300'
              }`}>
                {date.getDate()}
              </div>
              
              {/* 모바일: 하트와 영화 개수 표시 */}
              {movies.length > 0 && (
                <div className="sm:hidden flex items-center justify-center gap-1 flex-1 min-h-[40px]">
                  <svg className="w-5 h-5 text-blue-500 dark:text-white fill-current" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-bold text-blue-500 dark:text-white">
                    {movies.length}
                  </span>
                </div>
              )}
              
              {/* 데스크톱: 영화 카드 표시 */}
              {movies.length > 0 && (
                <div className="hidden sm:block space-y-1">
                  {movies.slice(0, 2).map((movie, idx) => {
                    const movieDateTime = new Date(movie.showtime || `${dateStr}T${movie.time}:00`);
                    const isPast = movieDateTime < now;
                    
                    return (
                      <div
                        key={idx}
                        className={`text-xs p-1.5 rounded pointer-events-none ${
                          isPast 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 opacity-75' 
                            : 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        <div className="font-semibold truncate text-[10px] mb-0.5">
                          {movie.time}
                        </div>
                        <div className="truncate font-medium text-[11px] leading-tight">
                          {movie.title}
                        </div>
                        <div className="truncate text-[10px] opacity-80 mt-0.5">
                          {movie.theater}
                        </div>
                      </div>
                    );
                  })}
                  
                  {movies.length > 2 && (
                    <div className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-1 py-1">
                      +{movies.length - 2}개
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded"></div>
          <span>예정된 상영</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"></div>
          <span>지난 상영</span>
        </div>
      </div>

      {/* 날짜별 영화 목록 모달 */}
      {isDateModalOpen && selectedDateForModal && moviesByDate[selectedDateForModal] && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeDateModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {new Date(selectedDateForModal).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
                <span className="ml-3 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({moviesByDate[selectedDateForModal].length}개)
                </span>
              </h2>
              <button
                onClick={closeDateModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 콘텐츠 */}
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moviesByDate[selectedDateForModal].map((movie, idx) => {
                  const now = new Date();
                  const movieDateTime = new Date(movie.showtime || `${selectedDateForModal}T${movie.time}:00`);
                  const isPast = movieDateTime < now;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => handleMovieClickFromModal(movie)}
                      className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                        isPast 
                          ? 'bg-gray-50 dark:bg-gray-800 opacity-75 border-gray-200 dark:border-gray-700' 
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
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
                            onRemoveFromWishlist(movie);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
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
                          이미 상영이 시작되었습니다
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

