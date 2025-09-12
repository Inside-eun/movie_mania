"use client";

import { useState, useMemo, useEffect, useRef } from "react";

interface MovieSchedule {
  title: string;
  theater: string;
  area: string;
  screen: string;
  time: string;
  showtime: string;
  director?: string;
  source?: string;
  movieCode?: string;
}

interface CrawlResponse {
  success: boolean;
  count: number;
  data: MovieSchedule[];
  timestamp: string;
  error?: string;
}


export default function Home() {
  const [allMovies, setAllMovies] = useState<MovieSchedule[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<MovieSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawlType, setCrawlType] = useState("integrated");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMovie, setSelectedMovie] = useState("all");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [showPastSchedules, setShowPastSchedules] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistMovies, setWishlistMovies] = useState<MovieSchedule[]>([]);
  const [showWishlistView, setShowWishlistView] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // localStorage에서 위시리스트 로드
  useEffect(() => {
    const savedWishlist = localStorage.getItem('movieWishlist');
    const savedWishlistMovies = localStorage.getItem('movieWishlistMovies');
    
    if (savedWishlist) {
      const parsedWishlist = JSON.parse(savedWishlist);
      setWishlist(new Set(parsedWishlist));
    }
    
    if (savedWishlistMovies) {
      const parsedMovies = JSON.parse(savedWishlistMovies);
      setWishlistMovies(parsedMovies);
    }
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/crawl?type=${crawlType}&date=${selectedDate}`
      );
      const data: CrawlResponse = await response.json();

      if (data.success) {
        setAllMovies(data.data);
        setFilteredMovies(data.data);
        setSelectedMovie("all"); // 새로 크롤링하면 필터 초기화
        setLastUpdate(new Date(data.timestamp).toLocaleString("ko-KR"));
      } else {
        setError(data.error || "크롤링 실패");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 고유한 영화 목록 가져오기
  const getUniqueMovies = () => {
    const uniqueTitles = [...new Set(allMovies.map((movie) => movie.title))];
    return uniqueTitles.sort();
  };

  // 시간 파싱 함수
  const parseMovieTime = (timeStr: string, selectedDate: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const movieDate = new Date(selectedDate);
    movieDate.setHours(hours, minutes, 0, 0);
    return movieDate;
  };

  // 영화 고유 키 생성 (movieCode + 극장명 + 시간)
  const getMovieKey = (movie: MovieSchedule) => {
    // movieCode가 있으면 더 정확한 고유키 생성, 없으면 기존 방식
    const baseKey = movie.movieCode 
      ? `${movie.movieCode}-${movie.theater}-${movie.time}`
      : `${movie.title}-${movie.theater}-${movie.time}`;
    return baseKey;
  };

  // 영화가 위시리스트에 있는지 확인
  const isInWishlist = (movie: MovieSchedule) => {
    const movieKey = getMovieKey(movie);
    const isInList = wishlist.has(movieKey);
    return isInList;
  };

  // 현재 시간 기준으로 영화 스케줄 필터링
  const getFilteredMoviesByTime = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === new Date().toISOString().split("T")[0];
    
    let movies = allMovies;
    
    // 영화별 필터링
    if (selectedMovie !== "all") {
      movies = movies.filter((movie) => movie.title === selectedMovie);
    }
    
    // 오늘 날짜이고 과거 스케줄을 숨기는 옵션이 켜져있다면
    if (isToday && !showPastSchedules) {
      movies = movies.filter((movie) => {
        const movieTime = parseMovieTime(movie.time, selectedDate);
        return movieTime > now;
      });
    }
    
    return movies;
  }, [allMovies, selectedMovie, selectedDate, showPastSchedules, wishlist]);

  // 과거 스케줄 개수 계산
  const pastSchedulesCount = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === new Date().toISOString().split("T")[0];
    
    if (!isToday) return 0;
    
    let movies = allMovies;
    if (selectedMovie !== "all") {
      movies = movies.filter((movie) => movie.title === selectedMovie);
    }
    
    return movies.filter((movie) => {
      const movieTime = parseMovieTime(movie.time, selectedDate);
      return movieTime <= now;
    }).length;
  }, [allMovies, selectedMovie, selectedDate, wishlist]);

  // 영화 필터링
  const handleMovieFilter = (movieTitle: string) => {
    setSelectedMovie(movieTitle);
    setIsDropdownOpen(false);
  };

  // 위시리스트 토글 함수
  const toggleWishlist = (movie: MovieSchedule) => {
    const movieKey = getMovieKey(movie);
    const newWishlist = new Set(wishlist);
    const newWishlistMovies = [...wishlistMovies];
    const wasInWishlist = newWishlist.has(movieKey);
    
    if (wasInWishlist) {
      newWishlist.delete(movieKey);
      // 영화 목록에서도 제거
      const movieIndex = newWishlistMovies.findIndex(m => getMovieKey(m) === movieKey);
      if (movieIndex > -1) {
        newWishlistMovies.splice(movieIndex, 1);
      }
    } else {
      newWishlist.add(movieKey);
      // 영화 목록에도 추가 (현재 선택된 날짜와 시간으로 정확한 showtime 생성)
      const [hours, minutes] = movie.time.split(':').map(Number);
      const correctShowtime = new Date(selectedDate);
      correctShowtime.setHours(hours, minutes, 0, 0);
      
      const movieWithCorrectDate = {
        ...movie,
        showtime: correctShowtime.toISOString()
      };
      newWishlistMovies.push(movieWithCorrectDate);
    }
    
    setWishlist(newWishlist);
    setWishlistMovies(newWishlistMovies);
    localStorage.setItem('movieWishlist', JSON.stringify([...newWishlist]));
    localStorage.setItem('movieWishlistMovies', JSON.stringify(newWishlistMovies));
  };

  // 위시리스트 개수 계산 (순수하게 wishlist Set의 크기만 반환)
  const getWishlistCount = () => {
    return wishlist.size;
  };

  // 위시리스트에서 영화 정보를 복원하는 함수
  const getWishlistMoviesFromKeys = () => {
    const wishlistMovies: MovieSchedule[] = [];
    
    wishlist.forEach((key) => {
      // 키에서 정보 추출: "movieCode-theater-time" 또는 "title-theater-time"
      const parts = key.split('-');
      if (parts.length >= 3) {
        const time = parts[parts.length - 1];
        const theater = parts[parts.length - 2];
        const titleOrCode = parts.slice(0, -2).join('-');
        
        // 현재 allMovies에서 해당 영화를 찾아보기
        const foundMovie = allMovies.find(movie => getMovieKey(movie) === key);
        
        if (foundMovie) {
          wishlistMovies.push(foundMovie);
        } else {
          // 현재 allMovies에 없다면 키 정보로 기본 영화 객체 생성
          wishlistMovies.push({
            title: titleOrCode.startsWith('20') ? '알 수 없는 영화' : titleOrCode, // movieCode로 시작하면
            theater: theater,
            time: time,
            area: '',
            screen: '',
            showtime: selectedDate, // 임시로 현재 선택 날짜 사용
            movieCode: titleOrCode.startsWith('20') ? titleOrCode : undefined
          });
        }
      }
    });
    
    return wishlistMovies;
  };

  // 위시리스트 영화들을 날짜별로 그룹화
  const getWishlistByDate = () => {
    const groupedByDate: { [date: string]: MovieSchedule[] } = {};
    
    wishlistMovies.forEach((movie) => {
      let date = selectedDate; // 기본값으로 현재 선택된 날짜 사용
      
      // showtime이 있고 유효한 날짜 형식이면 파싱
      if (movie.showtime) {
        try {
          const parsedDate = new Date(movie.showtime);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          // 날짜 파싱 실패 시 기본값 사용
        }
      }
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(movie);
    });

    // 날짜순으로 정렬
    const sortedDates = Object.keys(groupedByDate).sort();
    const result: { date: string; movies: MovieSchedule[] }[] = [];
    
    sortedDates.forEach((date) => {
      // 각 날짜의 영화들을 시간순으로 정렬
      const sortedMovies = groupedByDate[date].sort((a, b) => {
        return a.time.localeCompare(b.time);
      });
      result.push({ date, movies: sortedMovies });
    });
    
    return result;
  };

  // 선택된 영화 표시 텍스트
  const getSelectedMovieText = () => {
    if (selectedMovie === "all") {
      return `전체 영화 (${allMovies.length}개)`;
    }
    const count = allMovies.filter((m) => m.title === selectedMovie).length;
    return `${selectedMovie} (${count}개)`;
  };

  return (
    <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      <h1 className="text-3xl sm:text-3xl font-bold mb-1 text-center">
        홍대병들을 위한<br className="sm:hidden"/> 서울예술영화관 상영시간표
      </h1>
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">
        박스오피스 5위까지의 작품은 제외합니다
      </h2>

      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-8 text-center px-2">
        KOBIS조회 방식이기 때문에 실제 상영내역과 일치하지 않을 수 있으며,<br className="hidden sm:block"/> 각 전송사업자별로 상영스케줄 운영방식에 따라 개별 영화상영관의 상영스케줄 일부 정보가 제공되지 않을 수 있습니다.
      </p>

      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          <div className="flex gap-2 w-full flex-wrap">
            <input
              type="date"
              className="px-3 py-2 border rounded-lg h-10 text-sm flex-shrink-0 w-auto"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                // 날짜가 바뀌면 기존 영화 목록 초기화하여 혼란 방지
                setAllMovies([]);
                setFilteredMovies([]);
                setSelectedMovie("all");
                setLastUpdate(null);
              }}
              min={new Date().toISOString().split("T")[0]}
              max={
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0]
              } // 7일 후까지 (모바일에서도 적용)
              disabled={false}
            />
            <button
              onClick={() => {
                if (showWishlistView) {
                  setShowWishlistView(false);
                }
                fetchMovies();
              }}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed h-10 flex items-center justify-center whitespace-nowrap"
            >
              {loading ? "크롤링 중... " : "시간표 조회"}
            </button>

            <button
              onClick={() => {
                if (!showWishlistView) {
                  setShowWishlistView(true);
                }
              }}
              disabled={showWishlistView}
              className={`px-6 py-2 rounded-lg h-10 flex items-center justify-center gap-2 whitespace-nowrap transition-colors ${
                showWishlistView 
                  ? 'bg-red-600 text-white cursor-not-allowed opacity-75' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <svg className="w-6 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
               {getWishlistCount()}
            </button>
          </div>

          {lastUpdate && !showWishlistView && (
            <span className="text-sm text-gray-500">
              마지막 업데이트: {lastUpdate}
            </span>
          )}
        </div>

        {allMovies.length > 0 && !showWishlistView && (
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative w-full" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left text-gray-900 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 flex items-center justify-between min-h-[48px] sm:min-h-[40px]"
                >
                  <span className="truncate">{getSelectedMovieText()}</span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      onClick={() => handleMovieFilter("all")}
                      className={`px-4 py-4 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors text-base ${
                        selectedMovie === "all" ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-900'
                      }`}
                    >
                      전체 영화 ({allMovies.length}개)
                    </div>
                    {getUniqueMovies().map((movieTitle) => {
                      const count = allMovies.filter((m) => m.title === movieTitle).length;
                      return (
                        <div
                          key={movieTitle}
                          onClick={() => handleMovieFilter(movieTitle)}
                          className={`px-4 py-4 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors border-t border-gray-100 text-base ${
                            selectedMovie === movieTitle ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-900'
                          }`}
                        >
                          {movieTitle} ({count}개)
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {selectedDate === new Date().toISOString().split("T")[0] && pastSchedulesCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setShowPastSchedules(!showPastSchedules)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showPastSchedules ? 'rotate-90' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>
                    지난 상영시간 {showPastSchedules ? '접기' : '펼치기'} ({pastSchedulesCount}개)
                  </span>
                </button>
                <span className="text-xs text-gray-500">
                  현재 시간: {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">상영시간표를 불러오는 중...</p>
          <p className="mt-2 text-gray-600">최대 1분정도 걸릴 수 있습니다</p>
        </div>
      )}

      {!loading && !showWishlistView && getFilteredMoviesByTime.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            {new Date(selectedDate).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}{" "}
            - 총 {getFilteredMoviesByTime.length}개의 상영 스케줄
            {selectedMovie !== "all" && (
              <span className="ml-2 text-blue-600 font-medium">
                (&apos;{selectedMovie}&apos; 필터 적용)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {getFilteredMoviesByTime.map((movie, index) => {
              const movieTime = parseMovieTime(movie.time, selectedDate);
              const now = new Date();
              const isToday = selectedDate === new Date().toISOString().split("T")[0];
              const isPast = isToday && movieTime <= now;
              
              return (
              <div
                key={index}
                className={`p-2 md:p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                  isPast ? 'bg-gray-50 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <time className={`text-xs md:text-sm font-bold px-1 md:px-2 py-1 rounded ${
                    isPast ? 'text-gray-500 bg-gray-200' : 'text-blue-600 bg-blue-50'
                  }`}>
                    {movie.time}
                  </time>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(movie);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title={isInWishlist(movie) ? "위시리스트에서 제거" : "위시리스트에 추가"}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        isInWishlist(movie) ? 'text-red-500 fill-current' : 'text-gray-400'
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

                <h2 className="text-sm md:text-base font-semibold mb-1 md:mb-2 line-clamp-2">
                  {movie.title}
                </h2>

                <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                  <span className="font-medium truncate text-xs">
                    {movie.theater}
                  </span>
                  {movie.area && (
                    <span className="text-gray-500 ml-1 md:ml-2 flex-shrink-0 text-xs">
                      {movie.area}
                    </span>
                  )}
                </div>

                {movie.screen && (
                  <p className="text-gray-500 text-xs mb-1 truncate">
                    {movie.screen}
                  </p>
                )}
                {movie.director && (
                  <p className="text-gray-500 text-xs truncate">
                    감독: {movie.director}
                  </p>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !showWishlistView && allMovies.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-2">
            {new Date(selectedDate).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })} 상영시간표를 조회해주세요.
          </div>
          <div className="text-sm">
            상영시간표 조회 버튼을 클릭하시면 해당 날짜의 스케줄을 불러옵니다.
          </div>
        </div>
      )}

      {!loading && !showWishlistView && allMovies.length > 0 && getFilteredMoviesByTime.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {selectedDate === new Date().toISOString().split("T")[0] && !showPastSchedules 
            ? "현재 시간 이후의 상영시간이 없습니다. 지난 상영시간을 보시려면 위의 체크박스를 선택해주세요."
            : "선택한 영화의 상영시간이 없습니다."
          }
        </div>
      )}

      {/* 찜 목록 뷰 */}
      {showWishlistView && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">나의 찜 목록</h2>
            <p className="text-sm text-gray-600">동일 브라우저에서 접속 시에만 유지됩니다</p>
          </div>

          {getWishlistCount() === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-lg mb-2">아직 찜한 영화가 없습니다</p>
              <p className="text-sm">영화 카드의 하트 아이콘을 클릭해서 찜 목록에 추가해보세요!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {getWishlistByDate().map(({ date, movies }) => (
                <div key={date} className="bg-white border rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                    <span className="text-sm font-normal text-gray-500">({movies.length}개)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {movies.map((movie, index) => {
                      // 현재 시간과 비교하여 과거 상영인지 확인
                      const now = new Date();
                      const movieDateTime = new Date(movie.showtime || `${date}T${movie.time}:00`);
                      const isPast = movieDateTime < now;
                      const isToday = date === new Date().toISOString().split('T')[0];
                      
                      return (
                      <div
                        key={`${movie.title}-${movie.theater}-${movie.time}`}
                        className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                          isPast ? 'bg-gray-100 opacity-80' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <time className={`text-sm font-bold px-2 py-1 rounded ${
                            isPast 
                              ? 'text-gray-500 bg-gray-200' 
                              : 'text-blue-600 bg-blue-50'
                          }`}>
                            {movie.time}

                          </time>
                          <button
                            onClick={() => toggleWishlist(movie)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="찜 목록에서 제거"
                          >
                            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>

                        <h3 className={`text-base font-semibold mb-2 line-clamp-2 ${
                          isPast ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {movie.title}
                        </h3>

                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="font-medium truncate">{movie.theater}</p>
                          {movie.area && <p className="text-gray-500">{movie.area}</p>}
                          {movie.screen && <p className="text-gray-500 truncate">{movie.screen}</p>}
                          {movie.director && <p className="text-gray-500 truncate">감독: {movie.director}</p>}
                        </div>
                        
                        {isPast && (
                          <div className="mt-2 text-xs text-gray-500 italic">
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
        </div>
      )}
      <footer className="mt-16 text-center pb-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/npjMucg7sLxIm8Uca8O3lygeM9UX2Dsu4RVnVxcDdaItsLZ6w0N0Ju54gVqn8O7r7taBR6bAEwL9qOLoUKKbzg.webp"
              alt="프로필"
              className="w-12 h-12 rounded-full object-cover"
            />
            <p className="text-lg font-bold">- 만든사람 : 제육볶음 달달볶아 -</p>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>ver 1.2.0 | last: 2025-09-12</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
