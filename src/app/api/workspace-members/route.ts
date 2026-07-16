import { NextResponse } from "next/server";
import type { DashboardRole } from "@/lib/auth";
import { requireDashboardRoles } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isUuid, resolveWorkspaceId } from "@/lib/supabase-records";
import { optionalString, readJsonObject, requiredString, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLES = ["admin", "owner", "member"] as const;

function normalizeRole(role: string): DashboardRole | null {
  const normalized = role.trim().toLowerCase();

  return ROLES.includes(normalized as DashboardRole) ? (normalized as DashboardRole) : null;
}

function serializeMember(member: {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}) {
  return {
    id: member.id,
    workspaceId: member.workspace_id,
    userId: member.user_id,
    role: normalizeRole(member.role) || "member",
    createdAt: member.created_at || null,
    updatedAt: member.updated_at || null,
  };
}

export async function GET(request: Request) {
  const authError = requireDashboardRoles(request, ["admin", "owner"]);
  if (authError) return authError;

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase env is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const workspaceInput = url.searchParams.get("workspaceId")?.trim() || "";
  const workspaceResult = await resolveWorkspaceId(supabase, workspaceInput);

  if (workspaceResult.error || !workspaceResult.id) {
    return NextResponse.json(
      { ok: false, error: workspaceResult.error?.message || "Workspace not found." },
      { status: 404 },
    );
  }

  const result = await supabase
    .from("workspace_members")
    .select("id,workspace_id,user_id,role,created_at,updated_at")
    .eq("workspace_id", workspaceResult.id)
    .order("created_at", { ascending: true });

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    workspaceId: workspaceResult.id,
    members: (result.data || []).map(serializeMember),
  });
}

export async function POST(request: Request) {
  const authError = requireDashboardRoles(request, ["admin", "owner"]);
  if (authError) return authError;

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
  const role = normalizeRole(optionalString(body, "role") || "member");
  const workspaceInput = optionalString(body, "workspaceId");

  if (userIdResult.error) {
    return validationError(userIdResult.error);
  }

  if (!isUuid(userIdResult.value)) {
    return validationError("User ID must be a valid UUID.");
  }

  if (!role) {
    return validationError("Role must be admin, owner, or member.");
  }

  const workspaceResult = await resolveWorkspaceId(supabase, workspaceInput);

  if (workspaceResult.error || !workspaceResult.id) {
    return NextResponse.json(
      { ok: false, error: workspaceResult.error?.message || "Workspace not found." },
      { status: 404 },
    );
  }

  const userResult = await supabase.auth.admin.getUserById(userIdResult.value);

  if (userResult.error || !userResult.data.user) {
    return NextResponse.json(
      { ok: false, error: userResult.error?.message || "User not found." },
      { status: 404 },
    );
  }

  const result = await supabase
    .from("workspace_members")
    .upsert(
      {
        workspace_id: workspaceResult.id,
        user_id: userIdResult.value,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id" },
    )
    .select("id,workspace_id,user_id,role,created_at,updated_at")
    .single();

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      member: serializeMember(result.data),
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const authError = requireDashboardRoles(request, ["admin", "owner"]);
  if (authError) return authError;

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
  const workspaceInput = optionalString(body, "workspaceId");

  if (userIdResult.error) {
    return validationError(userIdResult.error);
  }

  if (!isUuid(userIdResult.value)) {
    return validationError("User ID must be a valid UUID.");
  }

  const workspaceResult = await resolveWorkspaceId(supabase, workspaceInput);

  if (workspaceResult.error || !workspaceResult.id) {
    return NextResponse.json(
      { ok: false, error: workspaceResult.error?.message || "Workspace not found." },
      { status: 404 },
    );
  }

  const result = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceResult.id)
    .eq("user_id", userIdResult.value);

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: {
      workspaceId: workspaceResult.id,
      userId: userIdResult.value,
    },
  });
}
