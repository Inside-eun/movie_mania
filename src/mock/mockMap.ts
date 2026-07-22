// 프로토타입 전용: 실제 지도 SDK(Kakao/Naver/Google Map) 연동 전, 화면 사용성만
// 검증하기 위한 좌표 -> SVG 배치 변환 및 이동시간 추정 로직. 실제 지도 API 키가
// 준비되면 이 파일과 MockMapView 컴포넌트를 실 지도 컴포넌트로 교체하면 된다.
import { calculateDistance } from "@/utils/date";

// 서울 예술영화관 좌표 범위(대략) — artCinemas.js 데이터 기준
const BOUNDS = {
  minLat: 37.48,
  maxLat: 37.66,
  minLng: 126.88,
  maxLng: 127.10,
};

export interface SvgPoint {
  xPct: number; // 0~100
  yPct: number; // 0~100 (위쪽이 북쪽)
}

export function toSvgPoint(lat: number, lng: number): SvgPoint {
  const xPct =
    ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  // 위도가 높을수록(북쪽) 화면 위쪽 -> y는 반전
  const yPct =
    (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return {
    xPct: Math.min(96, Math.max(4, xPct)),
    yPct: Math.min(96, Math.max(4, yPct)),
  };
}

export interface TravelEstimate {
  distanceKm: number;
  walkMinutes: number;
  transitMinutes: number;
  carMinutes: number;
}

// 서울 평균 이동 속도 가정치(프로토타입용 어림값)
const WALK_KMH = 4.5;
const TRANSIT_KMH = 18; // 환승/대기시간 포함 어림
const CAR_KMH = 22; // 도심 정체 포함 어림

export function estimateTravel(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): TravelEstimate {
  const distanceKm = calculateDistance(fromLat, fromLng, toLat, toLng);
  return {
    distanceKm,
    walkMinutes: Math.round((distanceKm / WALK_KMH) * 60),
    transitMinutes: Math.round((distanceKm / TRANSIT_KMH) * 60) + 5,
    carMinutes: Math.round((distanceKm / CAR_KMH) * 60),
  };
}
