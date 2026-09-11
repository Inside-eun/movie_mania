import { test, expect } from "@playwright/test";
import { hasAnyMovieCard, waitForScheduleLoaded } from "./helpers";

test.describe("영화 상세 화면", () => {
  test("영화 카드를 클릭하면 상세 화면으로 이동하고 뒤로 가기가 동작한다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "오늘 상영 중인 영화가 없어 상세 화면 진입을 확인할 수 없음");
      return;
    }

    const firstCard = page.getByTestId("movie-card").first();
    await expect(firstCard).toBeVisible();
    const title = await firstCard.locator("h2").first().innerText();

    await firstCard.click();

    await expect(page).toHaveURL(/\/movie\//);
    // 상세 화면에 진입한 영화의 제목이 노출되어야 한다
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL("/");
  });
});
