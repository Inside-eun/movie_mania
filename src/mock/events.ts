// 영화관 기획전(이벤트) 정보.
// src/scripts/scan-instagram-events.ts로 실제 극장 인스타그램에서 스캔해 검수 후 반영한 실제 기획전이다.
export interface CuratedEvent {
  id: string;
  title: string;
  theaterName: string;
  period: string; // 표시용 기간 텍스트
  bannerColor: string;
  summary: string;
  description: string;
  movieTitles: string[]; // movies-snapshot.json의 title과 매칭
}

export const mockEvents: CuratedEvent[] = [
  {
    id: "bela-tarr-krasznahorkai",
    title: "벨라 타르 X 라슬로 크러스너호르커이 특별전",
    theaterName: "라이카시네마",
    period: "2026.09.16 - 2026.10.04",
    bannerColor: "#0c4a6e",
    summary: "두 거장이 30년간 함께 빚어낸 다섯 편의 걸작",
    description:
      "'이 시대 유일의 시네아스트' 벨라 타르와 2025년 노벨문학상 수상 작가 라슬로 크러스너호르커이. 30년에 걸친 두 거장의 협업으로 탄생한 다섯 편의 전설적인 작품을 라이카시네마에서 4K/2K 리마스터로 만납니다.",
    movieTitles: ["파멸", "사탄탱고", "베크마이스터 하모니즈", "런던에서 온 사나이", "토리노의 말"],
  },
  {
    id: "emu-wenders",
    title: "빔 벤더스 기획전",
    theaterName: "에무시네마",
    period: "2026.09 상영 중",
    bannerColor: "#92400e",
    summary: "로드무비의 거장이 그려낸 길 위의 시간들",
    description:
      "에무시네마에서 진행 중인 빔 벤더스 기획전. <파리, 텍사스>, <피나>, <이 세상 끝까지 - 디렉터스 컷> 등 아홉 편의 대표작을 만날 수 있습니다.",
    movieTitles: [
      "파리, 텍사스",
      "안젤름",
      "피나",
      "페널티킥 앞에 선 골키퍼의 불안",
      "룸 666",
      "이 세상 끝까지 - 디렉터스 컷",
      "미국인 친구",
      "도쿄가",
      "부에나 비스타 소셜 클럽",
    ],
  },
  {
    id: "bela-tarr-deosup",
    title: "벨라 타르 X 라슬로 크러스너호르커이 특별전",
    theaterName: "더숲 아트시네마",
    period: "2026.09.16 -",
    bannerColor: "#164e63",
    summary: "종말론적 세계관을 구현한 헝가리 묵시록의 거장들",
    description:
      "1980년대부터 함께 작업하며 독창적인 영화 세계를 구축해온 벨라 타르와 라슬로 크러스너호르커이. 소멸과 구원에 대한 질문을 이어온 두 거장의 영화를 더숲아트시네마에서 만납니다.",
    movieTitles: ["파멸", "사탄탱고", "베크마이스터 하모니즈", "런던에서 온 사나이", "토리노의 말"],
  },
  {
    id: "bela-tarr-momo",
    title: "벨라 타르 X 라슬로 크러스너호르커이 특별전",
    theaterName: "아트하우스모모",
    period: "2026.09.18 -",
    bannerColor: "#1e293b",
    summary: "벨라 타르 타계 추모, 크러스너호르커이 노벨문학상 수상 기념",
    description:
      "벨라 타르의 타계를 추모하고 라슬로 크러스너호르커이의 2025년 노벨문학상 수상을 기념하기 위해 마련된 특별전. 두 거장이 약 30년간 연출과 각본으로 협업한 작품들을 아트하우스모모에서 상영합니다.",
    movieTitles: ["파멸", "사탄탱고", "베크마이스터 하모니즈", "런던에서 온 사나이", "토리노의 말"],
  },
  {
    id: "artnine-suzuki-seijun",
    title: "스즈키 세이준 특별전: 다이쇼 로망 3부작",
    theaterName: "아트나인",
    period: "2026.09.09 - 2026.09.30",
    bannerColor: "#581c87",
    summary: "장르의 관습을 뒤흔든 거장의 몽환적인 후기 3부작",
    description:
      "일본영화사에서 자신만의 미학을 구축한 거장 스즈키 세이준의 '다이쇼 로망 3부작'. 현실의 논리에서 벗어난 이야기와 몽환적인 이미지, 대담한 색채와 미장센이 돋보이는 후기 대표작 세 편을 아트나인에서 만납니다.",
    movieTitles: ["지고이네르바이젠", "아지랑이좌", "유메지"],
  },
  {
    id: "seoulartcinema-adachi-masao",
    title: "영속하는 혁명: 아다치 마사오 특별전",
    theaterName: "서울아트시네마",
    period: "2026.09.18 - 2026.09.20",
    bannerColor: "#7f1d1d",
    summary: "정치적 실천으로서의 영화, 아다치 마사오의 동시대성",
    description:
      "시대와의 긴장 관계 속에서 영화 제작을 통해 정치적 실천을 시도해 온 아다치 마사오의 후기 작업을 조망하는 3일간의 특별전. 감독과의 온라인 시네토크와 강연도 함께 진행됩니다.",
    movieTitles: ["단식광대", "테러리스트", "레볼루션 +1"],
  },
];

export function getEvent(id: string): CuratedEvent | undefined {
  return mockEvents.find((e) => e.id === id);
}
