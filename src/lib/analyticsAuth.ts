export const SESSION_COOKIE = "analytics_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** 길이가 같을 때 내용 비교 시간이 값에 따라 달라지지 않게 한다. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Edge 런타임에서도 동작하도록 Web Crypto만 사용한다. */
async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(signature);
}

/** 만료시각과 그 서명을 합친 쿠키 값. 비밀번호 자체는 담지 않는다. */
export async function createSessionValue(secret: string): Promise<string> {
  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${await sign(expiresAt, secret)}`;
}

export async function isValidSession(
  value: string | undefined,
  secret: string | undefined,
): Promise<boolean> {
  if (!value || !secret) return false;

  const separator = value.lastIndexOf(".");
  if (separator === -1) return false;

  const expiresAt = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  return timingSafeEqual(signature, await sign(expiresAt, secret));
}

export function isValidPassword(input: unknown, expected: string | undefined): boolean {
  if (!expected || typeof input !== "string") return false;
  return timingSafeEqual(input, expected);
}

/**
 * Authorization: Bearer <ANALYTICS_TOKEN> 검증.
 * 통과 시 null, 실패 시 응답을 반환한다. 토큰 미설정이면 열어두지 않고 500으로 막는다.
 */
export function requireBearerToken(request: Request): Response | null {
  const expected = process.env.ANALYTICS_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "ANALYTICS_TOKEN 환경변수가 설정되지 않아 접근이 차단되었습니다." },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || !timingSafeEqual(token, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
