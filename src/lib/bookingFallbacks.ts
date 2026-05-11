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
  // cgv 극장 (Cloudflare 차단으로 서버사이드 movNo 조회 불가 — 날짜별 예매 페이지로 연결)
  'CGV 용산아이파크몰': 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0013&siteNm=%EC%9A%A9%EC%82%B0%EC%95%84%EC%9D%B4%ED%8C%8C%ED%81%AC%EB%AA%B0&scnsNo=017',
  'CGV 압구정': 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0040&siteNm=%EC%95%95%EA%B5%AC%EC%A0%95&scnsNo=005',
  'CGV 신촌아트레온': 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0150&siteNm=%EC%8B%A0%EC%B4%8C%EC%95%84%ED%8A%B8%EB%A0%88%EC%98%A8&scnsNo=016',
  'CGV 대학로': 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0063&siteNm=%EB%8C%80%ED%95%99%EB%A1%9C&scnsNo=005',
  'CGV 강변': 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0001&siteNm=%EA%B0%95%EB%B3%80&scnsNo=005',
  // cineq 극장
  '씨네큐 신도림': 'https://www.cineq.co.kr/?theaterCode=1001',
  // koreafilm 극장
  '한국영상자료원 시네마테크KOFA': 'https://www.koreafilm.or.kr/cinematheque/schedule',
  // tinyticket 극장
  '서울아트시네마': 'https://www.tinyticket.net/event-manager/EMusZONUABqg',
  '인디스페이스': 'https://www.tinyticket.net/event-manager/EM9Lu9GNN0ZA',
  // moviee 극장
  'KU시네마테크': 'https://moviee.co.kr/Movie/Ticket?tId=121',
  'KT&G 상상마당 Cinema': 'https://moviee.co.kr/Movie/Ticket?tId=123',
  '필름포럼': 'https://moviee.co.kr/Movie/Ticket?tId=130',
  // 롯데시네마
  '롯데시네마 신도림': 'https://www.lottecinema.co.kr/NLCHS/ticketing',
  // 메가박스
  '픽처하우스': 'https://www.megabox.co.kr/picturehouse',
};

export function getBookingFallbackUrl(theaterName: string): string | null {
  return BOOKING_FALLBACK_URLS[theaterName] ?? null;
}
