import { NextResponse } from "next/server";
import { requireBearerToken } from "@/lib/analyticsAuth";
import { ga4ErrorResponse, getDateRange } from "@/lib/ga4";
import { getTopEvents } from "@/lib/ga4Reports";

export const dynamic = "force-dynamic";

/** 이벤트별 발생 횟수 상위 30개. */
export async function GET(request: Request) {
  const unauthorized = requireBearerToken(request);
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json(await getTopEvents(getDateRange(request)));
  } catch (error) {
    return ga4ErrorResponse(error);
  }
}
