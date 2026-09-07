"use client";

import { useEffect, useState } from "react";

import { getTheaterDetailByName } from "@/mock/theaterDetails";
import { getSnapshotMoviesByTheater, SNAPSHOT_DATE } from "@/mock/snapshot";

interface TheaterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  theaterName: string | null;
  onRouteClick?: (theaterName: string) => void;
}

export default function TheaterDetailModal({
  isOpen,
  onClose,
  theaterName,
  onRouteClick,
}: TheaterDetailModalProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const theater = theaterName ? getTheaterDetailByName(theaterName) : undefined;

  useEffect(() => {
    if (!theater) return;
    const saved = localStorage.getItem("favoriteTheaters");
    const list: string[] = saved ? JSON.parse(saved) : [];
    setIsFavorite(list.includes(theater.cdNm));
  }, [theater]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !theater) return null;

  const showtimes = getSnapshotMoviesByTheater(theater.cdNm).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const toggleFavorite = () => {
    const saved = localStorage.getItem("favoriteTheaters");
    const list: string[] = saved ? JSON.parse(saved) : [];
    const next = list.includes(theater.cdNm)
      ? list.filter((n) => n !== theater.cdNm)
      : [...list, theater.cdNm];
    localStorage.setItem("favoriteTheaters", JSON.stringify(next));
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-800 bg-gray-950">
        <div
          className="h-24 flex items-end justify-between p-4 sticky top-0"
          style={{ backgroundColor: theater.heroColor }}
        >
          <div>
            <h2 className="text-lg font-bold text-white drop-shadow">{theater.cdNm}</h2>
            <p className="text-xs text-white/80">{theater.area}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={toggleFavorite}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${
                isFavorite ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-300"
              }`}
            >
              {isFavorite ? "★ 즐겨찾기 등록됨" : "☆ 즐겨찾기 추가"}
            </button>
            {onRouteClick && (
              <button
                onClick={() => onRouteClick(theater.cdNm)}
                className="flex-1 py-2 text-xs font-bold text-center bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                🗺 소요시간 보기
              </button>
            )}
          </div>

          <p className="text-sm text-gray-300 mb-4 leading-relaxed">{theater.description}</p>

          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div className="bg-gray-900 border border-gray-800 p-3">
              <p className="text-gray-500 mb-1">주소</p>
              <p className="text-gray-200">{theater.address ?? "정보 없음"}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-3">
              <p className="text-gray-500 mb-1">전화</p>
              <p className="text-gray-200">{theater.phone}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-3">
              <p className="text-gray-500 mb-1">운영시간</p>
              <p className="text-gray-200">{theater.hours}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-3">
              <p className="text-gray-500 mb-1">상영관 수</p>
              <p className="text-gray-200">{theater.screenCount}개관</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {theater.amenities.map((a) => (
              <span key={a} className="text-[10px] px-2 py-1 bg-gray-800 text-gray-400">
                {a}
              </span>
            ))}
          </div>

          <h3 className="text-sm font-bold text-white mb-2">
            오늘({SNAPSHOT_DATE}) 상영시간표
          </h3>
          {showtimes.length === 0 ? (
            <p className="text-xs text-gray-500">오늘 상영 정보가 없습니다.</p>
          ) : (
            <div className="space-y-1.5">
              {showtimes.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{m.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{m.screen}</p>
                  </div>
                  <span className="text-xs font-bold text-orange-500 flex-shrink-0 ml-2">
                    {m.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
