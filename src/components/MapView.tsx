"use client";

import { useCallback, useRef } from "react";
import { Map, CustomOverlayMap, ZoomControl, useKakaoLoader } from "react-kakao-maps-sdk";

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  selected?: boolean;
}

interface MapViewProps {
  pins: MapPin[];
  userPoint?: { lat: number; lng: number } | null;
  onPinClick?: (id: string) => void;
  height?: number;
}

export default function MapView({ pins, userPoint, onPinClick, height = 320 }: MapViewProps) {
  const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const [loading, error] = useKakaoLoader({
    appkey: appkey ?? "",
  });

  // pins/userPoint는 즐겨찾기 토글 등으로 매 렌더마다 새 배열/객체가 되므로,
  // onCreate는 최초 지도 생성 시 한 번만 실행되도록 ref로 최신 값을 참조한다.
  // (onCreate가 렌더마다 재생성되면 SDK가 이를 다시 호출해 setBounds가 반복 실행되어
  //  사용자가 조작한 확대/축소 상태가 계속 초기화된다.)
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const userPointRef = useRef(userPoint);
  userPointRef.current = userPoint;

  const handleMapCreate = useCallback((map: kakao.maps.Map) => {
    const bounds = new kakao.maps.LatLngBounds();
    pinsRef.current.forEach((pin) => bounds.extend(new kakao.maps.LatLng(pin.lat, pin.lng)));
    if (userPointRef.current) {
      bounds.extend(new kakao.maps.LatLng(userPointRef.current.lat, userPointRef.current.lng));
    }
    map.setBounds(bounds);
  }, []);

  const containerClass =
    "relative w-full overflow-hidden bg-gray-900 border border-gray-800 flex items-center justify-center text-[11px] text-gray-400 text-center px-4";

  if (!appkey) {
    return (
      <div className={containerClass} style={{ height }}>
        지도를 표시하려면 NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수를 설정하세요.
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className={containerClass} style={{ height }}>
        표시할 위치 정보가 없습니다.
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
        center={{ lat: pins[0].lat, lng: pins[0].lng }}
        style={{ width: "100%", height: "100%" }}
        level={7}
        onCreate={handleMapCreate}
      >
        <ZoomControl position={kakao.maps.ControlPosition.RIGHT} />

        {pins.map((pin) => (
          <CustomOverlayMap key={pin.id} position={{ lat: pin.lat, lng: pin.lng }} yAnchor={1} clickable>
            <button onClick={() => onPinClick?.(pin.id)} className="flex flex-col items-center group">
              <span
                className={`w-3 h-3 rounded-full border-2 transition-transform group-active:scale-90 ${
                  pin.selected ? "bg-orange-500 border-orange-300 scale-125" : "bg-gray-300 border-gray-500"
                }`}
              />
              <span
                className={`mt-1 text-[10px] px-1.5 py-0.5 whitespace-nowrap ${
                  pin.selected ? "bg-orange-500 text-black font-bold" : "bg-black/70 text-gray-300"
                }`}
              >
                {pin.label}
              </span>
            </button>
          </CustomOverlayMap>
        ))}

        {userPoint && (
          <CustomOverlayMap position={userPoint} yAnchor={0.5}>
            <div className="flex flex-col items-center">
              <span className="block w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-blue-200 animate-pulse" />
              <span className="mt-1 block text-[10px] text-blue-300 text-center">현위치</span>
            </div>
          </CustomOverlayMap>
        )}
      </Map>
    </div>
  );
}
