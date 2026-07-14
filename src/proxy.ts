import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_ACCESS_COOKIE = "agentspace_access";
const DASHBOARD_SESSION_COOKIE = "agentspace_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get(DASHBOARD_ACCESS_COOKIE)?.value ||
    request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value;
  const isLoggedIn = Boolean(sessionToken);

  if ((pathname === "/" || pathname === "/login" || pathname === "/register") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/login" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/dashboard" && !isLoggedIn) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard"],
};
