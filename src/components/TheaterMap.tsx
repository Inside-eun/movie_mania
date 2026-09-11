"use client";

import { useState } from "react";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

interface TheaterMapProps {
  lat?: number;
  lng?: number;
  name?: string;
  address?: string;
  height?: number;
}

export default function TheaterMap({ lat, lng, name, address, height = 260 }: TheaterMapProps) {
  const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [level, setLevel] = useState(4);

  const [loading, error] = useKakaoLoader({
    appkey: appkey ?? "",
  });

  const containerClass =
    "relative w-full overflow-hidden bg-gray-900 border border-gray-800 flex items-center justify-center text-[11px] text-gray-400 text-center px-4";

  if (!appkey) {
    return (
      <div className={containerClass} style={{ height }}>
        지도를 표시하려면 NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수를 설정하세요.
      </div>
    );
  }

  if (!lat || !lng) {
    return (
      <div className={containerClass} style={{ height }}>
        이 영화관의 위치 정보가 없습니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass} style={{ height }}>
        지도를 불러오지 못했습니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div className={containerClass} style={{ height }}>
        지도를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden border border-gray-800" style={{ height }}>
      <Map
        center={{ lat, lng }}
        style={{ width: "100%", height: "100%" }}
        level={level}
        onZoomChanged={(map) => setLevel(map.getLevel())}
      >
        <MapMarker position={{ lat, lng }}>
          {name && (
            <div className="px-2 py-1 text-[11px] text-gray-900 whitespace-nowrap">
              {name}
              {address && <div className="text-gray-500">{address}</div>}
            </div>
          )}
        </MapMarker>
      </Map>

      <div className="absolute bottom-2 right-2 flex flex-col gap-1">
        <button
          onClick={() => setLevel((prev) => Math.max(1, prev - 1))}
          aria-label="확대"
          className="w-7 h-7 flex items-center justify-center bg-black/70 text-white text-base font-bold hover:bg-black/90 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setLevel((prev) => Math.min(14, prev + 1))}
          aria-label="축소"
          className="w-7 h-7 flex items-center justify-center bg-black/70 text-white text-base font-bold hover:bg-black/90 transition-colors"
        >
          −
        </button>
      </div>
    </div>
  );
}
