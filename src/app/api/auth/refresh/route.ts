import { NextResponse } from "next/server";
import {
  DASHBOARD_ACCESS_COOKIE,
  DASHBOARD_REFRESH_COOKIE,
  getDashboardAccessToken,
  getCookieValue,
  isDashboardRefreshToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const refreshToken = getCookieValue(request.headers.get("cookie"), DASHBOARD_REFRESH_COOKIE);

  if (!isDashboardRefreshToken(refreshToken)) {
    return NextResponse.json(
      { ok: false, error: "Refresh token is invalid or expired." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(DASHBOARD_ACCESS_COOKIE, getDashboardAccessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });

  return response;
}
