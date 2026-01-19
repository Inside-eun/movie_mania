import { NextResponse } from "next/server";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// JavaScript 모듈을 동적으로 import
async function getScheduleService() {
  const { ScheduleService } = await import("@/services/scheduleService");
  return new ScheduleService();
}

export async function GET() {
  try {
    const scheduleService = await getScheduleService();

    // 박스오피스 1~5위 데이터 조회
    const boxOfficeTop5 = await scheduleService.getBoxOfficeTop5();

    // 어제 날짜 계산 (박스오피스 기준일)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().split("T")[0];

    return NextResponse.json({
      success: true,
      data: {
        targetDate,
        movies: boxOfficeTop5,
        count: boxOfficeTop5.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("박스오피스 API 에러:", error);

    return NextResponse.json(
      {
        success: false,
        error: "박스오피스 조회 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
