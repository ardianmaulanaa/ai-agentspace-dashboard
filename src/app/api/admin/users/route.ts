import { NextResponse } from "next/server";
import type { DashboardRole } from "@/lib/auth";
import { getDashboardRequestUser, requireDashboardRoles } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isUuid } from "@/lib/supabase-records";
import { readJsonObject, requiredString, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLES = ["owner", "admin", "member"] as const;

function normalizeRole(role: string): DashboardRole | null {
  const normalized = role.trim().toLowerCase();

  return ROLES.includes(normalized as DashboardRole) ? (normalized as DashboardRole) : null;
}

function serializeUser(user: {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata || {};
  const role = normalizeRole(typeof metadata.role === "string" ? metadata.role : "") || "member";
  const displayName = typeof metadata.displayName === "string" && metadata.displayName.trim()
    ? metadata.displayName.trim()
    : user.email || "Unnamed user";

  return {
    id: user.id,
    email: user.email || "",
    displayName,
    role,
    createdAt: user.created_at || null,
    lastSignInAt: user.last_sign_in_at || null,
  };
}

export async function GET(request: Request) {
  const authError = requireDashboardRoles(request, ["owner", "admin"]);
  if (authError) return authError;

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase env is not configured." },
      { status: 500 },
    );
  }

  const result = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    users: result.data.users.map(serializeUser),
  });
}

export async function PATCH(request: Request) {
  const authError = requireDashboardRoles(request, ["owner", "admin"]);
  if (authError) return authError;

  const currentUser = getDashboardRequestUser(request);
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase env is not configured." },
      { status: 500 },
    );
  }

  const body = await readJsonObject(request);

  if (!body) {
    return validationError("Request body must be a JSON object.");
  }

  const userIdResult = requiredString(body, "userId", "User ID");
  const roleResult = requiredString(body, "role", "Role");

  if (userIdResult.error) {
    return validationError(userIdResult.error);
  }

  if (!isUuid(userIdResult.value)) {
    return validationError("User ID must be a valid UUID.");
  }

  if (roleResult.error) {
    return validationError(roleResult.error);
  }

  const role = normalizeRole(roleResult.value);

  if (!role) {
    return validationError("Role must be admin, owner, or member.");
  }

  const targetResult = await supabase.auth.admin.getUserById(userIdResult.value);

  if (targetResult.error || !targetResult.data.user) {
    return NextResponse.json(
      { ok: false, error: targetResult.error?.message || "User not found." },
      { status: 404 },
    );
  }

  const target = targetResult.data.user;
  const targetEmail = target.email || "";
  const targetRole = normalizeRole(
    typeof target.user_metadata?.role === "string" ? target.user_metadata.role : "",
  ) || "member";
  const currentRole = currentUser?.role || "member";

  if (currentRole !== "owner" && (targetRole === "owner" || role === "owner")) {
    return NextResponse.json(
      { ok: false, error: "Forbidden. Only owner can grant or modify owner role." },
      { status: 403 },
    );
  }

  if (currentUser?.username.toLowerCase() === targetEmail.toLowerCase() && role !== currentRole) {
    return validationError("You cannot downgrade your own active role while signed in.", 409);
  }

  const existingMetadata = target.user_metadata || {};
  const updateResult = await supabase.auth.admin.updateUserById(target.id, {
    user_metadata: {
      ...existingMetadata,
      role,
    },
  });

  if (updateResult.error || !updateResult.data.user) {
    return NextResponse.json(
      { ok: false, error: updateResult.error?.message || "Failed to update user role." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: serializeUser(updateResult.data.user),
  });
}
