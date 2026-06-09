import { NextResponse } from "next/server";
import { getDashboardUser, isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ReplyBody = {
  body?: unknown;
};

export async function POST(request: Request, context: RouteContext) {
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
  const body = await request.json().catch(() => null) as ReplyBody | null;
  const content = typeof body?.body === "string" ? body.body.trim() : "";

  if (!content) {
    return NextResponse.json(
      { ok: false, error: "Reply body is required." },
      { status: 400 },
    );
  }

  const postResult = await supabase
    .from("forum_posts")
    .select("id,workspace_id")
    .eq("id", id)
    .single();

  if (postResult.error) {
    return NextResponse.json(
      { ok: false, error: postResult.error.message },
      { status: 404 },
    );
  }

  const user = getDashboardUser();
  const result = await supabase
    .from("forum_replies")
    .insert({
      workspace_id: postResult.data.workspace_id,
      post_id: id,
      author_name: user.displayName,
      content,
    })
    .select("id,author_name,content,created_at")
    .single();

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  await supabase
    .from("forum_posts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json(
    {
      ok: true,
      reply: {
        id: result.data.id,
        author: result.data.author_name || user.displayName,
        body: result.data.content,
        time: "just now",
      },
      persisted: "supabase",
    },
    { status: 201 },
  );
}
