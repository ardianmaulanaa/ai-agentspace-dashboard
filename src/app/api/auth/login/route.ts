import { NextResponse } from "next/server";
import {
  getDashboardJwtSecret,
  getDashboardPasswordHash,
  getDashboardUser,
  setDashboardSessionCookies,
  verifyDashboardPassword,
} from "@/lib/auth";
import { createAuthSupabaseClient } from "@/lib/supabase";
import { readJsonObject, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 8;

function getClientKey(request: Request, username: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return `${forwardedFor || realIp || "local"}:${username || "unknown"}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  attempt.count += 1;
  return attempt.count > LOGIN_MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : username;
  const password = typeof body?.password === "string" ? body.password : "";
  const user = getDashboardUser();
  const jwtSecret = getDashboardJwtSecret();
  const clientKey = getClientKey(request, email);
  const supabase = createAuthSupabaseClient();

  if (!supabase && !getDashboardPasswordHash() && !process.env.DASHBOARD_PASSWORD?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Supabase auth env is not configured yet." },
      { status: 500 },
    );
  }

  if (!jwtSecret) {
    return NextResponse.json(
      { ok: false, error: "Dashboard JWT secret env is not configured yet." },
      { status: 500 },
    );
  }

  if (isRateLimited(clientKey)) {
    return validationError("Too many login attempts. Please wait before retrying.", 429);
  }

  let loginUser = user;
  let passwordValid = false;

  if (supabase && email.includes("@")) {
    const authResult = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (!authResult.error && authResult.data.user) {
      const metadata = authResult.data.user.user_metadata || {};
      const role = metadata.role === "admin" || metadata.role === "owner" || metadata.role === "member"
        ? metadata.role
        : "member";

      loginUser = {
        username: authResult.data.user.email || email.toLowerCase(),
        displayName: typeof metadata.displayName === "string" ? metadata.displayName : authResult.data.user.email || email.toLowerCase(),
        role,
      };
      passwordValid = true;
    }
  }

  if (!passwordValid) {
    passwordValid = username === user.username && verifyDashboardPassword(password);
  }

  if (!passwordValid) {
    return NextResponse.json(
      { ok: false, error: "Email atau password salah." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: loginUser,
  });

  setDashboardSessionCookies(response, loginUser);

  return response;
}
