import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro: 최대 5분

async function getScheduleService() {
  const { ScheduleService } = await import("@/services/scheduleService");
  return new ScheduleService();
}

async function getCacheService() {
  const { cacheService } = await import("@/services/cacheService");
  return cacheService;
}

async function handlePrefetch(request: Request) {
  const { searchParams } = new URL(request.url);
  const authToken = searchParams.get("token");
  
  // 간단한 인증 (환경변수로 토큰 설정)
  if (authToken !== process.env.PREFETCH_TOKEN) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const scheduleService = await getScheduleService();
  const cache = await getCacheService();

  console.log("=== 스케줄 프리페치 시작 ===");
  const startTime = Date.now();

  // 오늘부터 7일치 데이터 미리 수집
  const results = [];
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = targetDate.toISOString().split("T")[0];

    console.log(`\n${dateStr} 데이터 수집 중...`);
    
    try {
      const movies = await (scheduleService as any).crawlArtCinemasWithKMDBByDate(targetDate);
      
      results.push({
        date: dateStr,
        count: movies.length,
        success: true,
      });

      console.log(`${dateStr}: ${movies.length}개 스케줄 수집 완료`);
    } catch (error) {
      console.error(`${dateStr} 수집 실패:`, error);
      results.push({
        date: dateStr,
        count: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // 날짜 간 딜레이
    if (i < 6) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const elapsedTime = Date.now() - startTime;
  const cacheStats = cache.getStats();

  console.log(`\n=== 프리페치 완료 (${elapsedTime}ms) ===`);

  return NextResponse.json({
    success: true,
    results,
    elapsedTime,
    cacheStats,
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
