import { NextResponse } from "next/server";
import { requireBearerToken } from "@/lib/analyticsAuth";
import { toDateRange } from "@/lib/ga4";
import { getOverview } from "@/lib/ga4Reports";

export const dynamic = "force-dynamic";

/** GA4 서비스 계정 연결 확인용. 최근 7일 활성 사용자 수를 조회한다. */
export async function GET(request: Request) {
  const unauthorized = requireBearerToken(request);
  if (unauthorized) return unauthorized;

  try {
    const { activeUsers } = await getOverview(toDateRange(7));
    return NextResponse.json({ ok: true, activeUsers: String(activeUsers) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
