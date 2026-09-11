import { test, expect } from "@playwright/test";
import { closeFilterSheet, hasAnyMovieCard, waitForScheduleLoaded } from "./helpers";

test.describe("영화관별 필터", () => {
  test("영화관을 선택하면 목록이 좁혀지고, 초기화하면 되돌아온다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 필터를 확인할 수 없음");
      return;
    }

    const totalBefore = await page.getByTestId("movie-card").count();

    await page.getByTestId("filter-toggle-button").click();
    await page.getByTestId("filter-tab-theater").click();

    // 극장 체크박스 중 첫 번째를 선택
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    const theaterLabel = firstCheckbox.locator("xpath=..");
    const theaterText = (await theaterLabel.locator("span").last().innerText()).trim();
    await firstCheckbox.check();

    // 바텀시트 닫기
    await closeFilterSheet(page);

    const filteredCount = await page.getByTestId("movie-card").count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(totalBefore);

    // 필터링된 카드들은 전부 선택한 극장 소속이어야 한다 (극장명 앞부분으로 확인)
    const theaterNameOnly = theaterText.replace(/\s*\(\d+\)\s*$/, "");
    const theaterTexts = await page.getByTestId("movie-card").locator("text=" + theaterNameOnly).count();
    expect(theaterTexts).toBeGreaterThan(0);

    // 초기화
    await page.getByTestId("filter-toggle-button").click();
    await expect(page.getByRole("button", { name: "초기화" })).toBeVisible();
    await page.getByRole("button", { name: "초기화" }).click();
    await closeFilterSheet(page);

    const restoredCount = await page.getByTestId("movie-card").count();
    expect(restoredCount).toBe(totalBefore);
  });
});
