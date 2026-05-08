// cgv.co.kr은 Cloudflare bot protection으로 서버사이드 API 호출 불가.
// 예매 URL 생성은 불가하며 극장 시간표 폴백 URL만 제공한다.
//
// URL 구조 참고:
// https://cgv.co.kr/cnm/movieBook/movie?movNo={movNo}&scnYmd={date}&siteNo={siteNo}&siteNm={siteNm}&scnsNo={scnsNo}&scnSseq={scnSseq}

interface CGVCinemaConfig {
  siteNo: string;
  siteNm: string;
  // 해당 극장에서 예술영화를 상영하는 특정 관 (null = 전관)
  screenNo: string | null;
  fallbackUrl: string;
}

export const CGV_CINEMAS: Record<string, CGVCinemaConfig> = {
  'CGV 용산아이파크몰': {
    siteNo: '1088',
    siteNm: 'CGV+%EC%9A%A9%EC%82%B0%EC%95%84%EC%9D%B4%ED%8C%8C%ED%81%AC%EB%AA%B0',
    screenNo: '019', // 19관
    fallbackUrl: 'https://cgv.co.kr/cnm/schedule/cgvSchedule?siteNo=1088',
  },
  'CGV 압구정': {
    siteNo: '1111',
    siteNm: 'CGV+%EC%95%95%EA%B5%AC%EC%A0%95',
    screenNo: null, // 전관
    fallbackUrl: 'https://cgv.co.kr/cnm/schedule/cgvSchedule?siteNo=1111',
  },
  'CGV 신촌아트레온': {
    siteNo: '1205',
    siteNm: 'CGV+%EC%8B%A0%EC%B4%8C%EC%95%84%ED%8A%B8%EB%A0%88%EC%98%A8',
    screenNo: '010', // 10관
    fallbackUrl: 'https://cgv.co.kr/cnm/schedule/cgvSchedule?siteNo=1205',
  },
  'CGV 대학로': {
    siteNo: '1127',
    siteNm: 'CGV+%EB%8C%80%ED%95%99%EB%A1%9C',
    screenNo: '005', // 5관
    fallbackUrl: 'https://cgv.co.kr/cnm/schedule/cgvSchedule?siteNo=1127',
  },
  'CGV 강변': {
    siteNo: '1016',
    siteNm: 'CGV+%EA%B0%95%EB%B3%80',
    screenNo: '004', // 4관
    fallbackUrl: 'https://cgv.co.kr/cnm/schedule/cgvSchedule?siteNo=1016',
  },
  'CGV 여의도': {
    siteNo: '1034',
    siteNm: 'CGV+%EC%97%AC%EC%9D%98%EB%8F%84',
    screenNo: '005', // 5관
    fallbackUrl: 'https://cgv.co.kr/cnm/schedule/cgvSchedule?siteNo=1034',
  },
};

export function isSupportedCGVTheater(theaterName: string): boolean {
  return theaterName in CGV_CINEMAS;
}

export function getCGVFallbackUrl(theaterName: string): string | null {
  return CGV_CINEMAS[theaterName]?.fallbackUrl ?? null;
}

export async function buildCGVBookingUrl(
  theaterName: string,
  _movieTitle: string,
  _time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = CGV_CINEMAS[theaterName];
  if (!config) return null;

  const scnYmd = date.replace(/-/g, '');
  const fallbackUrl = `${config.fallbackUrl}&scnYmd=${scnYmd}`;
  return { url: fallbackUrl, isFallback: true };
}
