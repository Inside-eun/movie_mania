import puppeteer from "puppeteer";
import { Movie, Theater } from "../types/index.js";

export class CrawlerService {
  async crawlKOBIS(): Promise<Movie[]> {
    // Vercel 환경 감지
    const isVercel = process.env.VERCEL === "1";

    const browser = await puppeteer.launch({
      headless: true, // 서버리스 환경에서는 headless 모드 필수
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });
    const page = await browser.newPage();
    const movies: Movie[] = [];

    try {
      // 디버깅을 위한 콘솔 로그 표시
      page.on("console", (msg) => console.log("브라우저 콘솔:", msg.text()));

      // 네트워크 요청/응답 모니터링
      page.on("request", (request) =>
        console.log("요청:", request.url(), request.method())
      );
      page.on("response", (response) =>
        console.log("응답:", response.url(), response.status())
      );

      // 브라우저 설정
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
      );

      console.log("KOBIS 페이지 접속 중...");
      await page.goto(
        "https://www.kobis.or.kr/kobis/business/mast/thea/findTheaterSchedule.do",
        {
          waitUntil: "networkidle0",
          timeout: 30000,
        }
      );

      // 페이지 로드 확인
      const html = await page.content();
      console.log("페이지 HTML 일부:", html.substring(0, 200));

      console.log("서울시 선택...");
      const seoulSelect = await page.$('select[name="sWideareaCd"]');
      if (!seoulSelect) {
        throw new Error("서울시 선택 드롭다운을 찾을 수 없습니다");
      }
      await seoulSelect.select("0105");
      await page.waitForTimeout(2000);

      console.log("마포구 선택...");
      const mapoSelect = await page.$('select[name="sBasareaCd"]');
      if (!mapoSelect) {
        throw new Error("마포구 선택 드롭다운을 찾을 수 없습니다");
      }
      await mapoSelect.select("0156");
      await page.waitForTimeout(2000);

      console.log("검색 버튼 찾는 중...");
      const searchButton = await page.$('button[type="submit"]');
      if (!searchButton) {
        throw new Error("검색 버튼을 찾을 수 없습니다");
      }

      console.log("검색 버튼 클릭...");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        searchButton.click(),
      ]);

      // 스크린샷 저장 (Vercel 환경에서는 생략)
      if (!isVercel) {
        await page.screenshot({ path: "debug-page.png", fullPage: true });
      }

      console.log("데이터 파싱 중...");
      const scheduleData = await page.evaluate(() => {
        console.log("브라우저 내부 실행...");
        const items = Array.from(
          document.querySelectorAll(".schedule-item, tr")
        );
        console.log("발견된 항목:", items.length);
        return items
          .map((item) => {
            const data = {
              movieName: item
                .querySelector(".movie-name, td:nth-child(1)")
                ?.textContent?.trim(),
              screenName: item
                .querySelector(".screen-name, td:nth-child(2)")
                ?.textContent?.trim(),
              showtime: item
                .querySelector(".showtime, td:nth-child(3)")
                ?.textContent?.trim(),
              theaterName:
                item.querySelector(".theater-name")?.textContent?.trim() ||
                "마포구 영화관",
            };
            console.log("파싱된 데이터:", data);
            return data;
          })
          .filter((item) => item.movieName && item.showtime);
      });

      console.log("파싱된 전체 데이터:", scheduleData);

      if (scheduleData && scheduleData.length > 0) {
        const today = new Date();
        scheduleData.forEach((item: any) => {
          if (!item.showtime) return;

          const timeMatch = item.showtime.match(/(\d{2}):?(\d{2})/);
          if (!timeMatch) return;

          const [_, hours, minutes] = timeMatch;
          movies.push({
            id: `${item.theaterName}-${item.movieName}-${hours}${minutes}`,
            title: item.movieName.replace("(디지털)", "").trim(),
            theater: {
              id: item.theaterName.toLowerCase().replace(/\s+/g, "-"),
              name: item.theaterName,
              location: "서울시 마포구",
              type: item.theaterName.includes("아트")
                ? "arthouse"
                : "multiplex",
            },
            showtime: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              parseInt(hours),
              parseInt(minutes)
            ),
            isArtHouse: item.theaterName.includes("아트"),
            screenName: item.screenName,
          });
        });

        movies.sort((a, b) => a.showtime.getTime() - b.showtime.getTime());
      }

      // 개발 환경에서만 대기 (Vercel에서는 시간 단축)
      if (!isVercel) {
        await page.waitForTimeout(5000);
      }
      return movies;
    } catch (error) {
      console.error("크롤링 중 에러:", error);
      // 에러 발생 시에도 스크린샷 저장 (Vercel 환경에서는 생략)
      if (!isVercel) {
        await page.screenshot({ path: "error-page.png", fullPage: true });
      }
      throw error;
    } finally {
      await browser.close();
    }
  }
}
