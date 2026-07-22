// 프로토타입 전용 목 데이터: 영화관 기획전(이벤트) 정보
// 실제 기획전이 아니며, "기획전 섹션 + 예매 알림" 화면 사용성 검증을 위한 가상의 큐레이션.
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
    id: "kubrick-retro",
    title: "스탠리 큐브릭 레트로스펙티브",
    theaterName: "필름포럼",
    period: "2026.07.18 - 2026.08.02",
    bannerColor: "#111827",
    summary: "큐브릭의 대표작을 스크린으로 다시 만나는 시간",
    description:
      "스탠리 큐브릭 감독의 대표작을 필름포럼에서 재상영합니다. 시대를 앞서간 연출과 압도적인 스코어를 큰 화면에서 경험해보세요. (프로토타입용 가상 기획전)",
    movieTitles: ["2001 스페이스 오디세이", "샤이닝", "풀 메탈 자켓 (재개봉)", "닥터 스트레인지러브 (4K 리마스터)"],
  },
  {
    id: "youth-soundtrack",
    title: "청춘의 사운드트랙",
    theaterName: "아트하우스모모",
    period: "2026.07.20 - 2026.08.10",
    bannerColor: "#9333ea",
    summary: "음악과 함께 완성되는 성장의 순간들",
    description:
      "음악이 서사의 중심에 있는 성장 영화들을 모았습니다. 청춘의 흔들림과 설렘을 담은 사운드트랙을 함께 즐겨보세요. (프로토타입용 가상 기획전)",
    movieTitles: ["싱 스트리트", "보이후드", "원스 어게인 (재개봉)"],
  },
  {
    id: "asian-women-directors",
    title: "아시아 여성 감독 특별전",
    theaterName: "씨네큐브광화문(서울)",
    period: "2026.07.15 - 2026.08.05",
    bannerColor: "#db2777",
    summary: "아시아 여성 감독들의 시선으로 본 세계",
    description:
      "아시아 각국 여성 감독들의 작품을 소개하는 특별전입니다. 서로 다른 문화와 시대를 관통하는 공통된 정서를 발견해보세요. (프로토타입용 가상 기획전)",
    movieTitles: ["이반리 장만옥", "동경의 황혼", "화양연화 (재개봉 예정)"],
  },
  {
    id: "midnight-cult",
    title: "심야 컬트 클래식전",
    theaterName: "낭만극장",
    period: "2026.07.20 - 2026.08.15",
    bannerColor: "#dc2626",
    summary: "잠들지 못하는 밤을 위한 컬트 라인업",
    description:
      "심야 상영으로 즐기는 컬트 영화 모음전입니다. 예측할 수 없는 전개와 독특한 매력의 작품들을 늦은 밤 스크린으로 만나보세요. (프로토타입용 가상 기획전)",
    movieTitles: ["백룸", "시크릿 에이전트", "이레이저헤드 (심야 재상영)"],
  },
];

export function getEvent(id: string): CuratedEvent | undefined {
  return mockEvents.find((e) => e.id === id);
}
