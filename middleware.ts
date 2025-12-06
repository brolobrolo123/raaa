import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_CANDIDATES, OVERSIZED_COOKIE_THRESHOLD, SESSION_COOKIE_NAME, isSecureCookie } from "@/lib/auth-cookies";

const SESSION_EXPIRED_PATH = "/sesion-expirada";

function clearAuthCookies(response: NextResponse) {
  AUTH_COOKIE_CANDIDATES.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      ...(isSecureCookie(name) ? { secure: true } : {}),
    });
  });
}

export function middleware(request: NextRequest) {
  const legacyActive = AUTH_COOKIE_CANDIDATES.some((name) => name.endsWith(".v2") ? false : Boolean(request.cookies.get(name)));
  const activeSession = request.cookies.get(SESSION_COOKIE_NAME);
  const oversizedSession = Boolean(activeSession && activeSession.value.length > OVERSIZED_COOKIE_THRESHOLD);
  const needsLogout = legacyActive || oversizedSession;

  if (!needsLogout) {
    return NextResponse.next();
  }

  const isExpiredPage = request.nextUrl.pathname === SESSION_EXPIRED_PATH;
  const response = isExpiredPage
    ? NextResponse.next()
    : NextResponse.redirect(new URL(SESSION_EXPIRED_PATH, request.url));
  clearAuthCookies(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
