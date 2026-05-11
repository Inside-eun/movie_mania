import { unstable_cache } from 'next/cache';

const CINEQ_THEATER_CODE = '1001';
const CINEQ_THEATER_NAME = '씨네큐 신도림';
const CINEQ_FALLBACK_URL = 'https://www.cineq.co.kr/?theaterCode=1001';

const CINEQ_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded',
  'X-Requested-With': 'XMLHttpRequest',
  Referer: 'https://www.cineq.co.kr/',
  Origin: 'https://www.cineq.co.kr',
};

export function isSupportedCineQTheater(theaterName: string): boolean {
  return theaterName === CINEQ_THEATER_NAME;
}

export function getCineQFallbackUrl(): string {
  return CINEQ_FALLBACK_URL;
}

// Returns { movieTitle → movieCode }
async function _fetchCineQMovieList(date: string): Promise<Record<string, string>> {
  const body = new URLSearchParams({ theaterCode: CINEQ_THEATER_CODE, playDate: date });

  const res = await fetch('https://www.cineq.co.kr/popup/ReserveMovieList', {
    method: 'POST',
    headers: CINEQ_HEADERS,
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`CineQ ReserveMovieList 오류: ${res.status}`);

  const html = await res.text();
  const movieMap: Record<string, string> = {};
  // value="20259791"  class="p-movie-check"  /><label ...><span ...>12</span>악마는 프라다를 입는다 2</label>
  const re = /value="(\d+)"[^/]*\/><label[^>]*><span[^>]*>[^<]*<\/span>([^<]+)<\/label>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    movieMap[m[2].trim()] = m[1];
  }
  return movieMap;
}

// 극장+날짜 단위로 10분 캐싱
const fetchCineQMovieList = unstable_cache(
  _fetchCineQMovieList,
  ['cineq-movielist'],
  { revalidate: 600 },
);

// Returns [{ time: "HH:MM", screenPlanId }]
async function _fetchCineQScreenPlans(
  date: string,
  movieCode: string,
): Promise<Array<{ time: string; screenPlanId: string }>> {
  const body = new URLSearchParams({
    theaterCode: CINEQ_THEATER_CODE,
    playDate: date,
    movieCode,
  });

  const res = await fetch('https://www.cineq.co.kr/popup/ReserveScreenPlan', {
    method: 'POST',
    headers: CINEQ_HEADERS,
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`CineQ ReserveScreenPlan 오류: ${res.status}`);

  const html = await res.text();
  const plans: Array<{ time: string; screenPlanId: string }> = [];
  // data-screenplanid="1048973" ... <span class="from">12:40
  const re = /data-screenplanid="(\d+)"[\s\S]*?<span class="from">(\d{2}:\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    plans.push({ screenPlanId: m[1], time: m[2] });
  }
  return plans;
}

// 영화+날짜 단위로 10분 캐싱
const fetchCineQScreenPlans = unstable_cache(
  _fetchCineQScreenPlans,
  ['cineq-screenplan'],
  { revalidate: 600 },
);

export async function buildCineQBookingUrl(
  theaterName: string,
  movieTitle: string,
  time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  if (theaterName !== CINEQ_THEATER_NAME) return null;

  // YYYYMMDD 형식으로 정규화
  const playDate = date.replace(/-/g, '');

  try {
    const movieMap = await fetchCineQMovieList(playDate);

    const movieCode = Object.entries(movieMap).find(([title]) => {
      return title === movieTitle || title.includes(movieTitle) || movieTitle.includes(title);
    })?.[1];

    if (!movieCode) {
      console.warn(`CineQ 영화 매칭 실패: ${movieTitle}`);
      return { url: CINEQ_FALLBACK_URL, isFallback: true };
    }

    const plans = await fetchCineQScreenPlans(playDate, movieCode);

    if (plans.length === 0) {
      return { url: CINEQ_FALLBACK_URL, isFallback: true };
    }

    const targetTime = time.substring(0, 5); // "HH:MM"
    const matched = plans.find((p) => p.time === targetTime);

    if (!matched) {
      console.warn(`CineQ 상영 시간 매칭 실패: ${movieTitle} ${time}`);
      return { url: CINEQ_FALLBACK_URL, isFallback: true };
    }

    const bookingUrl =
      `https://www.cineq.co.kr/` +
      `?playDate=${playDate}` +
      `&theaterCode=${CINEQ_THEATER_CODE}` +
      `&movieCode=${movieCode}` +
      `&screenPlanId=${matched.screenPlanId}`;

    return { url: bookingUrl, isFallback: false };
  } catch (error) {
    console.error('CineQ 예매 URL 생성 실패:', error);
    return { url: CINEQ_FALLBACK_URL, isFallback: true };
  }
}
