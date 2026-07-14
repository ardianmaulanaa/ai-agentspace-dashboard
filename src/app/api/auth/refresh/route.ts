import { NextResponse } from "next/server";
import {
  DASHBOARD_REFRESH_COOKIE,
  getCookieValue,
  setDashboardSessionCookies,
  verifyDashboardJwt,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const refreshToken = getCookieValue(request.headers.get("cookie"), DASHBOARD_REFRESH_COOKIE);
  const user = verifyDashboardJwt(refreshToken, "refresh");

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Refresh token is invalid or expired." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, user });

  setDashboardSessionCookies(response, user);

  return response;
}
