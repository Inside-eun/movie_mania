// 프로토타입 전용 목 데이터: 영화관 상세 정보
// artCinemas.js의 기본 좌표/주소에 상세 페이지 프로토타입용 필드를 덧붙인 것.
// 실제 서비스 데이터가 아니며, 화면 사용성 검증을 위한 임시 값이다.
import { artCinemas } from "@/data/artCinemas";

export interface TheaterDetail {
  cd: string;
  cdNm: string;
  area: string;
  lat: number;
  lng: number;
  address?: string;
  phone: string;
  hours: string;
  screenCount: number;
  amenities: string[];
  description: string;
  heroColor: string; // 포스터/이미지 대신 쓰는 목업 컬러 블록
}

const HERO_COLORS = [
  "#7c3aed", "#db2777", "#0891b2", "#ca8a04", "#16a34a",
  "#dc2626", "#4f46e5", "#0d9488", "#c2410c", "#9333ea",
];

const AMENITY_POOL = [
  ["휠체어석", "카페 병설"],
  ["휠체어석", "북카페"],
  ["시네토크 공간", "아트샵"],
  ["휠체어석", "라운지"],
  ["카페 병설", "전시 공간"],
];

function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

export const theaterDetails: TheaterDetail[] = artCinemas.map((t) => ({
  ...t,
  phone: "02-000-0000",
  hours: "매일 10:00 - 24:00 (상영작에 따라 변동)",
  screenCount: 1 + hashIndex(t.cd, 4),
  amenities: AMENITY_POOL[hashIndex(t.cd, AMENITY_POOL.length)],
  description: `${t.cdNm}은(는) ${t.area} 지역을 대표하는 예술영화관으로, 독립·예술영화와 고전 명작을 중심으로 상영합니다. (프로토타입용 임시 설명)`,
  heroColor: HERO_COLORS[hashIndex(t.cd, HERO_COLORS.length)],
}));

export function getTheaterDetail(cd: string): TheaterDetail | undefined {
  return theaterDetails.find((t) => t.cd === cd);
}

export function getTheaterDetailByName(name: string): TheaterDetail | undefined {
  return theaterDetails.find((t) => t.cdNm === name);
}
