"use client";

import { useRef, useState } from "react";

// 프로토타입 전용: 실제 지도 SDK 대신 정적 이미지를 확대/축소·드래그로 탐색하는 목업.
// 모든 극장에 대해 동일한 이미지를 사용하며, 실제 위치와 무관하다.
const MAP_IMAGE_SRC = "/mock/theater-map-placeholder.png";

const MIN_SCALE = 1;
const MAX_SCALE = 3;

interface TheaterMapMockProps {
  height?: number;
}

export default function TheaterMapMock({ height = 260 }: TheaterMapMockProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampTranslate = (t: { x: number; y: number }, s: number) => {
    if (!containerRef.current) return t;
    const rect = containerRef.current.getBoundingClientRect();
    const maxX = (rect.width * (s - 1)) / 2;
    const maxY = (rect.height * (s - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, t.x)),
      y: Math.min(maxY, Math.max(-maxY, t.y)),
    };
  };

  const zoomBy = (delta: number) => {
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      setTranslate((t) => clampTranslate(t, next));
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.2 : -0.2);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    dragRef.current = { x: translate.x, y: translate.y, startX: e.clientX, startY: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTranslate(clampTranslate({ x: dragRef.current.x + dx, y: dragRef.current.y + dy }, scale));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gray-900 border border-gray-800 touch-none select-none"
      style={{ height }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MAP_IMAGE_SRC}
        alt="영화관 위치 지도"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "center center",
          cursor: scale > 1 ? "grab" : "default",
        }}
      />

      <div className="absolute top-2 left-2 text-[10px] text-gray-300 bg-black/60 px-2 py-1">
        지도 목업 이미지
      </div>

      <div className="absolute bottom-2 right-2 flex flex-col gap-1">
        <button
          onClick={() => zoomBy(0.4)}
          aria-label="확대"
          className="w-7 h-7 flex items-center justify-center bg-black/70 text-white text-base font-bold hover:bg-black/90 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(-0.4)}
          aria-label="축소"
          className="w-7 h-7 flex items-center justify-center bg-black/70 text-white text-base font-bold hover:bg-black/90 transition-colors"
        >
          −
        </button>
      </div>
    </div>
  );
}
