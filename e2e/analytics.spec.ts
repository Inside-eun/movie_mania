import { test, expect } from "@playwright/test";
import {
  bottomNav,
  captureGaEvents,
  getGaEvents,
  hasAnyMovieCard,
  waitForScheduleLoaded,
} from "./helpers";

/**
 * GA4 이벤트 발생 여부 검증.
 * 실제 구글로는 아무 것도 보내지 않고(captureGaEvents가 네트워크를 차단),
 * window.gtag 호출이 window.dataLayer에 쌓이는 걸 가로채서 확인한다.
 */
test.describe("GA4 이벤트 트래킹", () => {
  test("필터 바텀시트를 열고 탭을 바꾸면 filter_opened / filter_tab_changed 이벤트가 발생한다", async ({
    page,
  }) => {
    await captureGaEvents(page); // goto 전에 등록해야 함
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 필터 UI가 노출되지 않음");
      return;
    }

    await page.getByTestId("filter-toggle-button").click();
    await page.getByTestId("filter-tab-theater").click();

    const events = await getGaEvents(page);

    expect(events).toContainEqual(
      expect.objectContaining({ name: "filter_opened" })
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        name: "filter_tab_changed",
        params: expect.objectContaining({ tab: "theater" }),
      })
    );
  });

  test("찜 추가/제거 시 wishlist_added / wishlist_removed 이벤트가 정확한 파라미터로 발생한다", async ({
    page,
  }) => {
    await captureGaEvents(page);
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 찜 동작을 확인할 수 없음");
      return;
    }

    const firstCard = page.getByTestId("movie-card").first();
    const title = await firstCard.locator("h2").first().innerText();
    await firstCard.getByRole("button", { name: "찜 목록에 추가" }).click();

    let events = await getGaEvents(page);
    const addedEvent = events.find((e) => e.name === "wishlist_added");
    expect(addedEvent).toBeTruthy();
    expect(addedEvent?.params).toMatchObject({ movie_title: title });

    await bottomNav(page).getByRole("button", { name: "찜" }).click();
    await page.getByRole("button", { name: "리스트" }).click();
    await page
      .getByTestId("wishlist-movie-card")
      .first()
      .getByRole("button", { name: "찜 목록에서 제거" })
      .click();

    events = await getGaEvents(page);
    expect(events).toContainEqual(
      expect.objectContaining({ name: "wishlist_removed" })
    );
  });

  test("하단 탭을 전환하면 tab_changed 이벤트가 발생한다", async ({ page }) => {
    await captureGaEvents(page);
    await page.goto("/");
    await waitForScheduleLoaded(page);

    await bottomNav(page).getByRole("button", { name: "기획전" }).click();
    await bottomNav(page).getByRole("button", { name: "설정" }).click();
    await bottomNav(page).getByRole("button", { name: "홈" }).click();

    const events = await getGaEvents(page);
    const tabEvents = events.filter((e) => e.name === "tab_changed");
    const tabs = tabEvents.map((e) => e.params?.tab_name ?? e.params?.tab);

    expect(tabs).toEqual(expect.arrayContaining(["events", "settings", "home"]));
  });

  test("정렬 방식을 바꾸면 sort_changed 이벤트가 발생한다", async ({ page }) => {
    await captureGaEvents(page);
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 정렬 컨트롤이 노출되지 않음");
      return;
    }

    await page.getByTestId("sort-toggle-button").click();

    const events = await getGaEvents(page);
    expect(events).toContainEqual(
      expect.objectContaining({
        name: "sort_changed",
        params: expect.objectContaining({ sort_type: "distance" }),
      })
    );
  });
});
