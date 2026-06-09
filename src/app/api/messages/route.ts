import { NextResponse } from "next/server";
import { getDashboardUser, isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveChannelId, resolveWorkspaceId } from "@/lib/supabase-records";

export const dynamic = "force-dynamic";

type MessageBody = {
  workspaceId?: unknown;
  channelId?: unknown;
  content?: unknown;
  attachmentData?: unknown;
  attachmentName?: unknown;
  attachmentMime?: unknown;
  replyTo?: unknown;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function mapMessageRow(message: {
  id: string;
  sender_type: string;
  sender_name: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}) {
  return {
    id: message.id,
    author: message.sender_name || (message.sender_type === "agent" ? "Agent" : "User"),
    time: formatTime(message.created_at),
    ai: message.sender_type === "agent" || message.sender_type === "system",
    text: message.content,
    replyTo: typeof message.metadata?.replyTo === "string" ? message.metadata.replyTo : undefined,
    image: typeof message.metadata?.attachmentData === "string" ? message.metadata.attachmentData : undefined,
    imageName: typeof message.metadata?.attachmentName === "string" ? message.metadata.attachmentName : undefined,
    imageMime: typeof message.metadata?.attachmentMime === "string" ? message.metadata.attachmentMime : undefined,
    edited: message.metadata?.edited === true,
    pinned: message.metadata?.pinned === true,
    reactions: typeof message.metadata?.reactions === "object" && message.metadata.reactions !== null
      ? message.metadata.reactions
      : undefined,
  };
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const workspaceInput = url.searchParams.get("workspaceId")?.trim() || "";
  const channelInput = url.searchParams.get("channelId")?.trim() || "";
  const workspaceResult = await resolveWorkspaceId(supabase, workspaceInput);

  if (workspaceResult.error || !workspaceResult.id) {
    return NextResponse.json(
      { ok: false, error: workspaceResult.error?.message || "Workspace not found." },
      { status: 404 },
    );
  }

  const channelResult = await resolveChannelId(supabase, workspaceResult.id, channelInput);

  if (channelResult.error || !channelResult.id) {
    return NextResponse.json(
      { ok: false, error: channelResult.error?.message || "Channel not found." },
      { status: 404 },
    );
  }

  const result = await supabase
    .from("messages")
    .select("id,sender_type,sender_name,content,metadata,created_at")
    .eq("workspace_id", workspaceResult.id)
    .eq("channel_id", channelResult.id)
    .order("created_at", { ascending: true })
    .limit(80);

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    messages: (result.data || []).map(mapMessageRow),
  });
}

export async function POST(request: Request) {
  if (!isDashboardRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null) as MessageBody | null;

  if (!body || typeof body.content !== "string") {
    return NextResponse.json(
      { ok: false, error: "Message content is required." },
      { status: 400 },
    );
  }

  const content = body.content.trim();
  const workspaceInput = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  const channelInput = typeof body.channelId === "string" ? body.channelId.trim() : "";
  const attachmentData = typeof body.attachmentData === "string" ? body.attachmentData.trim() : "";
  const attachmentName = typeof body.attachmentName === "string" ? body.attachmentName.trim() : "";
  const attachmentMime = typeof body.attachmentMime === "string" ? body.attachmentMime.trim() : "";
  const replyTo = typeof body.replyTo === "string" ? body.replyTo.trim() : "";

  if (!content && !attachmentName) {
    return NextResponse.json(
      { ok: false, error: "Message cannot be empty." },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: true,
        id: `msg_${Date.now()}`,
        persisted: "demo",
        note: "Supabase env is not configured yet, so this was not saved to database.",
      },
      { status: 201 },
    );
  }

  const workspaceResult = await resolveWorkspaceId(supabase, workspaceInput);

  if (workspaceResult.error || !workspaceResult.id) {
    return NextResponse.json(
      { ok: false, error: workspaceResult.error?.message || "Workspace not found." },
      { status: 404 },
    );
  }

  const workspaceId = workspaceResult.id;
  const channelResult = await resolveChannelId(supabase, workspaceId, channelInput);

  if (channelResult.error || !channelResult.id) {
    return NextResponse.json(
      { ok: false, error: channelResult.error?.message || "Channel not found." },
      { status: 404 },
    );
  }

  const user = getDashboardUser();
  const insertResult = await supabase
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      channel_id: channelResult.id,
      sender_type: "user",
      sender_name: user.displayName,
      content,
      metadata: {
        attachmentData: attachmentData || null,
        attachmentName: attachmentName || null,
        attachmentMime: attachmentMime || null,
        replyTo: replyTo || null,
      },
    })
    .select("id,sender_type,sender_name,content,metadata,created_at")
    .single();

  if (insertResult.error) {
    return NextResponse.json(
      { ok: false, error: insertResult.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      id: insertResult.data.id,
      persisted: "supabase",
      createdAt: insertResult.data.created_at,
      message: mapMessageRow(insertResult.data),
    },
    { status: 201 },
  );
}
