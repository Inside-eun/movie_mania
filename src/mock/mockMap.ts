// 프로토타입 전용: 실제 이동시간 API 연동 전, 직선거리 기반 이동시간 어림 추정 로직.
import { calculateDistance } from "@/utils/date";

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
