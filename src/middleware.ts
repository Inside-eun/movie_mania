import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/analyticsAuth";

const LOGIN_PATH = "/analytics/login";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === LOGIN_PATH) return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSession(session, process.env.ANALYTICS_SESSION_SECRET)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
}

export const config = {
  matcher: ["/analytics", "/analytics/:path*"],
};
