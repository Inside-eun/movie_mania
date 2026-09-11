import { test, expect } from "@playwright/test";
import { bottomNav, waitForScheduleLoaded } from "./helpers";

test.describe("기획전", () => {
  test("기획전 목록에서 항목을 클릭하면 상세로 진입하고 목록으로 되돌아온다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    await bottomNav(page).getByRole("button", { name: "기획전" }).click();

    const firstEvent = page.getByTestId("event-card").first();
    await expect(firstEvent).toBeVisible();
    const title = await firstEvent.locator("p.font-bold").first().innerText();

    await firstEvent.click();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("상영작")).toBeVisible();

    await page.getByRole("button", { name: "← 기획전 목록" }).click();
    await expect(page.getByTestId("event-card").first()).toBeVisible();
  });
});
