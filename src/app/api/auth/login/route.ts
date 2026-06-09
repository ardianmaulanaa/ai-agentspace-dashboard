import { NextResponse } from "next/server";
import {
  DASHBOARD_SESSION_COOKIE,
  getDashboardPassword,
  getDashboardSessionToken,
  getDashboardUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const user = getDashboardUser();
  const configuredPassword = getDashboardPassword();
  const sessionToken = getDashboardSessionToken();

  if (!configuredPassword || !sessionToken) {
    return NextResponse.json(
      { ok: false, error: "Dashboard auth env is not configured yet." },
      { status: 500 },
    );
  }

  if (username !== user.username || password !== configuredPassword) {
    return NextResponse.json(
      { ok: false, error: "Username atau password salah." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    user,
  });

  response.cookies.set(DASHBOARD_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
