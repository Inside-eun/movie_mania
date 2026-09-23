import { NextResponse } from "next/server";
import { requireBearerToken } from "@/lib/analyticsAuth";
import { ga4ErrorResponse, getDateRange } from "@/lib/ga4";
import { getAcquisition } from "@/lib/ga4Reports";

export const dynamic = "force-dynamic";

/** 채널 그룹별 유입 세션 수. */
export async function GET(request: Request) {
  const unauthorized = requireBearerToken(request);
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json(await getAcquisition(getDateRange(request)));
  } catch (error) {
    return ga4ErrorResponse(error);
  }
}
