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

  test("예매 버튼이 활성화되면 외부 예매 링크가 채워진다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "오늘 상영 중인 영화가 없어 확인할 수 없음");
      return;
    }

    await page.getByTestId("movie-card").first().click();
    await expect(page).toHaveURL(/\/movie\//);

    const bookingLink = page.getByRole("link", { name: /예매하기|극장 바로가기/ });
    await expect(bookingLink).toBeVisible();

    // /api/booking-url 조회가 끝나면 href가 "#"이 아닌 실제 URL로 채워진다
    await expect
      .poll(async () => bookingLink.getAttribute("href"), { timeout: 15_000 })
      .not.toBe("#");

    await expect(bookingLink).toHaveAttribute("target", "_blank");
  });

  test("영화 상세의 찜 버튼으로도 찜을 추가/제거할 수 있다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "오늘 상영 중인 영화가 없어 확인할 수 없음");
      return;
    }

    await page.getByTestId("movie-card").first().click();
    await expect(page).toHaveURL(/\/movie\//);

    const wishlistButton = page.getByRole("button", {
      name: /찜 목록에 추가|찜 목록에서 제거/,
    });
    await expect(wishlistButton).toHaveAccessibleName("찜 목록에 추가");
    await wishlistButton.click();
    await expect(wishlistButton).toHaveAccessibleName("찜 목록에서 제거");
    await wishlistButton.click();
    await expect(wishlistButton).toHaveAccessibleName("찜 목록에 추가");
  });
});
