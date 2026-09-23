import { NextResponse } from "next/server";
import { requireBearerToken } from "@/lib/analyticsAuth";
import { ga4ErrorResponse, getDateRange } from "@/lib/ga4";
import { getOverview } from "@/lib/ga4Reports";

export const dynamic = "force-dynamic";

/** 기간별 전체 트래픽 요약 지표. */
export async function GET(request: Request) {
  const unauthorized = requireBearerToken(request);
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json(await getOverview(getDateRange(request)));
  } catch (error) {
    return ga4ErrorResponse(error);
  }
}
