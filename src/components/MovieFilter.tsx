"use client";

import { useRef, useEffect, useState } from "react";
import { MovieSchedule } from "@/types";

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [favoriteTheaters, setFavoriteTheaters] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteTheaters");
    if (saved) setFavoriteTheaters(JSON.parse(saved));
  }, [isFilterExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterExpanded(false);
      }
    };

    if (isFilterExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterExpanded]);

  const isFiltered = selectedMovies.length > 0 || selectedTheaters.length > 0;

  // 오늘 상영 중인 영화관 중 즐겨찾기에 포함된 것들
  const favoritesInCurrentShowings = getUniqueTheaters().filter((t) =>
    favoriteTheaters.includes(t)
  );
  const hasFavoritesInShowings = favoritesInCurrentShowings.length > 0;

  // 즐겨찾기 항목이 모두 선택된 상태인지
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
      {isFilterExpanded && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          onClick={() => setIsFilterExpanded(false)}
        />
      )}

      <div className="relative" ref={dropdownRef}>
        {/* 필터 아이콘 버튼 */}
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="relative p-2 bg-[#0d0d0d] border border-orange-500 text-gray-300 hover:bg-gray-900 transition-all z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {isFiltered && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 dark:bg-orange-600 rounded-full" />
          )}
        </button>

        {/* 필터 드롭다운 */}
        {isFilterExpanded && (
          <div className="absolute right-0 mt-2 w-[90vw] max-w-md bg-gray-900 border border-orange-500 shadow-2xl z-50">
            <div className="p-3 space-y-2">
              {/* 필터 탭과 초기화 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => onFilterTypeChange("movie")}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium transition-all ${
                    filterType === "movie"
                      ? "bg-orange-500 text-black"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  영화별
                </button>
                <button
                  onClick={() => onFilterTypeChange("theater")}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium transition-all ${
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
                    className="px-3 py-1.5 border border-orange-500 text-gray-300 text-xs hover:bg-orange-500/10 transition-all"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* 필터 리스트 */}
              <div className="max-h-96 overflow-y-auto border border-gray-800">
                {filterType === "movie" ? (
                  <>
                    {getUniqueMovies().map((movieTitle) => {
                      const count = allMovies.filter((m) => m.title === movieTitle).length;
                      const isSelected = selectedMovies.includes(movieTitle);
                      return (
                        <label
                          key={movieTitle}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-orange-900/20 transition-colors border-t border-gray-800 text-xs ${
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
                    {/* 즐겨찾기 영화관 일괄 선택 항목 */}
                    {hasFavoritesInShowings && (
                      <label
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-orange-900/20 transition-colors text-xs border-b border-orange-800/50 ${
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
                    {/* 개별 영화관 목록 */}
                    {getUniqueTheaters().map((theaterName) => {
                      const count = allMovies.filter((m) => m.theater === theaterName).length;
                      const isSelected = selectedTheaters.includes(theaterName);
                      const isFav = favoriteTheaters.includes(theaterName);
                      return (
                        <label
                          key={theaterName}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-orange-900/20 transition-colors border-t border-gray-800 text-xs ${
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
          </div>
        )}
      </div>
    </>
  );
}
