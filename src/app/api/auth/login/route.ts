import { NextResponse } from "next/server";
import {
  getDashboardJwtSecret,
  getDashboardPasswordHash,
  getDashboardUser,
  setDashboardSessionCookies,
  verifyDashboardPassword,
} from "@/lib/auth";
import { createAuthSupabaseClient } from "@/lib/supabase";
import { readJsonObject } from "@/lib/validation";

export const dynamic = "force-dynamic";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getLoginWindowMs() {
  const seconds = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS || 60);

  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60_000;
}

function getLoginMaxAttempts() {
  const attempts = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 5);

  return Number.isFinite(attempts) && attempts > 0 ? attempts : 5;
}

function getClientKey(request: Request, username: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return `${forwardedFor || realIp || "local"}:${username.toLowerCase() || "unknown"}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  const maxAttempts = getLoginMaxAttempts();

  if (!attempt || attempt.resetAt <= now) {
    return { limited: false, remaining: maxAttempts, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.ceil((attempt.resetAt - now) / 1000);

  return {
    limited: attempt.count >= maxAttempts,
    remaining: Math.max(0, maxAttempts - attempt.count),
    retryAfterSeconds,
  };
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  const windowMs = getLoginWindowMs();

  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  attempt.count += 1;
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

function createRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      ok: false,
      error: "Terlalu banyak percobaan login. Tunggu sebentar sebelum coba lagi.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(getLoginMaxAttempts()),
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + retryAfterSeconds * 1000) / 1000)),
      },
    },
  );
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

  const rateLimit = isRateLimited(clientKey);

  if (rateLimit.limited) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
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
    recordFailedLogin(clientKey);

    return NextResponse.json(
      { ok: false, error: "Email atau password salah." },
      { status: 401 },
    );
  }

  clearLoginAttempts(clientKey);

  const response = NextResponse.json({
    ok: true,
    user: loginUser,
  });

  setDashboardSessionCookies(response, loginUser);

  return response;
}
