"use client";

// 프로토타입 전용 지도 목업. 실제 지도 SDK 없이 좌표를 SVG 좌표로 환산해
// 대략적인 위치 관계와 클릭 인터랙션만 검증하기 위한 컴포넌트다.
export interface MapPin {
  id: string;
  xPct: number;
  yPct: number;
  label: string;
  selected?: boolean;
  color?: string;
}

interface MockMapViewProps {
  pins: MapPin[];
  userPoint?: { xPct: number; yPct: number } | null;
  onPinClick?: (id: string) => void;
  height?: number;
}

export default function MockMapView({
  pins,
  userPoint,
  onPinClick,
  height = 320,
}: MockMapViewProps) {
  return (
    <div
      className="relative w-full overflow-hidden bg-gray-900 border border-gray-800"
      style={{ height }}
    >
      {/* 지도 배경 목업 (실제 지도 타일 아님) */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1f2937" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#111827" />
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="absolute top-2 left-2 text-[10px] text-gray-500 bg-black/60 px-2 py-1">
        실제 지도 아님 · 위치 관계 목업
      </div>

      {pins.map((pin) => (
        <button
          key={pin.id}
          onClick={() => onPinClick?.(pin.id)}
          className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group"
          style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
        >
          <span
            className={`w-3 h-3 rounded-full border-2 transition-transform group-active:scale-90 ${
              pin.selected
                ? "bg-orange-500 border-orange-300 scale-125"
                : "bg-gray-300 border-gray-500"
            }`}
            style={pin.color && !pin.selected ? { backgroundColor: pin.color } : undefined}
          />
          <span
            className={`mt-1 text-[10px] px-1.5 py-0.5 whitespace-nowrap ${
              pin.selected
                ? "bg-orange-500 text-black font-bold"
                : "bg-black/70 text-gray-300"
            }`}
          >
            {pin.label}
          </span>
        </button>
      ))}

      {userPoint && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${userPoint.xPct}%`, top: `${userPoint.yPct}%` }}
        >
          <span className="block w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-blue-200 animate-pulse" />
          <span className="mt-1 block text-[10px] text-blue-300 text-center">현위치</span>
        </div>
      )}
    </div>
  );
}
