import { timingSafeEqual } from "crypto";

// Vercel Cron은 프로젝트에 CRON_SECRET 환경 변수가 있으면 요청에
// "Authorization: Bearer <CRON_SECRET>" 헤더를 자동으로 붙인다.
// 예전처럼 토큰을 쿼리스트링에 넣으면 vercel.json(공개 저장소)·요청 로그·Referer에
// 그대로 남기 때문에 헤더로만 인증한다. 수동 실행도 같은 헤더를 붙이면 된다
// (scripts/prefetch-production.sh 참고).
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
