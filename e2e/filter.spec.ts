import { test, expect } from "@playwright/test";
import { hasAnyMovieCard, waitForScheduleLoaded } from "./helpers";

test.describe("필터 & 날짜 선택", () => {
  test("필터 바텀시트를 열고 닫을 수 있다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 필터 UI가 노출되지 않음");
      return;
    }

    await page.getByTestId("filter-toggle-button").click();
    await expect(page.getByText("필터", { exact: true })).toBeVisible();

    // 영화별 / 영화관별 탭 전환이 동작한다
    await page.getByTestId("filter-tab-theater").click();
    await expect(page.getByTestId("filter-tab-theater")).toHaveClass(/bg-orange-500/);

    await page.getByTestId("filter-tab-movie").click();
    await expect(page.getByTestId("filter-tab-movie")).toHaveClass(/bg-orange-500/);
  });

  test("날짜를 변경하면 선택된 날짜 표시가 갱신된다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    const dateInput = page.locator('input[type="date"]');
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    await dateInput.fill(tomorrowStr);
    await waitForScheduleLoaded(page);

    const [y, m, d] = tomorrowStr.split("-");
    await expect(page.getByText(`${y}. ${m}. ${d}.`)).toBeVisible();
  });
});
