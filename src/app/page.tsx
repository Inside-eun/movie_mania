"use client";

import { useState, useCallback } from "react";
import Header from "../components/Header";
import DateSelector from "../components/DateSelector";
import MovieFilter from "../components/MovieFilter";
import MovieGrid from "../components/MovieGrid";
import WishlistView from "../components/WishlistView";
import InfoView from "../components/InfoView";
import MovieModal from "../components/MovieModal";
import { MovieSchedule } from "@/types";
import { useWishlist, useMovieSchedules, useMovieFilter } from "@/hooks";
import { getLocalDateString } from "@/utils/date";

export default function Home() {
  // 날짜 상태
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));

  // 뷰 상태
  const [showWishlistView, setShowWishlistView] = useState(false);
  const [showInfoView, setShowInfoView] = useState(false);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovieForModal, setSelectedMovieForModal] = useState<MovieSchedule | null>(null);

  // 커스텀 훅 사용
  const filter = useMovieFilter();
  const schedules = useMovieSchedules(
    selectedDate,
    filter.selectedMovies,
    filter.selectedTheaters,
    filter.showPastSchedules
  );
  const wishlist = useWishlist(selectedDate);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    schedules.resetMovies();
    filter.resetAllFilters();
  }, [schedules, filter]);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    if (showWishlistView) {
      setShowWishlistView(false);
    }
    schedules.fetchMovies();
  }, [showWishlistView, schedules]);

  // 모달 핸들러
  const openModal = useCallback((movie: MovieSchedule) => {
    setSelectedMovieForModal(movie);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieForModal(null);
  }, []);

  // 네비게이션 핸들러
  const goToHome = useCallback(() => {
    setShowWishlistView(false);
    setShowInfoView(false);
  }, []);

  const goToWishlist = useCallback(() => {
    setShowWishlistView(true);
    setShowInfoView(false);
  }, []);

  const goToInfo = useCallback(() => {
    setShowWishlistView(false);
    setShowInfoView(true);
  }, []);

  const isToday = selectedDate === getLocalDateString(new Date());

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
                  onDateChange={handleDateChange}
                  loading={schedules.loading}
                  onSearch={handleSearch}
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
                    onClearFilters={filter.handleClearFilters}
                    allMovies={schedules.allMovies}
                    isDropdownOpen={filter.isDropdownOpen}
                    setIsDropdownOpen={filter.setIsDropdownOpen}
                    getSelectedMovieText={() => filter.getSelectedMovieText(schedules.uniqueMovies.length)}
                    getSelectedTheaterText={() => filter.getSelectedTheaterText(schedules.uniqueTheaters.length)}
                    getUniqueMovies={() => schedules.uniqueMovies}
                    getUniqueTheaters={() => schedules.uniqueTheaters}
                  />
                </div>
              )}
            </div>
          )}

          {!showWishlistView && !showInfoView && isToday && schedules.pastSchedulesCount > 0 && (
            <button
              onClick={() => filter.setShowPastSchedules(!filter.showPastSchedules)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              <svg
                className={`w-3 h-3 transition-transform ${filter.showPastSchedules ? "rotate-90" : "rotate-0"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>
                지난 상영 {filter.showPastSchedules ? "접기" : "보기"} ({schedules.pastSchedulesCount})
              </span>
            </button>
          )}
        </div>

        {schedules.error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {schedules.error}
          </div>
        )}

        {schedules.loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">상영시간표를 불러오는 중...</p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">최대 1분정도 걸릴 수 있습니다</p>
          </div>
        )}

        {!schedules.loading && !showWishlistView && !showInfoView && schedules.filteredMovies.length > 0 && (
          <MovieGrid
            movies={schedules.filteredMovies}
            selectedDate={selectedDate}
            selectedMovies={filter.selectedMovies}
            selectedTheaters={filter.selectedTheaters}
            onMovieClick={openModal}
            onToggleWishlist={wishlist.toggleWishlist}
            isInWishlist={wishlist.isInWishlist}
          />
        )}

        {!schedules.loading && !showWishlistView && !showInfoView && schedules.allMovies.length === 0 && !schedules.error && (
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
            <div>영화를 위해 도시를 떠도는 여행자를 위한 사이트</div>
          </div>
        )}

        {!schedules.loading && !showWishlistView && !showInfoView && schedules.allMovies.length > 0 && schedules.filteredMovies.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {isToday && !filter.showPastSchedules
              ? "현재 시간 이후의 상영시간이 없습니다. 지난 상영시간을 보시려면 위의 체크박스를 선택해주세요."
              : "선택한 영화의 상영시간이 없습니다."}
          </div>
        )}

        {showWishlistView && (
          <WishlistView
            wishlistMovies={wishlist.wishlistMovies}
            wishlistCount={wishlist.count}
            onMovieClick={openModal}
            onToggleWishlist={wishlist.toggleWishlist}
            onClearAll={wishlist.clearAll}
            getWishlistByDate={wishlist.getWishlistByDate}
          />
        )}

        {showInfoView && <InfoView />}

        <MovieModal isOpen={isModalOpen} onClose={closeModal} movie={selectedMovieForModal} />

        {/* 하단 네비게이션 바 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-40 sm:hidden">
          <div className="flex items-center justify-around h-20">
            <button
              onClick={goToHome}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                !showWishlistView && !showInfoView
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs font-medium">홈</span>
            </button>

            <button
              onClick={goToWishlist}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                showWishlistView ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <svg
                className="w-6 h-6 mb-1"
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
                <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {wishlist.count}
                </span>
              )}
              <span className="text-xs font-medium">찜</span>
            </button>

            <button
              onClick={goToInfo}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                showInfoView ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-medium">정보</span>
            </button>
          </div>
        </nav>
      </main>
    </>
  );
}
