import { NextResponse } from "next/server";
import { requireBearerToken } from "@/lib/analyticsAuth";
import { ga4ErrorResponse, getDateRange } from "@/lib/ga4";
import { getTopPages } from "@/lib/ga4Reports";

export const dynamic = "force-dynamic";

/** 페이지 경로별 조회수 상위 목록. */
export async function GET(request: Request) {
  const unauthorized = requireBearerToken(request);
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json(await getTopPages(getDateRange(request)));
  } catch (error) {
    return ga4ErrorResponse(error);
  }
}
