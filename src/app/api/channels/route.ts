import { NextResponse } from "next/server";
import { isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveWorkspaceId, slugify } from "@/lib/supabase-records";

export const dynamic = "force-dynamic";

type ChannelBody = {
  workspaceId?: unknown;
  category?: unknown;
  name?: unknown;
  type?: unknown;
};

const channelTypes = new Set(["text", "forum", "voice"]);

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null) as ChannelBody | null;
  const workspaceInput = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";
  const categoryName = typeof body?.category === "string" ? body.category.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const slug = slugify(name);
  const type = typeof body?.type === "string" && channelTypes.has(body.type) ? body.type : "text";

  if (!name || !slug) {
    return NextResponse.json(
      { ok: false, error: "Channel name is required." },
      { status: 400 },
    );
  }

  const workspaceResult = await resolveWorkspaceId(supabase, workspaceInput);

  if (workspaceResult.error || !workspaceResult.id) {
    return NextResponse.json(
      { ok: false, error: workspaceResult.error?.message || "Workspace not found." },
      { status: 404 },
    );
  }

  const categoryResult = categoryName
    ? await supabase
        .from("categories")
        .select("id")
        .eq("workspace_id", workspaceResult.id)
        .ilike("name", categoryName)
        .maybeSingle()
    : await supabase
        .from("categories")
        .select("id")
        .eq("workspace_id", workspaceResult.id)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

  if (categoryResult.error) {
    return NextResponse.json(
      { ok: false, error: categoryResult.error.message },
      { status: 500 },
    );
  }

  const countResult = await supabase
    .from("channels")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceResult.id);

  const result = await supabase
    .from("channels")
    .insert({
      workspace_id: workspaceResult.id,
      category_id: categoryResult.data?.id || null,
      name: slug,
      slug,
      type,
      position: (countResult.count || 0) + 1,
    })
    .select("id,name,slug,type")
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
      channel: {
        id: result.data.id,
        name: result.data.slug || result.data.name,
        type: result.data.type,
      },
      persisted: "supabase",
    },
    { status: 201 },
  );
}
