"use client";

import { useState, useMemo, useCallback } from "react";
import { MovieSchedule, ScheduleResponse } from "@/types";
import { getLocalDateString, parseMovieTime } from "@/utils/date";

export function useMovieSchedules(
  selectedDate: string,
  selectedMovies: string[],
  selectedTheaters: string[],
  showPastSchedules: boolean
) {
  const [allMovies, setAllMovies] = useState<MovieSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // 스케줄 조회
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/schedules?type=integrated&date=${selectedDate}`
      );
      const data: ScheduleResponse = await response.json();

      if (data.success) {
        setAllMovies(data.data);
        setLastUpdate(
          new Date(data.timestamp).toLocaleTimeString("ko-KR", {
            timeZone: "Asia/Seoul",
          })
        );
        return true;
      } else {
        setError(data.error || "조회 실패");
        return false;
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
      console.error("Fetch error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // 데이터 초기화
  const resetMovies = useCallback(() => {
    setAllMovies([]);
    setLastUpdate(null);
  }, []);

  // 필터링된 영화 목록
  const filteredMovies = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(new Date());

    let movies = allMovies;

    if (selectedMovies.length > 0) {
      movies = movies.filter((movie) => selectedMovies.includes(movie.title));
    }

    if (selectedTheaters.length > 0) {
      movies = movies.filter((movie) =>
        selectedTheaters.includes(movie.theater)
      );
    }

    if (isToday && !showPastSchedules) {
      movies = movies.filter((movie) => {
        const movieTime = parseMovieTime(movie.time, selectedDate);
        return movieTime > now;
      });
    }

    return movies;
  }, [allMovies, selectedMovies, selectedTheaters, selectedDate, showPastSchedules]);

  // 과거 스케줄 개수
  const pastSchedulesCount = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(new Date());

    if (!isToday) return 0;

    let movies = allMovies;
    if (selectedMovies.length > 0) {
      movies = movies.filter((movie) => selectedMovies.includes(movie.title));
    }
    if (selectedTheaters.length > 0) {
      movies = movies.filter((movie) =>
        selectedTheaters.includes(movie.theater)
      );
    }

    return movies.filter((movie) => {
      const movieTime = parseMovieTime(movie.time, selectedDate);
      return movieTime <= now;
    }).length;
  }, [allMovies, selectedMovies, selectedTheaters, selectedDate]);

  // 고유 영화 목록
  const uniqueMovies = useMemo(() => {
    return [...new Set(allMovies.map((movie) => movie.title))].sort();
  }, [allMovies]);

  // 고유 극장 목록
  const uniqueTheaters = useMemo(() => {
    return [...new Set(allMovies.map((movie) => movie.theater))].sort();
  }, [allMovies]);

  return {
    allMovies,
    filteredMovies,
    loading,
    error,
    lastUpdate,
    fetchMovies,
    resetMovies,
    pastSchedulesCount,
    uniqueMovies,
    uniqueTheaters,
  };
}
