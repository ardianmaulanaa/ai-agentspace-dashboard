import { NextResponse } from "next/server";
import { getDashboardUser, isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveChannelId, resolveWorkspaceId } from "@/lib/supabase-records";

export const dynamic = "force-dynamic";

type ForumPostBody = {
  workspaceId?: unknown;
  channelId?: unknown;
  title?: unknown;
  body?: unknown;
  tag?: unknown;
  status?: unknown;
};

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

  const body = await request.json().catch(() => null) as ForumPostBody | null;
  const workspaceInput = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";
  const channelInput = typeof body?.channelId === "string" ? body.channelId.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.body === "string" ? body.body.trim() : "";
  const tag = typeof body?.tag === "string" ? body.tag.trim() : "General";
  const status = typeof body?.status === "string" ? body.status.trim() : "open";

  if (!title || !content) {
    return NextResponse.json(
      { ok: false, error: "Forum title and body are required." },
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

  const channelResult = await resolveChannelId(supabase, workspaceResult.id, channelInput || "forum");

  if (channelResult.error || !channelResult.id) {
    return NextResponse.json(
      { ok: false, error: channelResult.error?.message || "Forum channel not found." },
      { status: 404 },
    );
  }

  const result = await supabase
    .from("forum_posts")
    .insert({
      workspace_id: workspaceResult.id,
      channel_id: channelResult.id,
      author_name: getDashboardUser().displayName,
      title,
      content,
      status,
      metadata: { tag },
    })
    .select("id,title,content,status,metadata,updated_at")
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
      post: {
        id: result.data.id,
        title: result.data.title,
        body: result.data.content,
        tag: typeof result.data.metadata?.tag === "string" ? result.data.metadata.tag : "General",
        status: result.data.status,
        replies: 0,
        lastActivity: "just now",
      },
      persisted: "supabase",
    },
    { status: 201 },
  );
}
