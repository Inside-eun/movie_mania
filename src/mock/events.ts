// 영화관 기획전(이벤트) 정보.
// 실제 데이터는 events.json에 있다. 매주 src/scripts/scan-instagram-events.ts가 극장 인스타그램을
// 스캔하고, src/scripts/sync-instagram-events.ts가 후보를 정리·검증해 통과한 것만
// events.json에 반영해 main에 자동 배포한다. 사람이 직접 고칠 때도 events.json을 고치면 된다.
import eventsData from "./events.json";

export interface CuratedEvent {
  id: string;
  title: string;
  theaterNames: string[]; // 같은 기획전이 여러 극장에서 열리는 경우 모두 나열
  period: string; // 표시용 기간 텍스트
  startDate: string; // YYYY-MM-DD, 홈 배너 노출 시작일 (이 날짜부터 노출)
  endDate: string | null; // YYYY-MM-DD, 홈 배너 노출 종료일. "상영 중"처럼 끝이 정해지지 않았으면 null(수동으로 뺄 때까지 계속 노출)
  summary: string;
  description: string;
  movieTitles: string[]; // 상영 시간표 데이터의 title과 매칭
  note?: string; // 관리용 메모(화면에 표시 안 됨). JSON에는 주석을 못 달아서 이 필드에 적는다.
}

export const mockEvents: CuratedEvent[] = eventsData;

// 종료일이 지난 기획전인지. today는 YYYY-MM-DD(로컬 날짜). endDate가 null이면 "상영 중"으로 본다.
export function isEventEnded(event: CuratedEvent, today: string): boolean {
  return event.endDate !== null && event.endDate < today;
}

export function getEvent(id: string): CuratedEvent | undefined {
  return mockEvents.find((e) => e.id === id);
}
