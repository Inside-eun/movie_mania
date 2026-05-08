"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import DateSelector from "../components/DateSelector";
import MovieFilter from "../components/MovieFilter";
import MovieGrid from "../components/MovieGrid";
import MovieBanner from "../components/MovieBanner";

const WishlistView = dynamic(() => import("../components/WishlistView"), { loading: () => null });
const SettingsView = dynamic(() => import("../components/SettingsView"), { loading: () => null });
const MovieModal = dynamic(() => import("../components/MovieModal"), { loading: () => null });
import { MovieSchedule } from "@/types";
import { useWishlist, useMovieSchedules, useMovieFilter } from "@/hooks";
import { getLocalDateString } from "@/utils/date";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date())
  );

  const [showWishlistView, setShowWishlistView] = useState(false);
  const [showInfoView, setShowInfoView] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovieForModal, setSelectedMovieForModal] =
    useState<MovieSchedule | null>(null);

  const filter = useMovieFilter();
  const schedules = useMovieSchedules(
    selectedDate,
    filter.selectedMovies,
    filter.selectedTheaters,
    filter.showPastSchedules
  );
  const wishlist = useWishlist(selectedDate);

  const handleDateChange = useCallback(
    (date: string) => {
      setSelectedDate(date);
      filter.resetAllFilters();
    },
    [filter]
  );

  const openModal = useCallback((movie: MovieSchedule) => {
    setSelectedMovieForModal(movie);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieForModal(null);
  }, []);

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
  const isHomeView = !showWishlistView && !showInfoView;

  return (
    <>
      <Header />

      {/* 히어로 배너 - ALL SCREENINGS 뷰에서만 (로딩 중 스켈레톤으로 CLS 방지) */}
      {isHomeView && (
        schedules.allMovies.length > 0
          ? <MovieBanner movies={schedules.allMovies} />
          : schedules.loading
            ? <div className="w-full bg-gray-900/50 animate-pulse" style={{ height: "260px" }} />
            : null
      )}

      <main className="container mx-auto px-4 pb-24 pt-4 max-w-4xl min-h-screen">
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

        {schedules.loading && (
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
              onMovieClick={openModal}
              onToggleWishlist={wishlist.toggleWishlist}
              isInWishlist={wishlist.isInWishlist}
              sortType={filter.sortType}
              userLocation={filter.userLocation}
              locationError={filter.locationError}
              onSortTypeChange={filter.handleSortTypeChange}
            />
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
            onMovieClick={openModal}
            onToggleWishlist={wishlist.toggleWishlist}
            onClearAll={wishlist.clearAll}
            getWishlistByDate={wishlist.getWishlistByDate}
          />
        )}

        {showInfoView && <SettingsView />}

        <MovieModal
          isOpen={isModalOpen}
          onClose={closeModal}
          movie={selectedMovieForModal}
          selectedDate={selectedDate}
        />

        {/* 하단 네비게이션 (모바일) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 shadow-lg z-40 sm:hidden">
          <div className="flex items-center justify-around h-16">
            <button
              onClick={goToHome}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isHomeView ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <svg
                className="w-5 h-5 mb-0.5"
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
              <span className="text-[10px] font-medium">홈</span>
            </button>

            <button
              onClick={goToWishlist}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                showWishlistView ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <svg
                className="w-5 h-5 mb-0.5"
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
                <span className="absolute top-1.5 right-1/4 bg-orange-500 text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {wishlist.count}
                </span>
              )}
              <span className="text-[10px] font-medium">찜</span>
            </button>

            <button
              onClick={goToInfo}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                showInfoView ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <svg
                className="w-5 h-5 mb-0.5"
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
              <span className="text-[10px] font-medium">설정</span>
            </button>
          </div>
        </nav>
      </main>
    </>
  );
}
