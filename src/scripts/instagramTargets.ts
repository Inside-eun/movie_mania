// 인스타그램 기획전 스캔 대상 계정 목록.
// username은 인스타그램 핸들(@ 제외), theaterName은 가능한 한 src/data/artCinemas.js의
// cdNm과 맞춰서 적는다 (완전히 별개 브랜드 계정인 CGV아트하우스 등은 예외).
export interface InstagramScanTarget {
  username: string;
  theaterName: string;
}

export const instagramScanTargets: InstagramScanTarget[] = [
  { username: "laikacinema", theaterName: "라이카시네마" },
  { username: "emuartspace", theaterName: "에무 시네마 앤 카페" },
  { username: "sangsangcinema", theaterName: "KT&G 상상마당 Cinema" },
  { username: "picture_house7", theaterName: "픽처하우스" },
  { username: "kucinema", theaterName: "KU시네마테크" },
  { username: "deosup_artcinema", theaterName: "더숲 아트시네마" },
  { username: "artninecinema", theaterName: "아트나인" },
  { username: "monoplex_official", theaterName: "모노플렉스앳라이즈" },
  { username: "indiespace_kr", theaterName: "인디스페이스" },
  { username: "arthousemomo", theaterName: "아트하우스모모" },
  { username: "filmforum_cinema", theaterName: "필름포럼" },
  { username: "arirang_cine", theaterName: "아리랑시네센터(서울)" },
  { username: "cinecube_kr", theaterName: "씨네큐브광화문(서울)" },
  { username: "seoulartcinema", theaterName: "서울아트시네마" },
  { username: "seoulfilmcenter", theaterName: "서울영화센터" },
  // CGV 아트하우스 계정 하나가 여러 지점(용산아이파크몰/압구정/신촌아트레온/대학로/강변/여의도)을
  // 함께 다룸 — 어느 지점인지는 캡션 내용을 보고 검토 단계에서 사람이 확인해야 한다.
  { username: "cgv_arthouse", theaterName: "CGV아트하우스" },
];
