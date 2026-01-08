"use client";

import { useRef, useEffect, useState } from "react";

interface MovieSchedule {
  title: string;
  theater: string;
  area: string;
  screen: string;
  time: string;
  showtime: string;
  source?: string;
  movieCode?: string;
}

interface MovieFilterProps {
  filterType: "movie" | "theater";
  onFilterTypeChange: (type: "movie" | "theater") => void;
  selectedMovies: string[];
  selectedTheaters: string[];
  onMovieFilter: (movie: string) => void;
  onTheaterFilter: (theater: string) => void;
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
  onClearFilters,
  allMovies,
  isDropdownOpen,
  setIsDropdownOpen,
  getSelectedMovieText,
  getSelectedTheaterText,
  getUniqueMovies,
  getUniqueTheaters,
}: MovieFilterProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterExpanded(false);
      }
    };

    if (isFilterExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterExpanded]);

  const isFiltered = selectedMovies.length > 0 || selectedTheaters.length > 0;

  return (
    <>
      {/* 오버레이 배경 */}
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
          className="relative p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {isFiltered && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 dark:bg-blue-600 rounded-full"></span>
          )}
        </button>

        {/* 필터 드롭다운 */}
        {isFilterExpanded && (
          <div className="absolute right-0 mt-2 w-[90vw] max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50">
            <div className="p-3 space-y-2">
              {/* 필터 탭과 초기화 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => onFilterTypeChange("movie")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                    filterType === "movie"
                      ? 'bg-blue-500 dark:bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  영화별
                </button>
                <button
                  onClick={() => onFilterTypeChange("theater")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                    filterType === "theater"
                      ? 'bg-blue-500 dark:bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  영화관별
                </button>
                {isFiltered && (
                  <button
                    onClick={onClearFilters}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* 필터 리스트 */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {filterType === "movie" ? (
                <>
                  {getUniqueMovies().map((movieTitle) => {
                    const count = allMovies.filter((m) => m.title === movieTitle).length;
                    const isSelected = selectedMovies.includes(movieTitle);
                    return (
                      <label
                        key={movieTitle}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors border-t border-gray-100 dark:border-gray-700 text-xs ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900'
                            : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onMovieFilter(movieTitle)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`flex-1 ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
                          {movieTitle} ({count})
                        </span>
                      </label>
                    );
                  })}
                </>
              ) : (
                <>
                  {getUniqueTheaters().map((theaterName) => {
                    const count = allMovies.filter((m) => m.theater === theaterName).length;
                    const isSelected = selectedTheaters.includes(theaterName);
                    return (
                      <label
                        key={theaterName}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors border-t border-gray-100 dark:border-gray-700 text-xs ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900'
                            : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onTheaterFilter(theaterName)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`flex-1 ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
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

