// CGV 예매 URL 생성
// movNo는 영화별 전국 공통 고정값 → cgvMovNoCache.json에서 조회.
//
// 중요: movieBook/movie 페이지는 movNo가 없으면 CGV 서버가 아예
// "잘못된 요청으로 처리할 수 없습니다" 하드 에러를 띄운다(siteNo/siteNm/scnsNo만
// 있고 movNo가 없는 URL로 실기기 Safari에서 직접 확인함). 그래서 캐시 미스일 때는
// siteNo 기반 URL을 만들지 않고 통합검색 페이지로 대신 보낸다.
//
// URL 구조(movNo 있을 때):
// https://cgv.co.kr/cnm/movieBook/movie?movNo={movNo}&scnYmd={date}&siteNo={siteNo}&siteNm={siteNm}&scnsNo={scnsNo}
//
// 새 영화 추가 방법:
// npx tsx src/scripts/fetchCgvMovNo.ts "영화 제목" (= npm run cgv:movno -- "영화 제목")
// 자동 조회가 안 되면(신작 미색인 등) DevTools Network 탭 → searchMovScnInfo 응답에서
// movNo 확인 후 addCGVMovNo.ts로 수동 추가.

import movNoCache from './cgvMovNoCache.json';

interface CGVCinemaConfig {
  siteNo: string;
  siteNm: string; // URL-encoded 극장 위치 단축명 (CGV 제외)
  scnsNo: string; // 예술관 상영관 번호
}

export const CGV_CINEMAS: Record<string, CGVCinemaConfig> = {
  'CGV 용산아이파크몰': {
    siteNo: '0013',
    siteNm: '%EC%9A%A9%EC%82%B0%EC%95%84%EC%9D%B4%ED%8C%8C%ED%81%AC%EB%AA%B0',
    scnsNo: '017',
  },
  'CGV 압구정': {
    siteNo: '0040',
    siteNm: '%EC%95%95%EA%B5%AC%EC%A0%95',
    scnsNo: '005',
  },
  'CGV 신촌아트레온': {
    siteNo: '0150',
    siteNm: '%EC%8B%A0%EC%B4%8C%EC%95%84%ED%8A%B8%EB%A0%88%EC%98%A8',
    scnsNo: '016',
  },
  'CGV 대학로': {
    siteNo: '0063',
    siteNm: '%EB%8C%80%ED%95%99%EB%A1%9C',
    scnsNo: '005',
  },
  'CGV 강변': {
    siteNo: '0001',
    siteNm: '%EA%B0%95%EB%B3%80',
    scnsNo: '005',
  },
};

export function isSupportedCGVTheater(theaterName: string): boolean {
  return theaterName in CGV_CINEMAS;
}

// movNo 없이는 movieBook/movie가 하드 에러를 띄우므로, 영화 제목으로 통합검색
// 페이지에 보내 사용자가 직접 예매하기를 누르게 한다(에러는 안 나지만 검색어
// 자동입력은 안 됨 — CGV가 query 파라미터로 즉시 검색해주진 않음, 실기기 확인함).
export function getCGVSearchFallbackUrl(movieTitle: string): string {
  return `https://cgv.co.kr/tme/itgrSrch?query=${encodeURIComponent(movieTitle)}`;
}

export function getCGVFallbackUrl(theaterName: string): string | null {
  return CGV_CINEMAS[theaterName] ? 'https://cgv.co.kr/tme/itgrSrch' : null;
}

// CGV가 예전에 쓰던 5자리 안팎의 구형 movNo는 이후 다른 영화에 재할당된 사례가
// 확인됨(예: "기생충"→81774, "라디오 스타"→12413로 캐시돼 있었는데 실기기에서
// 열어보면 둘 다 전혀 다른 영화 "오디세이" 예매 페이지로 감 — 에러도 없이 조용히
// 엉뚱한 영화를 예매하게 될 위험). 지금 신작에 쓰이는 형식(30으로 시작하는 8자리)만
// 신뢰하고, 그 외 형식은 못 찾은 것으로 처리해 통합검색 폴백으로 보낸다.
const SAFE_MOVNO_PATTERN = /^30\d{6}$/;

function lookupMovNo(movieTitle: string): string | null {
  const titleNorm = movieTitle.replace(/\s+/g, '');
  for (const [key, movNo] of Object.entries(movNoCache)) {
    if (key.replace(/\s+/g, '') === titleNorm) {
      return SAFE_MOVNO_PATTERN.test(movNo) ? movNo : null;
    }
  }
  return null;
}

export async function buildCGVBookingUrl(
  theaterName: string,
  movieTitle: string,
  _time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = CGV_CINEMAS[theaterName];
  if (!config) return null;

  const scnYmd = date.replace(/-/g, '');
  const movNo = lookupMovNo(movieTitle);

  if (movNo) {
    const url = `https://cgv.co.kr/cnm/movieBook/movie?movNo=${movNo}&scnYmd=${scnYmd}&siteNo=${config.siteNo}&siteNm=${config.siteNm}&scnsNo=${config.scnsNo}`;
    return { url, isFallback: false };
  }

  // 캐시 미스: movNo 없이 movieBook/movie로 보내면 CGV가 "잘못된 요청" 하드 에러를
  // 띄우므로, 통합검색 페이지로 대신 보낸다.
  return { url: getCGVSearchFallbackUrl(movieTitle), isFallback: true };
}
