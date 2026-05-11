"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { MovieSchedule, ScheduleResponse } from "@/types";
import { getLocalDateString, parseMovieTime } from "@/utils/date";
import { getTheaterCoordinates } from "@/utils/theaterCoordinates";

const CACHE_KEY_PREFIX = "schedules_v1_";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

interface CacheEntry {
  movies: MovieSchedule[];
  timestamp: string;
  savedAt: number;
}

function readCache(date: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + date);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + date);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeCache(date: string, movies: MovieSchedule[], timestamp: string) {
  try {
    const entry: CacheEntry = { movies, timestamp, savedAt: Date.now() };
    localStorage.setItem(CACHE_KEY_PREFIX + date, JSON.stringify(entry));
  } catch {
    // 저장 실패(용량 초과 등)는 무시
  }
}

export function useMovieSchedules(
  selectedDate: string,
  selectedMovies: string[],
  selectedTheaters: string[],
  showPastSchedules: boolean
) {
  const [allMovies, setAllMovies] = useState<MovieSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const applyCoordinates = useCallback((movies: MovieSchedule[]) =>
    movies.map((movie) => {
      if (movie.latitude && movie.longitude) return movie;
      const coords = getTheaterCoordinates(movie.theater);
      return { ...movie, latitude: coords?.latitude, longitude: coords?.longitude };
    }), []);

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
        const moviesWithCoordinates = applyCoordinates(data.data);
        const timeLabel = new Date(data.timestamp).toLocaleTimeString("ko-KR", {
          timeZone: "Asia/Seoul",
        });
        setAllMovies(moviesWithCoordinates);
        setLastUpdate(timeLabel);
        writeCache(selectedDate, moviesWithCoordinates, timeLabel);

        // tmdbPosterUrl이 없는 영화가 있으면 백그라운드에서 보완
        const hasMissingPosters = moviesWithCoordinates.some((m) => !m.tmdbPosterUrl);
        if (hasMissingPosters) {
          fetch(`/api/tmdb-movies?date=${selectedDate}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
              if (!json?.success || !Array.isArray(json.data)) return;
              const tmdbMap = new Map<string, string>(
                json.data
                  .filter((m: { posterUrl: string | null }) => m.posterUrl)
                  .map((m: { title: string; posterUrl: string }) => [m.title, m.posterUrl])
              );
              setAllMovies((prev) => {
                const updated = prev.map((movie) => ({
                  ...movie,
                  tmdbPosterUrl: movie.tmdbPosterUrl || tmdbMap.get(movie.title) || undefined,
                }));
                writeCache(selectedDate, updated, timeLabel);
                return updated;
              });
            })
            .catch(() => {});
        }

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
  }, [selectedDate, applyCoordinates]);

  // 날짜 변경 시: 캐시가 있으면 즉시 표시 후 백그라운드에서 갱신
  useEffect(() => {
    const cached = readCache(selectedDate);
    if (cached) {
      setAllMovies(cached.movies);
      setLastUpdate(cached.timestamp);
      setLoading(false);
      // 스피너 없이 백그라운드에서 최신 데이터로 갱신
      fetch(`/api/schedules?type=integrated&date=${selectedDate}`)
        .then((res) => res.json())
        .then((data: ScheduleResponse) => {
          if (!data.success) return;
          const moviesWithCoords = applyCoordinates(data.data);
          const timeLabel = new Date(data.timestamp).toLocaleTimeString("ko-KR", {
            timeZone: "Asia/Seoul",
          });
          setAllMovies(moviesWithCoords);
          setLastUpdate(timeLabel);
          writeCache(selectedDate, moviesWithCoords, timeLabel);
        })
        .catch(() => {});
    } else {
      setAllMovies([]);
      setLastUpdate(null);
      fetchMovies();
    }
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

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
