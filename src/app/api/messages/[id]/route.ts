import { NextResponse } from "next/server";
import { isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { optionalBoolean, optionalPlainObject, optionalString, readJsonObject, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
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
  const body = await readJsonObject(request);

  if (!body) {
    return validationError("Request body must be a JSON object.");
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

  const content = optionalString(body, "content");

  if ("content" in body) {
    if (!content) {
      return validationError("Message content cannot be empty.");
    }

    updates.content = content;
    metadata.edited = true;
  }

  const pinned = optionalBoolean(body, "pinned");

  if (pinned !== undefined) {
    metadata.pinned = pinned;
  }

  const reactions = optionalPlainObject(body, "reactions");

  if (reactions) {
    metadata.reactions = reactions;
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
