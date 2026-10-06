import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "access_token";

/**
 * Optimistic auth check: bounce visitors without a session cookie away from the
 * dashboard before any page renders. The API still validates the token on
 * every request, so this is a UX shortcut, not the security boundary.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
