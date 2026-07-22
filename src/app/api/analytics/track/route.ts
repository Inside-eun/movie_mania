import { NextResponse } from "next/server";

import { getSummary, recordEvent } from "@/lib/analyticsStore";
import { SimilarAlgorithm } from "@/lib/similarMovies";

const ALGORITHMS: SimilarAlgorithm[] = ["director", "genre", "cast", "year", "random"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const timestamp = Date.now();

    if (body?.type === "list_click" && typeof body.movieTitle === "string") {
      await recordEvent({ type: "list_click", movieTitle: body.movieTitle, timestamp });
      return NextResponse.json({ success: true });
    }

    if (
      body?.type === "recommendation_click" &&
      ALGORITHMS.includes(body.algorithm) &&
      typeof body.sourceTitle === "string" &&
      typeof body.targetTitle === "string"
    ) {
      await recordEvent({
        type: "recommendation_click",
        algorithm: body.algorithm,
        sourceTitle: body.sourceTitle,
        targetTitle: body.targetTitle,
        timestamp,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "잘못된 이벤트 형식입니다." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: await getSummary() });
}
