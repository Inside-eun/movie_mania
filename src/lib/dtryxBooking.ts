interface DtryxCinemaConfig {
  cgid: string;
  brandCd: string;
  cinemaCd: string;
  fallbackUrl: string;
}

// dtryx 예매 시스템을 사용하는 극장 설정
export const DTRYX_CINEMAS: Record<string, DtryxCinemaConfig> = {
  '씨네큐브광화문(서울)': {
    cgid: '81630DDE-489C-4034-A6FB-9AD54E055E5B',
    brandCd: 'cinecube',
    cinemaCd: '000003',
    fallbackUrl: 'https://www.dtryx.com/cinema/main.do?cgid=81630DDE-489C-4034-A6FB-9AD54E055E5B',
  },
};

export function isSupportedDtryxTheater(theaterName: string): boolean {
  return theaterName in DTRYX_CINEMAS;
}

export function getDtryxFallbackUrl(theaterName: string): string | null {
  return DTRYX_CINEMAS[theaterName]?.fallbackUrl ?? null;
}

interface DtryxShowEntry {
  TimeTableMovieCd?: string;
  TimeTableMovieNm?: string;
  TimeTableBrandCd?: string;
  TimeTableCinemaCd?: string;
  TimeTableScreenCd?: string;
  TimeTableScreenNm?: string;
  TimeTablePlaySDT?: string;
  TimeTableShowSeq?: number | string;
  [key: string]: unknown;
}

async function fetchDtryxTimetable(
  cgid: string,
  cinemaCd: string,
  date: string,
): Promise<DtryxShowEntry[]> {
  const playDate = date.replace(/-/g, ''); // YYYYMMDD
  const url = `https://www.dtryx.com/cinema/timetable.do?CompanyGuID=${cgid}&CinemaCd=${cinemaCd}&PlayDate=${playDate}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://www.dtryx.com/',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`dtryx timetable API 오류: ${res.status}`);
  }

  const data = await res.json();

  // 응답 형식에 따라 배열 추출 (유연하게 처리)
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.TimeTable)) return data.TimeTable;
  if (Array.isArray(data?.timetable)) return data.timetable;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;

  console.warn('dtryx API 응답 형식 미확인:', JSON.stringify(data).substring(0, 200));
  return [];
}

export async function buildDtryxBookingUrl(
  theaterName: string,
  movieTitle: string,
  time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = DTRYX_CINEMAS[theaterName];
  if (!config) return null;

  try {
    const shows = await fetchDtryxTimetable(config.cgid, config.cinemaCd, date);

    if (shows.length === 0) {
      return { url: config.fallbackUrl, isFallback: true };
    }

    // 영화 제목과 상영 시간으로 매칭
    const targetTime = time.substring(0, 5); // "HH:MM"

    const matched = shows.find((s) => {
      const showNm = (s.TimeTableMovieNm ?? '').trim();
      const playSDT = s.TimeTablePlaySDT ?? '';
      // TimeTablePlaySDT가 "2026-05-07 14:00:00" 또는 "14:00" 형식일 수 있음
      const showTime = playSDT.length >= 16
        ? playSDT.substring(11, 16)
        : playSDT.substring(0, 5);
      const titleMatch =
        showNm === movieTitle ||
        showNm.includes(movieTitle) ||
        movieTitle.includes(showNm);
      return titleMatch && showTime === targetTime;
    });

    if (!matched) {
      console.warn(`dtryx 매칭 실패: ${movieTitle} ${time}`);
      return { url: config.fallbackUrl, isFallback: true };
    }

    const movieCd = matched.TimeTableMovieCd;
    const screenCd = matched.TimeTableScreenCd;
    const showSeq = matched.TimeTableShowSeq;

    if (!movieCd || !screenCd || showSeq === undefined) {
      return { url: config.fallbackUrl, isFallback: true };
    }

    const bookingUrl =
      `https://www.dtryx.com/reserve/movie.do` +
      `?cgid=${config.cgid}` +
      `&CompanyGuID=${config.cgid}` +
      `&ChannelCd=naver-homepage` +
      `&TimeTableMovieCd=${movieCd}` +
      `&TimeTableBrandCd=${config.brandCd}` +
      `&TimeTableCinemaCd=${config.cinemaCd}` +
      `&TimeTableScreenCd=${screenCd}` +
      `&TimeTablePlaySDT=${date}` +
      `&TimeTableShowSeq=${showSeq}`;

    return { url: bookingUrl, isFallback: false };
  } catch (error) {
    console.error('dtryx 예매 URL 생성 실패:', error);
    return { url: config.fallbackUrl, isFallback: true };
  }
}
