import { test, expect } from "@playwright/test";
import { waitForScheduleLoaded } from "./helpers";

test.describe("빈 상태", () => {
  test("상영 스케줄이 0건이면 상영작 없음 문구가 표시된다", async ({ page }) => {
    // 실제 상영 데이터(mock 포함)는 날짜와 무관하게 항상 채워질 수 있어서
    // 빈 상태를 안정적으로 재현하려면 API 응답 자체를 0건으로 모킹한다.
    await page.route("**/api/schedules*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], timestamp: Date.now() }),
      })
    );

    await page.goto("/");
    await waitForScheduleLoaded(page);

    await expect(page.getByText("상영 중인 예술영화가 없습니다.")).toBeVisible();
  });

  test("영화 목록은 있지만 필터/시간 조건에 걸려 0건이면 안내 문구가 다르게 표시된다", async ({
    page,
  }) => {
    // 오늘 날짜 기준, 모든 상영시간이 이미 지난 것으로 모킹
    await page.route("**/api/schedules*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              title: "테스트용 지난 상영작",
              theater: "테스트 극장",
              time: "00:01",
              area: "테스트구",
              screen: "1관",
              movieCode: "TEST0001",
            },
          ],
          timestamp: Date.now(),
        }),
      })
    );

    await page.goto("/");
    await waitForScheduleLoaded(page);

    await expect(page.getByText("현재 시간 이후의 상영시간이 없습니다.")).toBeVisible();
  });
});
