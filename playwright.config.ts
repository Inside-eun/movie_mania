import { defineConfig, devices } from "@playwright/test";

/**
 * 영화방랑자 E2E 테스트 설정
 *
 * 기본 대상은 실제 배포된 프로덕션 사이트(moviemania-olive.vercel.app)다.
 * 로컬 dev 서버와 배포본 사이에 동작 차이가 있어서, 실사용자가 보는 화면을
 * 기준으로 검증하기 위해 배포 사이트를 메인으로 둔다.
 *
 * 실행:
 *   npm run test:e2e           → 프로덕션 배포 사이트 대상
 *   npm run test:e2e:local     → 로컬 dev 서버(localhost:3000) 대상, 자동으로 npm run dev 실행
 *   E2E_BASE_URL=<url> npm run test:e2e → 임의의 URL(예: preview 배포) 대상
 */
const PRODUCTION_URL = "https://moviemania-olive.vercel.app";
const LOCAL_URL = "http://localhost:3000";

const baseURL = process.env.E2E_BASE_URL ?? PRODUCTION_URL;
const isLocalTarget = baseURL.startsWith("http://localhost");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30_000,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // 이 앱은 모바일(Capacitor iOS / PWA) 전용 UI로 설계되어 있고
  // 하단 네비게이션도 `sm:hidden`이 아닌 모바일 뷰포트에서만 노출됨.
  // 그래서 E2E는 모바일 뷰포트를 기준으로 검증한다.
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],

  // 로컬을 대상으로 할 때만 dev 서버를 자동으로 띄움 (배포 사이트 대상일 땐 불필요)
  webServer: isLocalTarget
    ? {
        command: "npm run dev",
        url: LOCAL_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
