import { Page, expect } from "@playwright/test";

/**
 * 홈 화면이 로딩 스피너를 벗어나 데이터(영화 목록 또는 빈 상태 문구)를
 * 표시할 때까지 기다린다. 크롤링 API 응답 속도가 들쭉날쭉하므로 넉넉히 대기.
 */
export async function waitForScheduleLoaded(page: Page) {
  await expect(page.getByText("상영시간표를 불러오는 중...")).toHaveCount(0, {
    timeout: 20_000,
  });
}

/**
 * 하단 네비게이션(nav) 영역. 영화 카드의 "찜" 버튼과 텍스트가 겹치므로
 * 항상 이 영역으로 스코프를 좁혀서 홈/찜/기획전/설정 버튼을 찾는다.
 */
export function bottomNav(page: Page) {
  return page.locator("nav");
}

/** 오늘 날짜 기준으로 상영 영화가 1개 이상 있는지 여부 */
export async function hasAnyMovieCard(page: Page): Promise<boolean> {
  const emptyState = page.getByText("상영 중인 예술영화가 없습니다.");
  if (await emptyState.isVisible().catch(() => false)) {
    return false;
  }
  return true;
}
