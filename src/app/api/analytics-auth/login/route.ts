import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionValue,
  isValidPassword,
} from "@/lib/analyticsAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.ANALYTICS_SESSION_SECRET;
  if (!process.env.ANALYTICS_PASSWORD || !secret) {
    return NextResponse.json(
      { error: "ANALYTICS_PASSWORD 또는 ANALYTICS_SESSION_SECRET 환경변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!isValidPassword(body?.password, process.env.ANALYTICS_PASSWORD)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionValue(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
