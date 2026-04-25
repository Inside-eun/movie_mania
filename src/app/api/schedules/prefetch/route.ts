import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 10; // Vercel Hobby 플랜 제한

async function getScheduleService() {
  const { ScheduleService } = await import("@/services/scheduleService");
  return new ScheduleService();
}

async function getCacheService() {
  const { cacheService } = await import("@/services/cacheService");
  return cacheService;
}

function verifyToken(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  return searchParams.get("token") === process.env.PREFETCH_TOKEN;
}

async function handlePrefetch(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const scheduleService = await getScheduleService();
  const cache = await getCacheService();

  console.log("=== [Cron 1] 크롤링 프리페치 시작 ===");
  const startTime = Date.now();

  // 오늘부터 7일치 크롤링만 수행 (TMDB는 Cron 2에서 별도 처리)
  const results = [];
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = targetDate.toISOString().split("T")[0];

    console.log(`\n${dateStr} 크롤링 중...`);

    try {
      // 캐시 강제 갱신: 기존 캐시 삭제 후 재크롤링
      await cache.delete("integrated", dateStr);
      const movies = await (scheduleService as any).crawlArtCinemasWithKMDBByDate(targetDate);

      results.push({ date: dateStr, count: movies.length, success: true });
      console.log(`${dateStr}: ${movies.length}개 스케줄 저장 완료`);
    } catch (error) {
      console.error(`${dateStr} 수집 실패:`, error);
      results.push({
        date: dateStr,
        count: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const elapsedTime = Date.now() - startTime;
  console.log(`\n=== [Cron 1] 크롤링 완료 (${elapsedTime}ms) ===`);

  return NextResponse.json({
    success: true,
    results,
    elapsedTime,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  try {
    return await handlePrefetch(request);
  } catch (error) {
    console.error("프리페치 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "프리페치 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    return await handlePrefetch(request);

  } catch (error) {
    console.error("프리페치 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "프리페치 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
