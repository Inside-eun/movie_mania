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

export type CapturedGaEvent = { name: string; params: Record<string, unknown> };

/**
 * GA4 이벤트(window.gtag → window.dataLayer.push)를 가로채서 기록한다.
 * 실제 구글로는 아무 것도 전송하지 않는다:
 *   1) googletagmanager.com / google-analytics.com 으로 나가는 네트워크 요청을 차단
 *   2) dataLayer.push를 오버라이드해서 event 호출만 window.__gaEvents에 기록
 *
 * 반드시 page.goto() 하기 전에 호출해야 한다 (addInitScript는 다음 네비게이션부터 적용됨).
 */
export async function captureGaEvents(page: Page) {
  await page.route(
    /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/,
    (route) => route.abort()
  );

  await page.addInitScript(() => {
    // layout.tsx의 인라인 스크립트가 `window.dataLayer = window.dataLayer || []`로
    // 재사용하므로, 여기서 먼저 만들어둔 배열의 push를 오버라이드해두면 그대로 이어받는다.
    (window as any).dataLayer = [];
    (window as any).__gaEvents = [] as CapturedGaEvent[];
    const dataLayer = (window as any).dataLayer as any[];
    const originalPush = dataLayer.push.bind(dataLayer);
    dataLayer.push = (...entries: any[]) => {
      for (const entry of entries) {
        // gtag()는 arguments 객체를 그대로 push하므로 인덱스로 접근한다.
        if (entry && entry[0] === "event") {
          (window as any).__gaEvents.push({ name: entry[1], params: entry[2] ?? {} });
        }
      }
      return originalPush(...entries);
    };
  });
}

/** 지금까지 캡처된 GA4 이벤트 목록을 가져온다. */
export async function getGaEvents(page: Page): Promise<CapturedGaEvent[]> {
  return page.evaluate(() => (window as any).__gaEvents ?? []);
}
