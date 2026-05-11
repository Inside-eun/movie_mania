"use client";

import {
  useEffect,
  useState,
} from 'react';

import { MovieSchedule } from '@/types';

interface MovieFilterProps {
  filterType: "movie" | "theater";
  onFilterTypeChange: (type: "movie" | "theater") => void;
  selectedMovies: string[];
  selectedTheaters: string[];
  onMovieFilter: (movie: string) => void;
  onTheaterFilter: (theater: string) => void;
  onBulkTheaterSelect: (theaterNames: string[]) => void;
  onClearFilters: () => void;
  allMovies: MovieSchedule[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  getSelectedMovieText: () => string;
  getSelectedTheaterText: () => string;
  getUniqueMovies: () => string[];
  getUniqueTheaters: () => string[];
}

export default function MovieFilter({
  filterType,
  onFilterTypeChange,
  selectedMovies,
  selectedTheaters,
  onMovieFilter,
  onTheaterFilter,
  onBulkTheaterSelect,
  onClearFilters,
  allMovies,
  isDropdownOpen: _isDropdownOpen,
  setIsDropdownOpen: _setIsDropdownOpen,
  getSelectedMovieText: _getSelectedMovieText,
  getSelectedTheaterText: _getSelectedTheaterText,
  getUniqueMovies,
  getUniqueTheaters,
}: MovieFilterProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [favoriteTheaters, setFavoriteTheaters] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteTheaters");
    if (saved) setFavoriteTheaters(JSON.parse(saved));
  }, [isFilterExpanded]);

  useEffect(() => {
    if (isFilterExpanded) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterExpanded]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsFilterExpanded(false), 300);
  };

  const isFiltered = selectedMovies.length > 0 || selectedTheaters.length > 0;

  const favoritesInCurrentShowings = getUniqueTheaters().filter((t) =>
    favoriteTheaters.includes(t)
  );
  const hasFavoritesInShowings = favoritesInCurrentShowings.length > 0;

  const isFavoriteGroupActive =
    hasFavoritesInShowings &&
    favoritesInCurrentShowings.every((t) => selectedTheaters.includes(t));

  const handleFavoriteGroupClick = () => {
    if (isFavoriteGroupActive) {
      onBulkTheaterSelect([]);
    } else {
      onBulkTheaterSelect(favoritesInCurrentShowings);
    }
  };

  return (
    <>
      {/* 필터 아이콘 버튼 */}
      <button
        onClick={() => setIsFilterExpanded(true)}
        className="relative p-2 bg-[#0d0d0d] border border-orange-500 text-gray-300 hover:bg-gray-900 transition-all z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {isFiltered && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 dark:bg-orange-600 rounded-full" />
        )}
      </button>

      {/* 바텀시트 */}
      {isFilterExpanded && (
        <>
          {/* 백드롭 */}
          <div
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
            onClick={handleClose}
          />

          {/* 시트 본체 */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-orange-500 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${isVisible ? "translate-y-0" : "translate-y-full"}`}
          >
            {/* 핸들 바 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
              <span className="text-sm font-semibold text-gray-200">필터</span>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* 필터 탭과 초기화 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => onFilterTypeChange("movie")}
                  className={`flex-1 py-2 px-3 text-xs font-medium transition-all rounded-sm ${
                    filterType === "movie"
                      ? "bg-orange-500 text-black"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  영화별
                </button>
                <button
                  onClick={() => onFilterTypeChange("theater")}
                  className={`flex-1 py-2 px-3 text-xs font-medium transition-all rounded-sm ${
                    filterType === "theater"
                      ? "bg-orange-500 text-black"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  영화관별
                </button>
                {isFiltered && (
                  <button
                    onClick={onClearFilters}
                    className="px-3 py-2 border border-orange-500 text-gray-300 text-xs hover:bg-orange-500/10 transition-all rounded-sm"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* 필터 리스트 */}
              <div className="max-h-64 overflow-y-auto border border-gray-800 rounded-sm">
                {filterType === "movie" ? (
                  <>
                    {getUniqueMovies().map((movieTitle) => {
                      const count = allMovies.filter((m) => m.title === movieTitle).length;
                      const isSelected = selectedMovies.includes(movieTitle);
                      return (
                        <label
                          key={movieTitle}
                          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-orange-900/20 transition-colors border-t border-gray-800 text-xs ${
                            isSelected ? "bg-orange-900/20" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onMovieFilter(movieTitle)}
                            className="w-4 h-4 border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className={`flex-1 ${isSelected ? "text-orange-400 font-semibold" : "text-gray-100"}`}>
                            {movieTitle} ({count})
                          </span>
                        </label>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {hasFavoritesInShowings && (
                      <label
                        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-orange-900/20 transition-colors text-xs border-b border-orange-800/50 ${
                          isFavoriteGroupActive ? "bg-orange-900/20" : ""
                        }`}
                        onClick={handleFavoriteGroupClick}
                      >
                        <span
                          className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center ${
                            isFavoriteGroupActive
                              ? "border-orange-500 bg-orange-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isFavoriteGroupActive && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={`flex-1 font-semibold ${isFavoriteGroupActive ? "text-orange-600 dark:text-orange-400" : "text-gray-300"}`}>
                          ★ 즐겨찾기 영화관 ({favoritesInCurrentShowings.length}개)
                        </span>
                      </label>
                    )}
                    {getUniqueTheaters().map((theaterName) => {
                      const count = allMovies.filter((m) => m.theater === theaterName).length;
                      const isSelected = selectedTheaters.includes(theaterName);
                      const isFav = favoriteTheaters.includes(theaterName);
                      return (
                        <label
                          key={theaterName}
                          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-orange-900/20 transition-colors border-t border-gray-800 text-xs ${
                            isSelected ? "bg-orange-900/20" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onTheaterFilter(theaterName)}
                            className="w-4 h-4 border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className={`flex-1 ${isSelected ? "text-orange-400 font-semibold" : "text-gray-100"}`}>
                            {isFav && <span className="text-orange-400 mr-1">★</span>}
                            {theaterName} ({count})
                          </span>
                        </label>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* 하단 안전 영역 여백 */}
            <div className="pb-safe h-4" />
          </div>
        </>
      )}
    </>
  );
}
