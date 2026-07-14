import { NextResponse } from "next/server";
import {
  DASHBOARD_ACCESS_COOKIE,
  DASHBOARD_DISPLAY_COOKIE,
  DASHBOARD_REFRESH_COOKIE,
  DASHBOARD_ROLE_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  DASHBOARD_USER_COOKIE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  for (const cookieName of [
    DASHBOARD_ACCESS_COOKIE,
    DASHBOARD_REFRESH_COOKIE,
    DASHBOARD_SESSION_COOKIE,
    DASHBOARD_USER_COOKIE,
    DASHBOARD_DISPLAY_COOKIE,
    DASHBOARD_ROLE_COOKIE,
  ]) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
