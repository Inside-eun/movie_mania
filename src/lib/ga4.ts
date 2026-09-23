import { BetaAnalyticsDataClient } from "@google-analytics/data";

const ALLOWED_DAYS = [7, 30, 90] as const;

export type AllowedDays = (typeof ALLOWED_DAYS)[number];
export type DateRange = { startDate: string; endDate: string };

export class Ga4ConfigError extends Error {}

/** GA4 인증 클라이언트와 속성 ID. 환경변수가 없으면 Ga4ConfigError를 던진다. */
export function getGa4Client(): { client: BetaAnalyticsDataClient; property: string } {
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const propertyId = process.env.GA4_PROPERTY_ID;

  const missing = [
    !clientEmail && "GA4_CLIENT_EMAIL",
    !privateKey && "GA4_PRIVATE_KEY",
    !propertyId && "GA4_PROPERTY_ID",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Ga4ConfigError(
      `환경변수가 설정되지 않았습니다: ${missing.join(", ")}. .env.local과 Vercel 환경변수를 확인하세요.`,
    );
  }

  return {
    client: new BetaAnalyticsDataClient({
      credentials: { client_email: clientEmail, private_key: privateKey },
    }),
    property: `properties/${propertyId}`,
  };
}

/** 허용값(7/30/90)이 아니면 fallback을 쓴다. */
export function resolveDays(raw: string | null | undefined, fallback: AllowedDays): AllowedDays {
  const days = Number(raw);
  return ALLOWED_DAYS.includes(days as AllowedDays) ? (days as AllowedDays) : fallback;
}

export function toDateRange(days: AllowedDays): DateRange {
  return { startDate: `${days}daysAgo`, endDate: "today" };
}

/** ?days= 파라미터를 GA4 dateRange로 변환. API 기본값은 7일. */
export function getDateRange(request: Request): DateRange {
  const raw = new URL(request.url).searchParams.get("days");
  return toDateRange(resolveDays(raw, 7));
}

/** GA4 메트릭 문자열을 숫자로. 값이 없으면 0. */
export function toNumber(value: string | null | undefined): number {
  return Number(value ?? 0);
}

/** 설정 오류는 500 + 안내 메시지, 그 외 조회 실패는 502로 구분해 응답한다. */
export function ga4ErrorResponse(error: unknown): Response {
  const isConfig = error instanceof Ga4ConfigError;
  return Response.json(
    { error: error instanceof Error ? error.message : String(error) },
    { status: isConfig ? 500 : 502 },
  );
}
