import { NextResponse } from "next/server";
import { isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  content?: unknown;
  pinned?: unknown;
  reactions?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!isDashboardRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase env is not configured." },
      { status: 500 },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null) as PatchBody | null;

  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Request body is required." },
      { status: 400 },
    );
  }

  const existing = await supabase
    .from("messages")
    .select("metadata")
    .eq("id", id)
    .single();

  if (existing.error) {
    return NextResponse.json(
      { ok: false, error: existing.error.message },
      { status: 404 },
    );
  }

  const metadata = {
    ...((existing.data.metadata as Record<string, unknown> | null) || {}),
  };
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.content === "string") {
    const content = body.content.trim();

    if (!content) {
      return NextResponse.json(
        { ok: false, error: "Message content cannot be empty." },
        { status: 400 },
      );
    }

    updates.content = content;
    metadata.edited = true;
  }

  if (typeof body.pinned === "boolean") {
    metadata.pinned = body.pinned;
  }

  if (body.reactions && typeof body.reactions === "object" && !Array.isArray(body.reactions)) {
    metadata.reactions = body.reactions;
  }

  updates.metadata = metadata;

  const result = await supabase
    .from("messages")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: result.data.id,
    persisted: "supabase",
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isDashboardRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase env is not configured." },
      { status: 500 },
    );
  }

  const { id } = await context.params;
  const result = await supabase
    .from("messages")
    .delete()
    .eq("id", id);

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id,
    deleted: true,
  });
}
