import { test, expect } from "@playwright/test";
import { bottomNav, waitForScheduleLoaded } from "./helpers";

test.describe("기본 화면 & 하단 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);
  });

  test("홈 화면이 정상적으로 로드된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "영화방랑자" })).toBeVisible();
    await expect(page.getByText("서울 예술영화관 상영시간표")).toBeVisible();
  });

  test("찜 탭으로 이동하면 찜 화면이 보이고, 홈으로 돌아올 수 있다", async ({ page }) => {
    const nav = bottomNav(page);
    await nav.getByRole("button", { name: "찜" }).click();
    // 찜 화면 진입 시 하단 네비게이션의 '찜' 버튼이 활성(주황) 상태가 된다
    await expect(nav.getByRole("button", { name: "찜" })).toHaveClass(/text-orange-500/);

    await nav.getByRole("button", { name: "홈" }).click();
    await expect(nav.getByRole("button", { name: "홈" })).toHaveClass(/text-orange-500/);
  });

  test("기획전 탭으로 이동할 수 있다", async ({ page }) => {
    const nav = bottomNav(page);
    await nav.getByRole("button", { name: "기획전" }).click();
    await expect(nav.getByRole("button", { name: "기획전" })).toHaveClass(/text-orange-500/);
  });

  test("설정 탭으로 이동할 수 있다", async ({ page }) => {
    const nav = bottomNav(page);
    await nav.getByRole("button", { name: "설정" }).click();
    await expect(nav.getByRole("button", { name: "설정" })).toHaveClass(/text-orange-500/);
  });
});
