"use client";

import { useState, useEffect, useCallback } from "react";
import { MovieSchedule } from "@/types";
import { getLocalDateString } from "@/utils/date";

const STORAGE_KEY_WISHLIST = "movieWishlist";
const STORAGE_KEY_MOVIES = "movieWishlistMovies";

// 영화 고유 키 생성
const getMovieKey = (movie: MovieSchedule): string => {
  return movie.movieCode
    ? `${movie.movieCode}-${movie.theater}-${movie.time}`
    : `${movie.title}-${movie.theater}-${movie.time}`;
};

export function useWishlist(selectedDate: string) {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistMovies, setWishlistMovies] = useState<MovieSchedule[]>([]);

  // localStorage에서 로드
  useEffect(() => {
    const savedWishlist = localStorage.getItem(STORAGE_KEY_WISHLIST);
    const savedMovies = localStorage.getItem(STORAGE_KEY_MOVIES);

    if (savedWishlist) {
      setWishlist(new Set(JSON.parse(savedWishlist)));
    }
    if (savedMovies) {
      setWishlistMovies(JSON.parse(savedMovies));
    }
  }, []);

  // 영화가 위시리스트에 있는지 확인
  const isInWishlist = useCallback(
    (movie: MovieSchedule): boolean => {
      return wishlist.has(getMovieKey(movie));
    },
    [wishlist]
  );

  // 위시리스트 토글
  const toggleWishlist = useCallback(
    (movie: MovieSchedule) => {
      const movieKey = getMovieKey(movie);
      const newWishlist = new Set(wishlist);
      const newWishlistMovies = [...wishlistMovies];
      const wasInWishlist = newWishlist.has(movieKey);

      if (wasInWishlist) {
        newWishlist.delete(movieKey);
        const movieIndex = newWishlistMovies.findIndex(
          (m) => getMovieKey(m) === movieKey
        );
        if (movieIndex > -1) {
          newWishlistMovies.splice(movieIndex, 1);
        }
      } else {
        newWishlist.add(movieKey);
        const [hours, minutes] = movie.time.split(":").map(Number);
        const correctShowtime = new Date(selectedDate);
        correctShowtime.setHours(hours, minutes, 0, 0);

        newWishlistMovies.push({
          ...movie,
          showtime: correctShowtime.toISOString(),
        });
      }

      setWishlist(newWishlist);
      setWishlistMovies(newWishlistMovies);
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify([...newWishlist]));
      localStorage.setItem(STORAGE_KEY_MOVIES, JSON.stringify(newWishlistMovies));
    },
    [wishlist, wishlistMovies, selectedDate]
  );

  // 전체 삭제
  const clearAll = useCallback(() => {
    setWishlist(new Set());
    setWishlistMovies([]);
    localStorage.removeItem(STORAGE_KEY_WISHLIST);
    localStorage.removeItem(STORAGE_KEY_MOVIES);
  }, []);

  // 개수
  const count = wishlist.size;

  // 날짜별 그룹화
  const getWishlistByDate = useCallback(() => {
    const groupedByDate: { [date: string]: MovieSchedule[] } = {};

    wishlistMovies.forEach((movie) => {
      let date = selectedDate;

      if (movie.showtime) {
        try {
          const parsedDate = new Date(movie.showtime);
          if (!isNaN(parsedDate.getTime())) {
            date = getLocalDateString(parsedDate);
          }
        } catch {
          // 파싱 실패 시 기본값 사용
        }
      }

      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(movie);
    });

    return Object.keys(groupedByDate)
      .sort()
      .map((date) => ({
        date,
        movies: groupedByDate[date].sort((a, b) => a.time.localeCompare(b.time)),
      }));
  }, [wishlistMovies, selectedDate]);

  return {
    wishlist,
    wishlistMovies,
    isInWishlist,
    toggleWishlist,
    clearAll,
    count,
    getWishlistByDate,
  };
}
