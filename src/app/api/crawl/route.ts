import { NextResponse } from "next/server";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// TypeScript 타입 정의
interface MovieSchedule {
  title: string;
  theater: string;
  area: string;
  screen: string;
  time: string;
  showtime: Date;
  director?: string;
  source?: string;
  movieCode?: string;
  posterUrl?: string;
  prodYear?: string;
  runtime?: string;
  cActors?: string;
  cCodeSubName2?: string;
}

// JavaScript 모듈을 동적으로 import
async function getCrawlerService() {
  const { CrawlerService } = await import("@/services/crawler.js");
  return new CrawlerService();
}

// 캐시 서비스 import
async function getCacheService() {
  const { cacheService } = await import("@/services/cacheService");
  return cacheService;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "integrated"; // 'integrated', 'kofa', 'art'
    const dateParam = searchParams.get("date"); // YYYY-MM-DD 형식
    const forceFresh = searchParams.get("force") === "true"; // 강제 새로고침

    const crawler = await getCrawlerService();
    const cache = await getCacheService();
    let movies: MovieSchedule[] = [];
    let fromCache = false;

    // 날짜 파라미터가 있으면 해당 날짜로, 없으면 오늘 날짜로
    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam);
      // 유효하지 않은 날짜인 경우 오늘 날짜로 대체
      if (isNaN(targetDate.getTime())) {
        targetDate = new Date();
      }
    }

    const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD 형식

    // 강제 새로고침이 아닌 경우 캐시 먼저 확인
    if (!forceFresh) {
      const cachedData = cache.get(type, dateStr) as MovieSchedule[] | null;
      if (cachedData) {
        console.log(`캐시에서 ${type} 데이터 반환`);
        // 캐시된 데이터의 showtime을 Date 객체로 복원
        movies = cachedData.map((movie) => ({
          ...movie,
          showtime:
            typeof movie.showtime === "string"
              ? new Date(movie.showtime)
              : movie.showtime,
        }));
        fromCache = true;
      }
    }

    // 캐시에서 데이터를 찾지 못한 경우에만 크롤링 실행
    if (!fromCache) {
      // 통합 크롤링 (예술영화관 + KMDB) - 선택된 날짜로 실행
      movies = await (crawler as any).crawlArtCinemasWithKMDBByDate(targetDate);
    }

    
    // 전체 영화 목록을 시간순으로 정렬
    movies.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return timeA.localeCompare(timeB);
    });

    // 시간 정보를 문자열로 변환 (JSON 직렬화를 위해)
    const serializedMovies = movies.map((movie: MovieSchedule) => ({
      ...movie,
      showtime:
        movie.showtime instanceof Date
          ? movie.showtime.toISOString()
          : typeof movie.showtime === "string"
          ? movie.showtime
          : new Date(movie.showtime).toISOString(),
    }));

    // 캐시 통계 정보 가져오기
    const cacheStats = cache.getStats();

    return NextResponse.json({
      success: true,
      count: serializedMovies.length,
      data: serializedMovies,
      cache: {
        fromCache,
        stats: cacheStats,
        date: dateStr,
        type,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("크롤링 API 에러:", error);

    // Vercel 환경에서 더 상세한 에러 로깅
    if (process.env.VERCEL === "1") {
      console.error("Vercel 환경 정보:", {
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
        nodeEnv: process.env.NODE_ENV,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "크롤링 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
        stack:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.stack
            : undefined,
        environment: process.env.VERCEL === "1" ? "vercel" : "local",
      },
      { status: 500 }
    );
  }
}
