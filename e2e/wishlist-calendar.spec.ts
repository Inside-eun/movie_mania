import { test, expect } from "@playwright/test";
import { bottomNav, hasAnyMovieCard, waitForScheduleLoaded } from "./helpers";

test.describe("찜 달력 뷰 (기본 모드)", () => {
  test("찜을 추가하면 기본 달력 뷰에 표시되고, 월 이동이 동작한다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 찜 동작을 확인할 수 없음");
      return;
    }

    await page
      .getByTestId("movie-card")
      .first()
      .getByRole("button", { name: "찜 목록에 추가" })
      .click();

    await bottomNav(page).getByRole("button", { name: "찜" }).click();

    // 기본값은 달력 뷰
    await expect(page.getByRole("button", { name: "달력" })).toHaveClass(/bg-orange-500/);

    const monthHeading = page.getByRole("heading", { name: /\d{4}년 \d{1,2}월/ });
    const before = await monthHeading.innerText();

    await page.getByRole("button", { name: "다음 달" }).click();
    await expect(monthHeading).not.toHaveText(before);

    await page.getByRole("button", { name: "이전 달" }).click();
    await expect(monthHeading).toHaveText(before);

    // 뒷정리: 리스트 모드로 가서 찜 해제
    await page.getByRole("button", { name: "리스트" }).click();
    await page
      .getByTestId("wishlist-movie-card")
      .first()
      .getByRole("button", { name: "찜 목록에서 제거" })
      .click();
  });
});
