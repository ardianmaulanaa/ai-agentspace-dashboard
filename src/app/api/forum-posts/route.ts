import { NextResponse } from "next/server";
import { getDashboardRequestUser, isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveChannelId, resolveWorkspaceId } from "@/lib/supabase-records";
import { optionalString, readJsonObject, requiredString, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

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

  const body = await readJsonObject(request);

  if (!body) {
    return validationError("Request body must be a JSON object.");
  }

  const titleResult = requiredString(body, "title", "Forum title");
  const bodyResult = requiredString(body, "body", "Forum body");
  const workspaceInput = optionalString(body, "workspaceId");
  const channelInput = optionalString(body, "channelId");
  const title = titleResult.value;
  const content = bodyResult.value;
  const tag = optionalString(body, "tag") || "General";
  const status = optionalString(body, "status") || "open";

  if (titleResult.error || bodyResult.error) {
    return validationError("Forum title and body are required.");
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

  const user = getDashboardRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const result = await supabase
    .from("forum_posts")
    .insert({
      workspace_id: workspaceResult.id,
      channel_id: channelResult.id,
      author_name: user.displayName,
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
