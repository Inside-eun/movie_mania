"use client";

import { useState } from "react";
import CalendarView from "./CalendarView";
import { MovieSchedule } from "@/types";
import {
  isNative,
  requestNotificationPermission,
  scheduleMovieNotification,
  cancelMovieNotification,
  movieNotificationId,
  triggerHaptic,
} from "@/lib/native";

interface WishlistViewProps {
  wishlistMovies: MovieSchedule[];
  wishlistCount: number;
  onMovieClick: (movie: MovieSchedule) => void;
  onToggleWishlist: (movie: MovieSchedule) => void;
  onClearAll: () => void;
  getWishlistByDate: () => { date: string; movies: MovieSchedule[] }[];
}

export default function WishlistView({
  wishlistMovies,
  wishlistCount,
  onMovieClick,
  onToggleWishlist,
  onClearAll,
  getWishlistByDate,
}: WishlistViewProps) {
  const [wishlistViewMode, setWishlistViewMode] = useState<"list" | "calendar">(
    "calendar"
  );
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("movie_notification_ids");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  const notifKey = (movie: MovieSchedule, date: string) =>
    `${movie.title}-${movie.theater}-${movie.time}-${date}`;

  const handleToggleNotification = async (movie: MovieSchedule, date: string) => {
    if (!isNative()) return;
    triggerHaptic("light");
    const key = notifKey(movie, date);
    const id = movieNotificationId(movie.title, `${date}-${movie.time}`);

    if (scheduledIds.has(key)) {
      await cancelMovieNotification(id);
      setScheduledIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        localStorage.setItem("movie_notification_ids", JSON.stringify([...next]));
        return next;
      });
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const [h, m] = movie.time.split(":").map(Number);
    const movieAt = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    const notifyAt = new Date(movieAt.getTime() - 60 * 60 * 1000);
    if (notifyAt <= new Date()) return;

    await scheduleMovieNotification(id, movie.title, movie.theater, notifyAt);
    setScheduledIds((prev) => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem("movie_notification_ids", JSON.stringify([...next]));
      return next;
    });
  };

  const getLocalDateString = (date: Date): string => {
    const seoulDate = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    );
    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, "0");
    const day = String(seoulDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6">
      {/* 달력/리스트 전환 탭 */}
      {wishlistCount > 0 && (
        <div className="flex border border-gray-800 p-1 max-w-md mx-auto">
          <button
            onClick={() => setWishlistViewMode("calendar")}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              wishlistViewMode === "calendar"
                ? "bg-orange-500 text-black"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            달력
          </button>
          <button
            onClick={() => setWishlistViewMode("list")}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              wishlistViewMode === "list"
                ? "bg-orange-500 text-black"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            리스트
          </button>
        </div>
      )}

      {wishlistCount === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-lg mb-2 text-gray-100">
            아직 찜한 영화가 없습니다
          </p>
          <p className="text-sm text-gray-400">
            영화 카드의 하트 아이콘을 클릭해서 찜 목록에 추가해보세요!
          </p>
        </div>
      ) : wishlistViewMode === "calendar" ? (
        <CalendarView
          wishlistMovies={wishlistMovies}
          onMovieClick={onMovieClick}
          onRemoveFromWishlist={onToggleWishlist}
        />
      ) : (
        <div className="space-y-8">
          {getWishlistByDate().map(({ date, movies }) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {new Date(date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
                <span className="text-sm font-normal text-gray-400">
                  ({movies.length}개)
                </span>
              </h3>

              <div className="space-y-3">
                {movies.map((movie) => {
                  const now = new Date();
                  const movieDateTime = new Date(
                    movie.showtime || `${date}T${movie.time}:00`
                  );
                  const isPast = movieDateTime < now;
                  const isToday = date === getLocalDateString(new Date());
                  const posterUrl =
                    movie.tmdbPosterUrl || movie.posterUrl || "/NoPoster.png";

                  return (
                    <div
                      key={`${movie.title}-${movie.theater}-${movie.time}`}
                      onClick={() => onMovieClick(movie)}
                      className={`relative overflow-hidden cursor-pointer border transition-all ${
                        isPast
                          ? "border-gray-700 opacity-60"
                          : "border-gray-700 hover:border-orange-500"
                      }`}
                    >
                      {/* 블러 배경 */}
                      <div
                        className="absolute inset-0 scale-110"
                        style={{
                          backgroundImage: `url(${posterUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: "blur(16px)",
                          opacity: 0.2,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/75" />

                      {/* 카드 콘텐츠 */}
                      <div className="relative flex items-center gap-4 p-3">
                        {/* 포스터 */}
                        <div className="flex-shrink-0 h-24 aspect-[2/3] overflow-hidden shadow-lg ring-1 ring-orange-500/30">
                          <img
                            src={posterUrl}
                            alt={movie.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/NoPoster.png";
                            }}
                          />
                        </div>

                        {/* 영화 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-sm font-bold leading-snug mb-2 ${
                              isPast ? "text-gray-400" : "text-white"
                            }`}
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {movie.title}
                          </h3>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={`text-xs font-semibold ${isPast ? "text-gray-500" : "text-orange-400"}`}>
                                {movie.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-xs text-gray-300 truncate">{movie.theater}</span>
                            </div>
                            {movie.screen && (
                              <span className="text-xs text-gray-500 truncate pl-4">{movie.screen}</span>
                            )}
                          </div>
                          {isPast && (
                            <span className="mt-1.5 inline-block text-[10px] text-gray-500 italic">
                              {isToday ? "이미 상영이 시작되었습니다" : "지난 상영 일정입니다"}
                            </span>
                          )}
                        </div>

                        {/* 알림 / 찜 제거 버튼 */}
                        <div className="flex flex-col gap-1.5 flex-shrink-0 z-10">
                          {isNative() && !isPast && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleNotification(movie, date);
                              }}
                              aria-label="상영 알림 설정"
                              className="p-1.5 bg-black/40 hover:bg-black/70 rounded-full transition-colors"
                              title="1시간 전 알림"
                            >
                              <svg
                                className={`w-4 h-4 ${scheduledIds.has(notifKey(movie, date)) ? "text-orange-400 fill-current" : "text-gray-400"}`}
                                viewBox="0 0 24 24"
                                fill={scheduledIds.has(notifKey(movie, date)) ? "currentColor" : "none"}
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(movie);
                            }}
                            aria-label="찜 목록에서 제거"
                            className="p-1.5 bg-black/40 hover:bg-black/70 rounded-full transition-colors"
                            title="찜 목록에서 제거"
                          >
                            <svg className="w-4 h-4 text-red-400 fill-current" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 전체 삭제 버튼 */}
      {wishlistCount > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "찜 목록을 모두 삭제하시겠어요?\n삭제된 데이터는 복구되지 않습니다."
                )
              ) {
                onClearAll();
              }
            }}
            className="px-4 py-2 bg-red-900/30 text-red-400 text-sm font-medium hover:bg-red-900/50 transition-all flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            전체 삭제
          </button>
        </div>
      )}
    </div>
  );
}
