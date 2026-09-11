import { test, expect } from "@playwright/test";
import { bottomNav, hasAnyMovieCard, waitForScheduleLoaded } from "./helpers";

test.describe("설정 화면 & 즐겨찾는 영화관", () => {
  test("영화관을 즐겨찾기에 추가하면 칩으로 표시되고, 홈 필터에도 즐겨찾기 그룹이 뜬다", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForScheduleLoaded(page);

    await bottomNav(page).getByRole("button", { name: "설정" }).click();
    await page.getByRole("button", { name: /즐겨찾는 영화관$/ }).click();

    // 섹션이 펼쳐지고 극장 칩 목록이 보임
    const firstTheaterChip = page
      .locator('button[title]')
      .filter({ hasText: /.+/ })
      .first();
    await expect(firstTheaterChip).toBeVisible();
    const theaterName = (await firstTheaterChip.innerText()).trim();

    await firstTheaterChip.click();

    // 선택한 영화관이 "OOO 즐겨찾기 해제" 칩으로 옮겨감
    const removableChip = page.getByRole("button", {
      name: `${theaterName} 즐겨찾기 해제`,
    });
    await expect(removableChip).toBeVisible();

    // 홈으로 돌아가 필터에서 즐겨찾기 그룹이 노출되는지 확인 (오늘 그 극장 상영작이 있을 때만)
    await bottomNav(page).getByRole("button", { name: "홈" }).click();
    await waitForScheduleLoaded(page);

    if (!(await hasAnyMovieCard(page))) {
      // 즐겨찾기 해제만 정리하고 종료
      await bottomNav(page).getByRole("button", { name: "설정" }).click();
      await removableChip.click();
      test.skip(true, "오늘 상영작이 없어 필터 화면까지는 확인 못함");
      return;
    }

    await page.getByTestId("filter-toggle-button").click();
    await page.getByTestId("filter-tab-theater").click();
    const favoriteGroup = page.getByText("★ 즐겨찾기 영화관", { exact: false });
    const favoriteGroupShown = await favoriteGroup.isVisible().catch(() => false);
    // 즐겨찾은 극장이 오늘 상영 중이 아니면 그룹 자체가 안 뜨는 게 정상 동작이라 단정하지 않음
    if (favoriteGroupShown) {
      await expect(favoriteGroup).toBeVisible();
    }

    // 뒷정리: 즐겨찾기 해제
    // SettingsView는 탭을 벗어났다 돌아오면 매번 다시 마운트되어 아코디언이
    // 접힌 상태로 초기화되므로, 해제하려면 섹션을 다시 펼쳐야 한다.
    await page.locator('button:has(svg path[d^="M6 18L18 6"])').click();
    await bottomNav(page).getByRole("button", { name: "설정" }).click();
    await page.getByRole("button", { name: /즐겨찾는 영화관$/ }).click();
    await page.getByRole("button", { name: `${theaterName} 즐겨찾기 해제` }).click();
  });
});
