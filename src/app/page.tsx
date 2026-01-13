"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "../components/Header";
import DateSelector from "../components/DateSelector";
import MovieFilter from "../components/MovieFilter";
import MovieGrid from "../components/MovieGrid";
import WishlistView from "../components/WishlistView";
import InfoView from "../components/InfoView";
import MovieModal from "../components/MovieModal";

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
  // 서울 시간 기준 날짜 문자열 생성 함수 (Asia/Seoul 시간대)
  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, '0');
    const day = String(seoulDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [selectedTheaters, setSelectedTheaters] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<"movie" | "theater">("movie");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [showPastSchedules, setShowPastSchedules] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistMovies, setWishlistMovies] = useState<MovieSchedule[]>([]);
  const [showWishlistView, setShowWishlistView] = useState(false);
  const [showInfoView, setShowInfoView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovieForModal, setSelectedMovieForModal] = useState<MovieSchedule | null>(null);

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
        setSelectedMovies([]); // 새로 크롤링하면 필터 초기화
        setSelectedTheaters([]);
        setLastUpdate(new Date(data.timestamp).toLocaleTimeString("ko-KR", { timeZone: 'Asia/Seoul' }));
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

  // 고유한 영화관 목록 가져오기
  const getUniqueTheaters = () => {
    return [...new Set(allMovies.map((movie) => movie.theater))].sort();
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

  // 모달 열기
  const openModal = (movie: MovieSchedule) => {
    setSelectedMovieForModal(movie);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovieForModal(null);
  };

  // 현재 시간 기준으로 영화 스케줄 필터링
  const getFilteredMoviesByTime = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(new Date());
    
    let movies = allMovies;
    
    // 영화별 필터링 (다중 선택)
    if (selectedMovies.length > 0) {
      movies = movies.filter((movie) => selectedMovies.includes(movie.title));
    }
    
    // 영화관별 필터링 (다중 선택)
    if (selectedTheaters.length > 0) {
      movies = movies.filter((movie) => selectedTheaters.includes(movie.theater));
    }
    
    // 오늘 날짜이고 과거 스케줄을 숨기는 옵션이 켜져있다면
    if (isToday && !showPastSchedules) {
      movies = movies.filter((movie) => {
        const movieTime = parseMovieTime(movie.time, selectedDate);
        return movieTime > now;
      });
    }
    
    return movies;
  }, [allMovies, selectedMovies, selectedTheaters, selectedDate, showPastSchedules, wishlist]);

  // 과거 스케줄 개수 계산
  const pastSchedulesCount = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(new Date());
    
    if (!isToday) return 0;
    
    let movies = allMovies;
    if (selectedMovies.length > 0) {
      movies = movies.filter((movie) => selectedMovies.includes(movie.title));
    }
    if (selectedTheaters.length > 0) {
      movies = movies.filter((movie) => selectedTheaters.includes(movie.theater));
    }
    
    return movies.filter((movie) => {
      const movieTime = parseMovieTime(movie.time, selectedDate);
      return movieTime <= now;
    }).length;
  }, [allMovies, selectedMovies, selectedTheaters, selectedDate, wishlist]);

  // 영화 필터링 (다중 선택)
  const handleMovieFilter = (movieTitle: string) => {
    setSelectedMovies(prev => {
      if (prev.includes(movieTitle)) {
        return prev.filter(m => m !== movieTitle);
      } else {
        return [...prev, movieTitle];
      }
    });
  };

  // 영화관 필터링 (다중 선택)
  const handleTheaterFilter = (theaterName: string) => {
    setSelectedTheaters(prev => {
      if (prev.includes(theaterName)) {
        return prev.filter(t => t !== theaterName);
      } else {
        return [...prev, theaterName];
      }
    });
  };

  // 필터 타입 변경
  const handleFilterTypeChange = (type: "movie" | "theater") => {
    setFilterType(type);
    setIsDropdownOpen(false);
  };

  // 필터 초기화
  const handleClearFilters = () => {
    if (filterType === "movie") {
      setSelectedMovies([]);
    } else {
      setSelectedTheaters([]);
    }
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

  // 위시리스트 전체 삭제
  const clearAllWishlist = () => {
    setWishlist(new Set());
    setWishlistMovies([]);
    localStorage.removeItem('movieWishlist');
    localStorage.removeItem('movieWishlistMovies');
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
            date = getLocalDateString(parsedDate);
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
    if (selectedMovies.length === 0) {
      return `전체 영화 (${getUniqueMovies().length}개)`;
    }
    if (selectedMovies.length === 1) {
      return `${selectedMovies[0]}`;
    }
    return `${selectedMovies.length}개 선택됨`;
  };

  // 선택된 영화관 텍스트 표시
  const getSelectedTheaterText = () => {
    if (selectedTheaters.length === 0) {
      return `전체 영화관 (${getUniqueTheaters().length}개)`;
    }
    if (selectedTheaters.length === 1) {
      return `${selectedTheaters[0]}`;
    }
    return `${selectedTheaters.length}개 선택됨`;
  };

  return (
    <>
      <Header />

      <main className="container mx-auto px-4 pb-24 pt-6 max-w-4xl text-gray-900 dark:text-gray-100 min-h-screen">
        <div className="flex flex-col gap-2 mb-6">
          {!showWishlistView && !showInfoView && (
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <DateSelector
                  selectedDate={selectedDate}
                  onDateChange={(date) => {
                    setSelectedDate(date);
                    setAllMovies([]);
                    setFilteredMovies([]);
                    setSelectedMovies([]);
                    setSelectedTheaters([]);
                    setLastUpdate(null);
                  }}
                  loading={loading}
                  onSearch={() => {
                    if (showWishlistView) {
                      setShowWishlistView(false);
                    }
                    fetchMovies();
                  }}
                />
              </div>
              {allMovies.length > 0 && (
                <div className="flex-shrink-0">
                  <MovieFilter
                    filterType={filterType}
                    onFilterTypeChange={handleFilterTypeChange}
                    selectedMovies={selectedMovies}
                    selectedTheaters={selectedTheaters}
                    onMovieFilter={handleMovieFilter}
                    onTheaterFilter={handleTheaterFilter}
                    onClearFilters={handleClearFilters}
                    allMovies={allMovies}
                    isDropdownOpen={isDropdownOpen}
                    setIsDropdownOpen={setIsDropdownOpen}
                    getSelectedMovieText={getSelectedMovieText}
                    getSelectedTheaterText={getSelectedTheaterText}
                    getUniqueMovies={getUniqueMovies}
                    getUniqueTheaters={getUniqueTheaters}
                  />
                </div>
              )}
            </div>
          )}
            
          {!showWishlistView && !showInfoView && selectedDate === getLocalDateString(new Date()) && pastSchedulesCount > 0 && (
            <button
              onClick={() => setShowPastSchedules(!showPastSchedules)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              <svg
                className={`w-3 h-3 transition-transform ${
                  showPastSchedules ? 'rotate-90' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>
                지난 상영 {showPastSchedules ? '접기' : '보기'} ({pastSchedulesCount})
              </span>
            </button>
          )}
        </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">상영시간표를 불러오는 중...</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">최대 1분정도 걸릴 수 있습니다</p>
        </div>
      )}

      {!loading && !showWishlistView && !showInfoView && getFilteredMoviesByTime.length > 0 && (
        <MovieGrid
          movies={getFilteredMoviesByTime}
          selectedDate={selectedDate}
          selectedMovies={selectedMovies}
          selectedTheaters={selectedTheaters}
          onMovieClick={openModal}
          onToggleWishlist={toggleWishlist}
          isInWishlist={isInWishlist}
        />
      )}

      {!loading && !showWishlistView && !showInfoView && allMovies.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="mb-2 mt-4 text-sm sm:text-base">
            {new Date(selectedDate).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
            <br className="sm:hidden" /> 상영시간표를 조회해주세요.
          </div>
            <div>
              영화를 위해 도시를 떠도는 여행자를 위한 사이트
          </div>

        </div>
      )}

      {!loading && !showWishlistView && !showInfoView && allMovies.length > 0 && getFilteredMoviesByTime.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {selectedDate === getLocalDateString(new Date()) && !showPastSchedules
            ? "현재 시간 이후의 상영시간이 없습니다. 지난 상영시간을 보시려면 위의 체크박스를 선택해주세요."
            : "선택한 영화의 상영시간이 없습니다."
          }
        </div>
      )}

      {/* 찜 목록 뷰 */}
      {showWishlistView && (
        <WishlistView
          wishlistMovies={wishlistMovies}
          wishlistCount={getWishlistCount()}
          onMovieClick={openModal}
          onToggleWishlist={toggleWishlist}
          onClearAll={clearAllWishlist}
          getWishlistByDate={getWishlistByDate}
        />
      )}

      {/* 정보 뷰 */}
      {showInfoView && <InfoView />}



      {/* 영화 상세 정보 모달 */}
      <MovieModal
        isOpen={isModalOpen}
        onClose={closeModal}
        movie={selectedMovieForModal}
      />
      {/* 하단 네비게이션 바 */ }
      < nav className = "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-40 sm:hidden" >
        <div className="flex items-center justify-around h-20">
          <button
            onClick={() => {
              setShowWishlistView(false);
              setShowInfoView(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${!showWishlistView && !showInfoView
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">홈</span>
          </button>
          
          <button
            onClick={() => {
              setShowWishlistView(true);
              setShowInfoView(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${showWishlistView
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <svg className="w-6 h-6 mb-1" fill={showWishlistView ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {getWishlistCount() > 0 && (
              <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {getWishlistCount()}
              </span>
            )}
            <span className="text-xs font-medium">찜</span>
          </button>

          <button
            onClick={() => {
              setShowWishlistView(false);
              setShowInfoView(true);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${showInfoView
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">정보</span>
          </button>
        </div>
        </nav >
      </main>
      </>
    );
  }

