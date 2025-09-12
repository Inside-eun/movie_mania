import axios from "axios";
import * as cheerio from "cheerio";
import { artCinemas } from "../data/artCinemas.js";
import { cacheService } from "./cacheService.js";

// 네트워크 설정
const isVercel = process.env.VERCEL === "1";
const DEFAULT_TIMEOUT = isVercel ? 4000 : 15000; // Vercel: 4초로 더 단축
const MAX_RETRIES = isVercel ? 1 : 3; // Vercel에서는 재시도 1회만
const RETRY_DELAY = isVercel ? 200 : 2000; // Vercel에서는 재시도 딜레이 최소화

// 재시도 함수
async function retryRequest(
  requestFn,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `요청 실패 (${attempt}/${maxRetries}): ${error.message}, ${delay}ms 후 재시도...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 지수 백오프: 재시도할 때마다 딜레이 증가
      delay *= 1.5;
    }
  }
}

// 요청 간 딜레이 함수
async function delay(ms = 1000) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class CrawlerService {

  async getBoxOfficeTop5() {
    try {
      // 오늘 날짜 YYYYMMDD 형식으로 변환 (박스오피스는 전날 기준)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const targetDt =
        yesterday.getFullYear() +
        String(yesterday.getMonth() + 1).padStart(2, "0") +
        String(yesterday.getDate()).padStart(2, "0");

      const dateStr = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD 형식

      // 캐시에서 먼저 확인
      const cachedData = cacheService.get("boxoffice", dateStr);
      if (cachedData) {
        console.log("박스오피스: 캐시된 데이터 사용");
        return cachedData;
      }

      const response = await retryRequest(async () => {
        return await axios.get(
          `http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json`,
          {
            params: {
              key:
                process.env.KOBIS_API_KEY || "609eba269acb357be05be4ec60202702",
              targetDt: targetDt,
            },
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      // 박스오피스 API 응답 확인 (상세 로그는 제거)

      if (
        response.data &&
        response.data.boxOfficeResult &&
        response.data.boxOfficeResult.dailyBoxOfficeList
      ) {
        const top5Movies = response.data.boxOfficeResult.dailyBoxOfficeList
          .slice(0, 5)
          .map((movie) => movie.movieNm.replace(/\s*\([^)]*\)/g, "").trim()); // 괄호 안 내용 제거

        console.log("박스오피스 1~5위 영화:", top5Movies);

        // 캐시에 저장
        cacheService.set("boxoffice", dateStr, top5Movies);

        return top5Movies;
      } else {
        console.log("박스오피스 데이터가 없습니다.");
        return [];
      }
    } catch (error) {
      console.error("박스오피스 조회 실패:", error);
      console.error("박스오피스 API 실패로 기본 제외 목록 사용");
      
      // API 실패시 기본 제외 목록 사용 (최근 인기 영화들)
      const defaultExcludeList = [
        "베놈",
        "글래디에이터",
        "위키드",
        "모아나",
        "청설"
      ];
      
      console.log("기본 제외 목록:", defaultExcludeList);
      return defaultExcludeList;
    }
  }

  async getTheaterListByDistrict(wideAreaCd, basAreaCd) {
    try {
      const headers = {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://www.kobis.or.kr",
        Referer:
          "https://www.kobis.or.kr/kobis/business/mast/thea/findTheaterSchedule.do",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      };

      // CSRF 토큰 가져오기
      const mainPageResponse = await retryRequest(async () => {
        return await axios.get(
          "https://www.kobis.or.kr/kobis/business/mast/thea/findTheaterSchedule.do",
          {
            headers,
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      const $ = cheerio.load(mainPageResponse.data);
      let csrfToken =
        $('input[name="CSRFToken"]').val() ||
        mainPageResponse.data.match(/CSRFToken=([^"&]+)/)?.[1];

      // 지정된 구의 극장 목록 요청
      const formData = new URLSearchParams({
        sWideareaCd: wideAreaCd,
        sBasareaCd: basAreaCd,
      });

      await delay(500); // 요청 간 딜레이

      const response = await retryRequest(async () => {
        return await axios.post(
          `https://www.kobis.or.kr/kobis/business/mast/thea/findTheaCdList.do?CSRFToken=${csrfToken}`,
          formData.toString(),
          {
            headers,
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      return response.data;
    } catch (error) {
      console.error("극장 목록 조회 실패:", error);
      throw error;
    }
  }

  async getTheaterList() {
    try {
      const headers = {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://www.kobis.or.kr",
        Referer:
          "https://www.kobis.or.kr/kobis/business/mast/thea/findTheaterSchedule.do",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      };

      // CSRF 토큰 가져오기
      const mainPageResponse = await retryRequest(async () => {
        return await axios.get(
          "https://www.kobis.or.kr/kobis/business/mast/thea/findTheaterSchedule.do",
          {
            headers,
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      const $ = cheerio.load(mainPageResponse.data);
      let csrfToken =
        $('input[name="CSRFToken"]').val() ||
        mainPageResponse.data.match(/CSRFToken=([^"&]+)/)?.[1];

      // 마포구 극장 목록 요청
      const formData = new URLSearchParams({
        sWideareaCd: "0105001", // 서울시 코드
        sBasareaCd: "010600113", // 마포구 코드
      });

      await delay(500); // 요청 간 딜레이

      const response = await retryRequest(async () => {
        return await axios.post(
          `https://www.kobis.or.kr/kobis/business/mast/thea/findTheaCdList.do?CSRFToken=${csrfToken}`,
          formData.toString(),
          {
            headers,
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      return response.data;
    } catch (error) {
      console.error("극장 목록 조회 실패:", error);
      throw error;
    }
  }

  async getSchedule(theaterCode, date) {
    try {
      const headers = {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://www.kobis.or.kr",
        Referer:
          "https://www.kobis.or.kr/kobis/business/mast/thea/findTheaterSchedule.do",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      };

      // CSRF 토큰 가져오기
      const mainPageResponse = await retryRequest(async () => {
        return await axios.get(
          "https://www.kobis.or.kr/kobis/business/mast/thea/findTheaterSchedule.do",
          {
            headers,
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      const $ = cheerio.load(mainPageResponse.data);
      let csrfToken =
        $('input[name="CSRFToken"]').val() ||
        mainPageResponse.data.match(/CSRFToken=([^"&]+)/)?.[1];

      // 상영 스케줄 요청
      const formData = new URLSearchParams({
        theaCd: theaterCode,
        showDt: date,
      });

      await delay(isVercel ? 100 : 300); // Vercel에서는 딜레이 단축

      const response = await retryRequest(async () => {
        return await axios.post(
          `https://www.kobis.or.kr/kobis/business/mast/thea/findSchedule.do?CSRFToken=${csrfToken}`,
          formData.toString(),
          {
            headers,
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      return response.data;
    } catch (error) {
      console.error("상영 스케줄 조회 실패:", error);
      throw error;
    }
  }

  async getKOFASchedule() {
    return this.getKOFAScheduleByDate(new Date());
  }

  async getKOFAScheduleByDate(targetDate) {
    try {
      const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD 형식

      // 캐시에서 먼저 확인
      const cachedData = cacheService.get("kofa", dateStr);
      if (cachedData) {
        console.log("한국영상자료원 시네마테크KOFA: 캐시된 데이터 사용");
        return cachedData;
      }

      console.log("한국영상자료원 시네마테크KOFA 상영시간표 조회 중...");

      const response = await retryRequest(async () => {
        return await axios.get(
          "https://www.koreafilm.or.kr/cinematheque/schedule",
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            },
            timeout: DEFAULT_TIMEOUT,
          }
        );
      });

      const $ = cheerio.load(response.data);
      const schedules = [];

      // 지정된 날짜에 해당하는 섹션 찾기
      const targetDateNum = targetDate.getDate();

      // 오늘 날짜가 포함된 txt-day 클래스 찾기 (dt 태그)
      $("dt.txt-day").each((index, element) => {
        const $dayElement = $(element);
        const dayText = $dayElement.text().trim();

        // 지정된 날짜가 포함되어 있는지 확인 (예: "11.목")
        if (dayText.includes(`${targetDateNum}.`)) {
          // dt 다음에 오는 모든 dd 요소들 찾기
          const $ddElements = $dayElement.nextAll("dd");

          $ddElements.each((ddIndex, ddElement) => {
            const $dd = $(ddElement);

            // dd 안의 list-detail-1 ul 찾기
            const $scheduleList = $dd.find("ul.list-detail-1");

            $scheduleList.each((ulIndex, ulElement) => {
              const $ul = $(ulElement);

              // 시간 정보 추출
              const timeText = $ul.find(".txt-time .icon-dot").text().trim();

              // 영화 제목 추출
              const titleText = $ul.find(".txt-detail .txt-1 a").text().trim();

              // 상영관 정보 추출
              const roomText = $ul.find(".txt-room").text().trim();

              if (timeText && titleText) {
                const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  const hours = parseInt(timeMatch[1]);
                  const minutes = parseInt(timeMatch[2]);

                  schedules.push({
                    title: titleText,
                    theater: "한국영상자료원 시네마테크KOFA",
                    area: "마포구",
                    screen: roomText || "시네마테크",
                    time: `${String(hours).padStart(2, "0")}:${String(
                      minutes
                    ).padStart(2, "0")}`,
                    showtime: new Date(
                      targetDate.getFullYear(),
                      targetDate.getMonth(),
                      targetDate.getDate(),
                      hours,
                      minutes
                    ),
                    source: "KOFA",
                  });
                }
              }
            });
          });
        }
      });

      // 시간순 정렬
      schedules.sort((a, b) => a.showtime.getTime() - b.showtime.getTime());

      console.log(
        `한국영상자료원 시네마테크KOFA: ${schedules.length}개 상영 스케줄 발견`
      );

      // 캐시에 저장
      cacheService.set("kofa", dateStr, schedules);

      return schedules;
    } catch (error) {
      console.error("시네마테크KOFA 조회 실패:", error.message);
      return [];
    }
  }

  async crawlArtCinemas() {
    try {
      // 오늘 날짜 YYYYMMDD 형식으로 변환
      const today = new Date();
      const showDt =
        today.getFullYear() +
        String(today.getMonth() + 1).padStart(2, "0") +
        String(today.getDate()).padStart(2, "0");

      // 박스오피스 1~5위 영화 목록 조회
      console.log("박스오피스 1~5위 영화 조회 중...");
      const top5Movies = await this.getBoxOfficeTop5();

      console.log("\n예술영화관 상영시간표 조회 중...");
      console.log(`총 ${artCinemas.length}개 예술영화관 조회`);

      // 병렬 배치 처리로 극장 스케줄 조회
      const allMovies = [];
      const BATCH_SIZE = isVercel ? 8 : 4;

      const processBatch = async (batch) => {
        const promises = batch.map(async (theater) => {
          try {
            console.log(`${theater.cdNm} (${theater.area}) 조회 중...`);
            const schedule = await this.getSchedule(theater.cd, showDt);

            const movies = [];
            if (schedule.schedule) {
              for (const item of schedule.schedule) {
                const cleanTitle = item.movieNm
                  .replace(/\s*\([^)]*\)/g, "")
                  .trim();

                // 박스오피스 1~5위 영화는 제외
                if (top5Movies.includes(cleanTitle)) {
                  console.log(
                    `🚫 [제외됨] 박스오피스 상위 영화: ${cleanTitle}`
                  );
                  continue;
                }

                const showtimes = item.showTm.split(",");
                for (const time of showtimes) {
                  const [hours, minutes] = time
                    .match(/(\d{2})(\d{2})/)
                    .slice(1)
                    .map(Number);

                  movies.push({
                    title: cleanTitle,
                    theater: theater.cdNm,
                    area: theater.area,
                    screen: item.scrnNm,
                    movieCode: item.movieCd,
                    time: `${String(hours).padStart(2, "0")}:${String(
                      minutes
                    ).padStart(2, "0")}`,
                    showtime: new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                      hours,
                      minutes
                    ),
                  });
                }
              }
            }
            return movies;
          } catch (error) {
            console.error(`${theater.cdNm} 조회 실패:`, error.message);
            return [];
          }
        });

        const results = await Promise.all(promises);
        return results.flat();
      };

      // 배치 단위로 처리
      console.log(`${BATCH_SIZE}개씩 배치로 병렬 처리합니다...`);
      for (let i = 0; i < artCinemas.length; i += BATCH_SIZE) {
        const batch = artCinemas.slice(i, i + BATCH_SIZE);
        const batchMovies = await processBatch(batch);
        allMovies.push(...batchMovies);

        if (i + BATCH_SIZE < artCinemas.length) {
          await delay(isVercel ? 100 : 500);
        }
      }

      // 시간순 정렬
      allMovies.sort((a, b) => a.showtime.getTime() - b.showtime.getTime());

      // 결과 출력
      console.log("\n=== 예술영화관 상영시간표 (박스오피스 1~5위 제외) ===");

      allMovies.forEach((movie) => {
        const timeStr = movie.showtime.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        console.log(
          `${timeStr} | ${movie.title.padEnd(30)} | ${movie.theater} (${
            movie.area
          })`
        );
      });

      console.log(
        `\n박스오피스 상위 5위 제외 후 총 ${allMovies.length}개 상영 스케줄`
      );
      return allMovies;
    } catch (error) {
      console.error("크롤링 실패:", error);
      throw error;
    }
  }

  async crawlArtCinemasWithKMDB() {
    return this.crawlArtCinemasWithKMDBByDate(new Date());
  }

  async crawlArtCinemasWithKMDBByDate(targetDate) {
    try {
      const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD 형식

      // 통합 캐시 확인
      const cachedData = cacheService.get("integrated", dateStr);
      if (cachedData) {
        console.log("통합 예술영화 데이터: 캐시된 데이터 사용");
        return cachedData;
      }

      console.log("=== 예술영화관 + 한국영상자료원 통합 조회 ===\n");

      // 박스오피스 1~5위 영화 목록 조회
      console.log("박스오피스 1~5위 영화 조회 중...");
      const top5Movies = await this.getBoxOfficeTop5();

      // 예술영화관 스케줄 조회
      const artCinemaMovies = await this.getArtCinemaSchedulesByDate(
        top5Movies,
        targetDate
      );

      // 한국영상자료원 시네마테크KOFA 스케줄 조회
      const kofaMovies = await this.getKOFAScheduleByDate(targetDate);

      // 통합 및 정렬
      const allMovies = [...artCinemaMovies, ...kofaMovies];
      allMovies.sort((a, b) => a.showtime.getTime() - b.showtime.getTime());

      // 결과 출력
      console.log("\n=== 통합 예술영화 상영시간표 ===");

      allMovies.forEach((movie) => {
        const timeStr = movie.showtime.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        console.log(
          `${timeStr} | ${movie.title.padEnd(30)} | ${movie.theater} (${
            movie.area
          })`
        );
      });

      console.log(
        `\n총 ${allMovies.length}개 상영 스케줄 (예술영화관: ${artCinemaMovies.length}, 한국영상자료원: ${kofaMovies.length})`
      );

      // 통합 결과를 캐시에 저장
      cacheService.set("integrated", dateStr, allMovies);

      return allMovies;
    } catch (error) {
      console.error("통합 크롤링 실패:", error);
      throw error;
    }
  }

  async getArtCinemaSchedules(top5Movies) {
    return this.getArtCinemaSchedulesByDate(top5Movies, new Date());
  }

  async getArtCinemaSchedulesByDate(top5Movies, targetDate) {
    const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD 형식
    const cacheParams = { excludeMovies: top5Movies }; // 제외할 영화 목록을 캐시 키에 포함

    // 캐시에서 먼저 확인
    const cachedData = cacheService.get("art_cinemas", dateStr, cacheParams);
    if (cachedData) {
      console.log("예술영화관: 캐시된 데이터 사용");
      return cachedData;
    }

    // 지정된 날짜 YYYYMMDD 형식으로 변환
    const showDt =
      targetDate.getFullYear() +
      String(targetDate.getMonth() + 1).padStart(2, "0") +
      String(targetDate.getDate()).padStart(2, "0");

    console.log("\n예술영화관 상영시간표 조회 중...");
    console.log(`총 ${artCinemas.length}개 예술영화관 조회`);

    // 병렬 배치 처리로 극장 스케줄 조회
    const allMovies = [];
    const BATCH_SIZE = isVercel ? 8 : 4; // Vercel에서 더 많은 병렬 처리

    const processBatch = async (batch) => {
      const promises = batch.map(async (theater) => {
        try {
          console.log(`${theater.cdNm} (${theater.area}) 조회 중...`);
          const schedule = await this.getSchedule(theater.cd, showDt);

          const movies = [];
          if (schedule.schedule) {
            for (const item of schedule.schedule) {
              const cleanTitle = item.movieNm
                .replace(/\s*\([^)]*\)/g, "")
                .trim();

              // 박스오피스 1~5위 영화는 제외
              if (top5Movies.includes(cleanTitle)) {
                console.log(`🚫 [제외됨] 박스오피스 상위 영화: ${cleanTitle}`);
                continue;
              }
              
              // 디버깅: 모든 영화 제목 로깅 (Vercel에서만)
              if (process.env.VERCEL === "1") {
                console.log(`✅ [포함됨] ${cleanTitle} (박스오피스 제외 목록: ${top5Movies.join(', ')})`);
              }


              const showtimes = item.showTm.split(",");
              for (const time of showtimes) {
                const [hours, minutes] = time
                  .match(/(\d{2})(\d{2})/)
                  .slice(1)
                  .map(Number);

                movies.push({
                  title: cleanTitle,
                  theater: theater.cdNm,
                  area: theater.area,
                  screen: item.scrnNm,
                  movieCode: item.movieCd,
                  time: `${String(hours).padStart(2, "0")}:${String(
                    minutes
                  ).padStart(2, "0")}`,
                  showtime: new Date(
                    targetDate.getFullYear(),
                    targetDate.getMonth(),
                    targetDate.getDate(),
                    hours,
                    minutes
                  ),
                });
              }
            }
          }
          return movies;
        } catch (error) {
          console.error(`${theater.cdNm} 조회 실패:`, error.message);
          return []; // 실패시 빈 배열 반환
        }
      });

      const results = await Promise.all(promises);
      return results.flat();
    };

    // 배치 단위로 처리
    console.log(`${BATCH_SIZE}개씩 배치로 병렬 처리합니다...`);
    for (let i = 0; i < artCinemas.length; i += BATCH_SIZE) {
      const batch = artCinemas.slice(i, i + BATCH_SIZE);
      console.log(
        `배치 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          artCinemas.length / BATCH_SIZE
        )}: ${batch.length}개 극장`
      );

      const batchMovies = await processBatch(batch);
      allMovies.push(...batchMovies);

      // Vercel에서는 배치 간 딜레이 최소화
      if (i + BATCH_SIZE < artCinemas.length) {
        await delay(isVercel ? 100 : 500);
      }
    }

    // 캐시에 저장
    cacheService.set("art_cinemas", dateStr, allMovies, cacheParams);

    return allMovies;
  }

  async crawlKOBIS() {
    try {
      // 오늘 날짜 YYYYMMDD 형식으로 변환
      const today = new Date();
      const showDt =
        today.getFullYear() +
        String(today.getMonth() + 1).padStart(2, "0") +
        String(today.getDate()).padStart(2, "0");

      // 박스오피스 1~5위 영화 목록 조회
      console.log("박스오피스 1~5위 영화 조회 중...");
      const top5Movies = await this.getBoxOfficeTop5();

      // 마포구 전체 극장 목록 조회
      console.log("\n마포구 극장 목록 조회 중...");
      const theaters = await this.getTheaterList();
      console.log("발견된 극장:", theaters);

      // 각 극장별 상영 스케줄 조회
      const allMovies = [];
      for (const theater of theaters.theaCdList || []) {
        console.log(`\n${theater.cdNm} 상영 스케줄 조회 중...`);

        try {
          const schedule = await this.getSchedule(theater.cd, showDt);

          if (schedule.schedule) {
            schedule.schedule.forEach((item) => {
              const cleanTitle = item.movieNm
                .replace(/\s*\([^)]*\)/g, "")
                .trim(); // 괄호 안 내용 제거

              // 박스오피스 1~5위 영화는 제외
              if (top5Movies.includes(cleanTitle)) {
                console.log(`🚫 [제외됨] 박스오피스 상위 영화: ${cleanTitle}`);
                return; // 건너뛰기
              }

              const showtimes = item.showTm.split(",");
              showtimes.forEach((time) => {
                const [hours, minutes] = time
                  .match(/(\d{2})(\d{2})/)
                  .slice(1)
                  .map(Number);

                allMovies.push({
                  title: cleanTitle,
                  theater: theater.cdNm,
                  screen: item.scrnNm,
                  movieCode: item.movieCd,
                  time: `${String(hours).padStart(2, "0")}:${String(
                    minutes
                  ).padStart(2, "0")}`,
                  showtime: new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                    hours,
                    minutes
                  ),
                });
              });
            });
          }

          // 각 극장 요청 후 딜레이 (서버 부하 방지)
          await delay(isVercel ? 300 : 800);
        } catch (error) {
          console.error(`${theater.cdNm} 스케줄 조회 실패:`, error.message);
          // 개별 극장 실패시에도 계속 진행
          continue;
        }
      }

      // 시간순 정렬
      allMovies.sort((a, b) => a.showtime.getTime() - b.showtime.getTime());

      // 결과 출력
      console.log("\n=== 마포구 영화 상영시간표 (박스오피스 1~5위 제외) ===");

      allMovies.forEach((movie) => {
        const timeStr = movie.showtime.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        console.log(
          `${timeStr} | ${movie.title.padEnd(30)} | ${movie.theater}`
        );
      });

      console.log(
        `\n박스오피스 상위 5위 제외 후 총 ${allMovies.length}개 상영 스케줄`
      );
      return allMovies;
    } catch (error) {
      console.error("크롤링 실패:", error);
      throw error;
    }
  }
}
