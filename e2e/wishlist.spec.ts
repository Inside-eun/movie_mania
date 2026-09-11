import { test, expect } from "@playwright/test";
import { bottomNav, hasAnyMovieCard, waitForScheduleLoaded } from "./helpers";

test.describe("찜 기능", () => {
  test("영화를 찜하면 찜 탭에 카운트와 항목이 표시되고, 해제하면 사라진다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "오늘 상영 중인 영화가 없어 찜 동작을 확인할 수 없음");
      return;
    }

    const firstCard = page.getByTestId("movie-card").first();
    await firstCard.getByRole("button", { name: "찜 목록에 추가" }).click();

    // 하단 네비게이션 '찜' 배지에 카운트 1이 표시됨
    const wishlistTab = bottomNav(page).getByRole("button", { name: "찜" });
    await expect(wishlistTab.locator("span", { hasText: /^\d+$/ })).toHaveText("1");

    await wishlistTab.click();

    // 리스트 모드로 전환해 방금 찜한 영화가 보이는지 확인
    await page.getByRole("button", { name: "리스트" }).click();
    const wishlistCard = page.getByTestId("wishlist-movie-card").first();
    await expect(wishlistCard).toBeVisible();

    // 찜 목록에서 다시 제거
    await wishlistCard.getByRole("button", { name: "찜 목록에서 제거" }).click();
    await expect(page.getByText("아직 찜한 영화가 없습니다")).toBeVisible();
  });
});
