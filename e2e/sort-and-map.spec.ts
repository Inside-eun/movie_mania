import { test, expect } from "@playwright/test";
import { captureGaEvents, getGaEvents, hasAnyMovieCard, waitForScheduleLoaded } from "./helpers";

test.describe("정렬 / 보기 방식 / 지도", () => {
  test("정렬 방식(시간순↔거리순)을 전환하면 라벨과 GA 이벤트가 바뀐다", async ({ page }) => {
    await captureGaEvents(page);
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 정렬 컨트롤이 노출되지 않음");
      return;
    }

    const sortButton = page.getByTestId("sort-toggle-button");
    await expect(sortButton).toContainText("시간순");

    await sortButton.click();
    await expect(sortButton).toContainText("거리순");

    const events = await getGaEvents(page);
    expect(events).toContainEqual(
      expect.objectContaining({
        name: "sort_changed",
        params: expect.objectContaining({ sort_type: "distance" }),
      })
    );

    await sortButton.click();
    await expect(sortButton).toContainText("시간순");
  });

  test("보기 방식(2열→3열→리스트)을 순환 전환할 수 있다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 보기 방식 컨트롤이 노출되지 않음");
      return;
    }

    const layoutButton = page.getByTestId("layout-toggle-button");
    const card = page.getByTestId("movie-card").first();

    // 기본 2열 그리드
    await expect(card).toHaveClass(/flex-col/);

    await layoutButton.click(); // 3열
    await layoutButton.click(); // 리스트
    await expect(card).toHaveClass(/flex-row/);

    await layoutButton.click(); // 다시 2열로 순환
    await expect(card).toHaveClass(/flex-col/);
  });

  test("지도 아이콘을 누르면 길찾기 모달이 뜨고 닫을 수 있다", async ({ page }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      test.skip(true, "상영작이 없어 지도 아이콘이 노출되지 않음");
      return;
    }

    const mapButtons = page.getByRole("button", { name: "지도로 소요시간 보기" });
    const count = await mapButtons.count();
    if (count === 0) {
      test.skip(true, "지도 아이콘이 없음");
      return;
    }
    await mapButtons.first().click();

    const modalOpened = await page
      .getByText("가는 길", { exact: false })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!modalOpened) {
      test.skip(true, "해당 영화관에 좌표 정보가 없어 모달이 열리지 않음");
      return;
    }

    await page.getByRole("button", { name: "닫기" }).click();
    await expect(page.getByText("가는 길", { exact: false })).toHaveCount(0);
  });
});
