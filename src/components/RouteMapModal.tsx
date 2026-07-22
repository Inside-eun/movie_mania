"use client";

import { useEffect, useState } from "react";

import MockMapView from "@/components/MockMapView";
import { estimateTravel, toSvgPoint } from "@/mock/mockMap";

// 위치 권한이 없을 때 기본값 (서울시청)
const DEFAULT_USER_LOCATION = { latitude: 37.5663, longitude: 126.9779 };

interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  theaterName: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function RouteMapModal({
  isOpen,
  onClose,
  theaterName,
  latitude,
  longitude,
}: RouteMapModalProps) {
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [usingDefault, setUsingDefault] = useState(true);

  useEffect(() => {
    if (!isOpen || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setUsingDefault(false);
      },
      () => setUsingDefault(true)
    );
  }, [isOpen]);

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

  if (!isOpen || latitude == null || longitude == null || !theaterName) return null;

  const theaterPoint = toSvgPoint(latitude, longitude);
  const userPoint = toSvgPoint(userLocation.latitude, userLocation.longitude);
  const travel = estimateTravel(userLocation.latitude, userLocation.longitude, latitude, longitude);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden shadow-2xl border border-gray-800 bg-gray-950 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white">{theaterName} 가는 길</h2>
            <p className="text-[11px] text-gray-500">
              {usingDefault ? "위치 권한이 없어 서울시청 기준으로 표시합니다." : "현재 위치 기준 예상 소요시간입니다."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <MockMapView
          pins={[{ id: theaterName, xPct: theaterPoint.xPct, yPct: theaterPoint.yPct, label: theaterName, selected: true }]}
          userPoint={userPoint}
          height={240}
        />

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-gray-900 border border-gray-800 p-3 text-center">
            <p className="text-lg">🚶</p>
            <p className="text-sm font-bold text-white mt-1">{travel.walkMinutes}분</p>
            <p className="text-[10px] text-gray-500">도보</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-3 text-center">
            <p className="text-lg">🚇</p>
            <p className="text-sm font-bold text-white mt-1">{travel.transitMinutes}분</p>
            <p className="text-[10px] text-gray-500">대중교통</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-3 text-center">
            <p className="text-lg">🚗</p>
            <p className="text-sm font-bold text-white mt-1">{travel.carMinutes}분</p>
            <p className="text-[10px] text-gray-500">자동차</p>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mt-3">
          직선거리 약 {travel.distanceKm.toFixed(1)}km · 어림 계산값이며 실제 경로/교통 상황과 다를 수 있습니다.
        </p>
      </div>
    </div>
  );
}
