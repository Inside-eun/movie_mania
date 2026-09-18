"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { trackEngagementTime, trackTabChanged } from '@/utils/gtm';
import { hapticImpact } from '@/lib/haptics';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import {
  useMovieFilter,
  useMovieSchedules,
  useWishlist,
} from '@/hooks';
import { MovieSchedule } from '@/types';
import { addDaysToDateString, getLocalDateString } from '@/utils/date';

import DateSelector from '../components/DateSelector';
import Header from '../components/Header';
import MovieBanner from '../components/MovieBanner';
import MovieFilter from '../components/MovieFilter';
import MovieGrid from '../components/MovieGrid';
import SplashScreen from '../components/SplashScreen';

const WishlistView = dynamic(() => import("../components/WishlistView"), { loading: () => null });
const SettingsView = dynamic(() => import("../components/SettingsView"), { loading: () => null });
const EventsView = dynamic(() => import("../components/EventsView"), { loading: () => null });
const RouteMapModal = dynamic(() => import("../components/RouteMapModal"), { loading: () => null });

export default function Home() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date())
  );

  const [showWishlistView, setShowWishlistView] = useState(false);
  const [showInfoView, setShowInfoView] = useState(false);
  const [showEventsView, setShowEventsView] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [showDesktopNav, setShowDesktopNav] = useState(false);

  const [isRouteMapOpen, setIsRouteMapOpen] = useState(false);
  const [routeTarget, setRouteTarget] = useState<{
    name: string;
    latitude: number | null;
    longitude: number | null;
  } | null>(null);

  const filter = useMovieFilter();
  const schedules = useMovieSchedules(
    selectedDate,
    filter.selectedMovies,
    filter.selectedTheaters,
    filter.showPastSchedules
  );
  const wishlist = useWishlist(selectedDate);

  // 실제로 화면에 보인 누적 시간 측정 (탭 전환, 백그라운드 제외)
  const visibleSinceRef = useRef<number>(Date.now());
  const totalVisibleMsRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        totalVisibleMsRef.current += Date.now() - visibleSinceRef.current;
      } else {
        visibleSinceRef.current = Date.now();
      }
    };
    const handleUnload = () => {
      const total = totalVisibleMsRef.current + (Date.now() - visibleSinceRef.current);
      trackEngagementTime(Math.round(total / 1000));
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  const handleDateChange = useCallback(
    (date: string) => {
      setSelectedDate(date);
      filter.resetAllFilters();
    },
    [filter]
  );

  const goToNextDay = useCallback(() => {
    hapticImpact("light");
    const nextDate = addDaysToDateString(selectedDate, 1);
    handleDateChange(nextDate);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedDate, handleDateChange]);

  const openMovieDetail = useCallback(
    (movie: MovieSchedule) => {
      const slug = encodeURIComponent(movie.movieCode || movie.title);
      sessionStorage.setItem(
        `movieDetail:${slug}`,
        JSON.stringify({ movie, selectedDate })
      );
      router.push(`/movie/${slug}`);
    },
    [selectedDate, router]
  );

  const openRouteMapForMovie = useCallback((movie: MovieSchedule) => {
    setRouteTarget({
      name: movie.theater,
      latitude: movie.latitude ?? null,
      longitude: movie.longitude ?? null,
    });
    setIsRouteMapOpen(true);
  }, []);

  const closeRouteMap = useCallback(() => {
    setIsRouteMapOpen(false);
    setRouteTarget(null);
  }, []);

  const goToHome = useCallback(() => {
    hapticImpact("light");
    trackTabChanged("home");
    if (!showWishlistView && !showInfoView && !showEventsView) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setShowWishlistView(false);
    setShowInfoView(false);
    setShowEventsView(false);
    setPendingEventId(null);
  }, [showWishlistView, showInfoView, showEventsView]);

  const goToWishlist = useCallback(() => {
    hapticImpact("light");
    trackTabChanged("wishlist");
    setShowWishlistView(true);
    setShowInfoView(false);
    setShowEventsView(false);
    setPendingEventId(null);
  }, []);

  const goToInfo = useCallback(() => {
    hapticImpact("light");
    trackTabChanged("settings");
    setShowWishlistView(false);
    setShowInfoView(true);
    setShowEventsView(false);
    setPendingEventId(null);
  }, []);

  const goToEvents = useCallback(() => {
    hapticImpact("light");
    trackTabChanged("events");
    setShowWishlistView(false);
    setShowInfoView(false);
    setShowEventsView(true);
    setPendingEventId(null);
  }, []);

  const goToEventDetail = useCallback((eventId: string) => {
    setPendingEventId(eventId);
    setShowWishlistView(false);
    setShowInfoView(false);
    setShowEventsView(true);
  }, []);

  const isToday = selectedDate === getLocalDateString(new Date());
  const isHomeView =
    !showWishlistView && !showInfoView && !showEventsView;

  // 앱 최초 진입 후 스케줄이 한 번이라도 로드되면 영구히 true로 고정된다.
  // 이후 날짜 변경 등으로 다시 로딩이 걸려도 스플래시가 아닌 기존 로딩 UI를 쓰게 하기 위함.
  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (!schedules.loading) {
      hasLoadedOnceRef.current = true;
    }
  }, [schedules.loading]);

  const isInitialLoading =
    !hasLoadedOnceRef.current && isHomeView && schedules.loading;

  return (
    <>
      <SplashScreen visible={isInitialLoading} />

      <Header />

      {/* 히어로 배너 - ALL SCREENINGS 뷰에서만. 배너 자체가 로딩 중엔 동일한 높이의
          스켈레톤을 그려서(MovieBanner 내부 처리) 메인 스케줄 로딩과 무관하게 바로 마운트한다.
          이렇게 해야 배너의 주간 일정 fetch가 메인 스케줄 fetch와 동시에 시작돼 체감 대기 시간이 줄고,
          "스켈레톤 -> 사라짐 -> 배너 등장"으로 이어지던 레이아웃 시프트도 없어진다. */}
      {isHomeView && <MovieBanner onEventClick={goToEventDetail} />}

      <main className="container mx-auto px-4 pb-[calc(6rem_+_env(safe-area-inset-bottom))] sm:pb-[calc(8rem_+_env(safe-area-inset-bottom))] lg:pb-4 pt-4 max-w-4xl min-h-screen">
        {/* 필터 영역 */}
        {isHomeView && (
          <div className="flex gap-2 items-start mb-4">
            <div className="flex-1">
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>
            {schedules.allMovies.length > 0 && (
              <div className="flex-shrink-0">
                <MovieFilter
                  filterType={filter.filterType}
                  onFilterTypeChange={filter.handleFilterTypeChange}
                  selectedMovies={filter.selectedMovies}
                  selectedTheaters={filter.selectedTheaters}
                  onMovieFilter={filter.handleMovieFilter}
                  onTheaterFilter={filter.handleTheaterFilter}
                  onBulkTheaterSelect={filter.handleBulkTheaterSelect}
                  onClearFilters={filter.handleClearFilters}
                  allMovies={schedules.allMovies}
                  isDropdownOpen={filter.isDropdownOpen}
                  setIsDropdownOpen={filter.setIsDropdownOpen}
                  getSelectedMovieText={() =>
                    filter.getSelectedMovieText(schedules.uniqueMovies.length)
                  }
                  getSelectedTheaterText={() =>
                    filter.getSelectedTheaterText(
                      schedules.uniqueTheaters.length
                    )
                  }
                  getUniqueMovies={() => schedules.uniqueMovies}
                  getUniqueTheaters={() => schedules.uniqueTheaters}
                />
              </div>
            )}
          </div>
        )}

        {schedules.error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 mb-4">
            {schedules.error}
          </div>
        )}

        {schedules.loading && !isInitialLoading && isHomeView && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-500 text-sm">
              상영시간표를 불러오는 중...
            </p>
          </div>
        )}

        {!schedules.loading &&
          isHomeView &&
          schedules.filteredMovies.length > 0 && (
            <MovieGrid
              movies={schedules.filteredMovies}
              selectedDate={selectedDate}
              selectedMovies={filter.selectedMovies}
              selectedTheaters={filter.selectedTheaters}
              onMovieClick={openMovieDetail}
              onToggleWishlist={wishlist.toggleWishlist}
              isInWishlist={wishlist.isInWishlist}
              sortType={filter.sortType}
              layoutType={filter.layoutType}
              userLocation={filter.userLocation}
              locationError={filter.locationError}
              onSortTypeChange={filter.handleSortTypeChange}
              onLayoutTypeChange={filter.handleLayoutTypeChange}
              onMapClick={openRouteMapForMovie}
            />
          )}

        {!schedules.loading &&
          isHomeView &&
          schedules.filteredMovies.length > 0 && (
            <button
              onClick={goToNextDay}
              className="w-full mt-4 py-3 text-center text-sm text-gray-300 bg-gray-900/60 border border-gray-800 hover:bg-gray-800 transition-colors"
            >
              {Number(addDaysToDateString(selectedDate, 1).split("-")[2])}일 상영 시간표 &gt;
            </button>
          )}

        {!schedules.loading &&
          isHomeView &&
          schedules.allMovies.length === 0 &&
          !schedules.error && (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2 mt-4 text-sm">
                {new Date(selectedDate).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
                <br />
                상영 중인 예술영화가 없습니다.
              </div>
              <div className="text-xs">
                영화를 위해 도시를 떠도는 여행자를 위한 사이트
              </div>
            </div>
          )}

        {!schedules.loading &&
          isHomeView &&
          schedules.allMovies.length > 0 &&
          schedules.filteredMovies.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {isToday
                ? "현재 시간 이후의 상영시간이 없습니다."
                : "선택한 영화의 상영시간이 없습니다."}
            </div>
          )}

        {showWishlistView && (
          <WishlistView
            wishlistMovies={wishlist.wishlistMovies}
            wishlistCount={wishlist.count}
            onMovieClick={openMovieDetail}
            onToggleWishlist={wishlist.toggleWishlist}
            onClearAll={wishlist.clearAll}
            getWishlistByDate={wishlist.getWishlistByDate}
          />
        )}

        {showInfoView && <SettingsView />}

        {showEventsView && (
          <EventsView initialEventId={pendingEventId} onExitToHome={goToHome} />
        )}

        <RouteMapModal
          isOpen={isRouteMapOpen}
          onClose={closeRouteMap}
          theaterName={routeTarget?.name ?? null}
          latitude={routeTarget?.latitude ?? null}
          longitude={routeTarget?.longitude ?? null}
        />

        {/* 하단 네비게이션 (모바일 · 태블릿) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 shadow-lg z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="flex items-center justify-around h-16 sm:h-24">
            <button
              onClick={goToHome}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isHomeView ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <svg
                className="w-5 h-5 mb-0.5 sm:w-7 sm:h-7 sm:mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-[10px] font-medium sm:text-sm">홈</span>
            </button>

            <button
              onClick={goToWishlist}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                showWishlistView ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <svg
                className="w-5 h-5 mb-0.5 sm:w-7 sm:h-7 sm:mb-1"
                fill={showWishlistView ? "currentColor" : "none"}
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
              {wishlist.count > 0 && (
                <span className="absolute top-1.5 right-1/4 bg-orange-500 text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold sm:top-2 sm:w-5 sm:h-5 sm:text-xs">
                  {wishlist.count}
                </span>
              )}
              <span className="text-[10px] font-medium sm:text-sm">찜</span>
            </button>

            <button
              onClick={goToEvents}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                showEventsView ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <svg
                className="w-5 h-5 mb-0.5 sm:w-7 sm:h-7 sm:mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <span className="text-[10px] font-medium sm:text-sm">기획전</span>
            </button>

            <button
              onClick={goToInfo}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                showInfoView ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <svg
                className="w-5 h-5 mb-0.5 sm:w-7 sm:h-7 sm:mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-[10px] font-medium sm:text-sm">설정</span>
            </button>
          </div>
        </nav>

        {/* 데스크톱(웹) 전용: 우측 세로 탭 - 클릭하면 메뉴 패널이 펼쳐짐 */}
        <div className="hidden lg:block">
          {showDesktopNav && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowDesktopNav(false)}
            />
          )}

          <button
            onClick={() => setShowDesktopNav((prev) => !prev)}
            aria-label={showDesktopNav ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={showDesktopNav}
            className={`fixed top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 py-6 px-2 bg-black border border-gray-800 border-r-0 shadow-lg transition-[right] duration-300 ${
              showDesktopNav ? "right-56" : "right-0"
            }`}
          >
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                showDesktopNav ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-[11px] font-medium text-gray-400 [writing-mode:vertical-rl]">
              메뉴
            </span>
          </button>

          <div
            className={`fixed top-0 right-0 h-full w-56 bg-black border-l border-gray-800 shadow-2xl z-40 transition-transform duration-300 ${
              showDesktopNav ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col gap-1 p-4 mt-20">
              <button
                onClick={() => {
                  goToHome();
                  setShowDesktopNav(false);
                }}
                className={`flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                  isHomeView
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="font-medium">홈</span>
              </button>

              <button
                onClick={() => {
                  goToWishlist();
                  setShowDesktopNav(false);
                }}
                className={`flex items-center gap-3 px-3 py-3 text-left transition-colors relative ${
                  showWishlistView
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill={showWishlistView ? "currentColor" : "none"}
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
                <span className="font-medium">찜</span>
                {wishlist.count > 0 && (
                  <span className="ml-auto bg-orange-500 text-black text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {wishlist.count}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  goToEvents();
                  setShowDesktopNav(false);
                }}
                className={`flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                  showEventsView
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
                <span className="font-medium">기획전</span>
              </button>

              <button
                onClick={() => {
                  goToInfo();
                  setShowDesktopNav(false);
                }}
                className={`flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                  showInfoView
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium">설정</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
