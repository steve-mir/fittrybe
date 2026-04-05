// middleware.ts — Protect all /admin/* routes
// Uses a session cookie set at login to gate access server-side.
// Supabase Auth is client-side only, so we use a lightweight cookie check
// and rely on client-side auth guards for full token verification.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "fittrybe_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (but NOT /admin/login or /admin/signup)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/signup")) {
    const session = request.cookies.get(ADMIN_SESSION_COOKIE);

    if (!session?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
