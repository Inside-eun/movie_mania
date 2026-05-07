// 클라이언트에서 즉시 사용 가능한 폴백 URL 맵 (next/cache 미사용)
const BOOKING_FALLBACK_URLS: Record<string, string> = {
  // dtryx 극장
  '씨네큐브광화문(서울)': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=cinecube&CinemaCd=000003',
  '낭만극장': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000113',
  '더숲 아트시네마': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=indieart&CinemaCd=000065',
  '라이카시네마': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=spacedog&CinemaCd=000072',
  '아리랑시네센터(서울)': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000088',
  '아트나인': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000162',
  '아트하우스모모': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=indieart&CinemaCd=000067',
  '에무 시네마 앤 카페': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=indieart&CinemaCd=000069',
  '허리우드클래식': 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000115',
  // moviee 극장
  'KU시네마테크': 'https://moviee.co.kr/Movie/Ticket?tId=121',
  'KT&G 상상마당 Cinema': 'https://moviee.co.kr/Movie/Ticket?tId=123',
  '필름포럼': 'https://moviee.co.kr/Movie/Ticket?tId=130',
};

export function getBookingFallbackUrl(theaterName: string): string | null {
  return BOOKING_FALLBACK_URLS[theaterName] ?? null;
}
