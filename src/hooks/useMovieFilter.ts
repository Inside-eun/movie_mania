"use client";

import { useState, useCallback, useEffect } from "react";

export type SortType = "time" | "distance";

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useMovieFilter() {
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [selectedTheaters, setSelectedTheaters] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<"movie" | "theater">("movie");
  const [showPastSchedules, setShowPastSchedules] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortType, setSortType] = useState<SortType>("time");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 사용자 위치 가져오기
  useEffect(() => {
    if (sortType === "distance" && !userLocation) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationError(null);
          },
          (error) => {
            setLocationError("위치 정보를 가져올 수 없습니다");
            console.error("Geolocation error:", error);
          }
        );
      } else {
        setLocationError("브라우저에서 위치 정보를 지원하지 않습니다");
      }
    }
  }, [sortType, userLocation]);

  // 영화 필터 토글
  const handleMovieFilter = useCallback((movieTitle: string) => {
    setSelectedMovies((prev) =>
      prev.includes(movieTitle)
        ? prev.filter((m) => m !== movieTitle)
        : [...prev, movieTitle]
    );
  }, []);

  // 극장 필터 토글
  const handleTheaterFilter = useCallback((theaterName: string) => {
    setSelectedTheaters((prev) =>
      prev.includes(theaterName)
        ? prev.filter((t) => t !== theaterName)
        : [...prev, theaterName]
    );
  }, []);

  // 필터 타입 변경
  const handleFilterTypeChange = useCallback((type: "movie" | "theater") => {
    setFilterType(type);
    setIsDropdownOpen(false);
  }, []);

  // 현재 필터 초기화
  const handleClearFilters = useCallback(() => {
    if (filterType === "movie") {
      setSelectedMovies([]);
    } else {
      setSelectedTheaters([]);
    }
  }, [filterType]);

  // 전체 필터 초기화
  const resetAllFilters = useCallback(() => {
    setSelectedMovies([]);
    setSelectedTheaters([]);
  }, []);

  // 선택된 영화 텍스트
  const getSelectedMovieText = useCallback(
    (uniqueMoviesCount: number) => {
      if (selectedMovies.length === 0) {
        return `전체 영화 (${uniqueMoviesCount}개)`;
      }
      if (selectedMovies.length === 1) {
        return selectedMovies[0];
      }
      return `${selectedMovies.length}개 선택됨`;
    },
    [selectedMovies]
  );

  // 선택된 극장 텍스트
  const getSelectedTheaterText = useCallback(
    (uniqueTheatersCount: number) => {
      if (selectedTheaters.length === 0) {
        return `전체 영화관 (${uniqueTheatersCount}개)`;
      }
      if (selectedTheaters.length === 1) {
        return selectedTheaters[0];
      }
      return `${selectedTheaters.length}개 선택됨`;
    },
    [selectedTheaters]
  );

  const handleSortTypeChange = useCallback((type: SortType) => {
    setSortType(type);
  }, []);

  return {
    selectedMovies,
    selectedTheaters,
    filterType,
    showPastSchedules,
    isDropdownOpen,
    setIsDropdownOpen,
    setShowPastSchedules,
    handleMovieFilter,
    handleTheaterFilter,
    handleFilterTypeChange,
    handleClearFilters,
    resetAllFilters,
    getSelectedMovieText,
    getSelectedTheaterText,
    sortType,
    userLocation,
    locationError,
    handleSortTypeChange,
  };
}
