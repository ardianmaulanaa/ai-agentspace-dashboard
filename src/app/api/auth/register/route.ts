import { NextResponse } from "next/server";
import {
  getDashboardAccessToken,
  getDashboardRefreshToken,
  setDashboardSessionCookies,
} from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { optionalString, readJsonObject, requiredString, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongEnoughPassword(password: string) {
  return password.length >= 8;
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);

  if (!body) {
    return validationError("Request body must be a JSON object.");
  }

  const emailResult = requiredString(body, "email", "Email");
  const displayName = optionalString(body, "displayName") || emailResult.value.split("@")[0];
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (emailResult.error) {
    return validationError(emailResult.error);
  }

  if (!isValidEmail(emailResult.value)) {
    return validationError("Email is invalid.");
  }

  if (!isStrongEnoughPassword(password)) {
    return validationError("Password must be at least 8 characters.");
  }

  if (password !== confirmPassword) {
    return validationError("Password confirmation does not match.");
  }

  const accessToken = getDashboardAccessToken();
  const refreshToken = getDashboardRefreshToken();

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { ok: false, error: "Dashboard access/refresh token env is not configured yet." },
      { status: 500 },
    );
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase env is not configured." },
      { status: 500 },
    );
  }

  const result = await supabase.auth.admin.createUser({
    email: emailResult.value.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      displayName,
      role: "member",
    },
  });

  if (result.error || !result.data.user) {
    const message = result.error?.message || "Register failed.";
    const status = message.toLowerCase().includes("already") || message.toLowerCase().includes("registered") ? 409 : 400;

    return validationError(message, status);
  }

  const user = {
    username: result.data.user.email || emailResult.value.toLowerCase(),
    displayName: typeof result.data.user.user_metadata?.displayName === "string" ? result.data.user.user_metadata.displayName : displayName,
    role: "member" as const,
  };

  const response = NextResponse.json(
    {
      ok: true,
      user,
    },
    { status: 201 },
  );

  setDashboardSessionCookies(response, user);

  return response;
}
