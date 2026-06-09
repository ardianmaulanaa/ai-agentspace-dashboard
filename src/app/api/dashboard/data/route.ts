import { NextResponse } from "next/server";
import { isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
};

type CategoryRow = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  position: number;
};

type ChannelRow = {
  id: string;
  workspace_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  type: string;
  position: number;
};

type MessageRow = {
  id: string;
  channel_id: string;
  sender_type: string;
  sender_name: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type ForumPostRow = {
  id: string;
  title: string;
  content: string;
  status: string;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

type ForumReplyRow = {
  post_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
};

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "WS";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatActivity(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

  const [
    workspacesResult,
    categoriesResult,
    channelsResult,
    messagesResult,
    forumPostsResult,
    forumRepliesResult,
  ] = await Promise.all([
    supabase.from("workspaces").select("id,name,slug").order("created_at", { ascending: true }),
    supabase.from("categories").select("id,workspace_id,name,slug,position").order("position", { ascending: true }),
    supabase.from("channels").select("id,workspace_id,category_id,name,slug,type,position").order("position", { ascending: true }),
    supabase.from("messages").select("id,channel_id,sender_type,sender_name,content,metadata,created_at").order("created_at", { ascending: true }).limit(80),
    supabase.from("forum_posts").select("id,title,content,status,metadata,updated_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("forum_replies").select("post_id,author_name,content,created_at").order("created_at", { ascending: true }).limit(120),
  ]);

  const firstError = [
    workspacesResult.error,
    categoriesResult.error,
    channelsResult.error,
    messagesResult.error,
    forumPostsResult.error,
    forumRepliesResult.error,
  ].find(Boolean);

  if (firstError) {
    return NextResponse.json(
      { ok: false, error: firstError.message },
      { status: 500 },
    );
  }

  const workspaceRows = (workspacesResult.data || []) as WorkspaceRow[];
  const categoryRows = (categoriesResult.data || []) as CategoryRow[];
  const channelRows = (channelsResult.data || []) as ChannelRow[];
  const messageRows = (messagesResult.data || []) as MessageRow[];
  const forumPostRows = (forumPostsResult.data || []) as ForumPostRow[];
  const forumReplyRows = (forumRepliesResult.data || []) as ForumReplyRow[];
  const firstWorkspace = workspaceRows[0] || null;
  const activeChannels = firstWorkspace
    ? channelRows.filter(channel => channel.workspace_id === firstWorkspace.id)
    : channelRows;
  const firstTextChannel = activeChannels.find(channel => channel.type === "text") || activeChannels[0] || null;

  const categories = categoryRows
    .filter(category => !firstWorkspace || category.workspace_id === firstWorkspace.id)
    .map(category => ({
      name: category.name,
      channels: activeChannels
        .filter(channel => channel.category_id === category.id)
        .map(channel => ({
          name: channel.slug || channel.name,
          type: ["text", "forum", "voice"].includes(channel.type) ? channel.type : "text",
        })),
    }))
    .filter(category => category.channels.length > 0);

  const messages = messageRows
    .filter(message => !firstTextChannel || message.channel_id === firstTextChannel.id)
    .map(message => ({
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
    }));

  const replyCounts = forumReplyRows.reduce<Record<string, number>>((counts, reply) => {
    counts[reply.post_id] = (counts[reply.post_id] || 0) + 1;
    return counts;
  }, {});

  const forumReplies = forumReplyRows.reduce<Record<string, Array<{ author: string; body: string; time: string }>>>((replies, reply) => {
    replies[reply.post_id] = [
      ...(replies[reply.post_id] || []),
      {
        author: reply.author_name || "User",
        body: reply.content,
        time: formatActivity(reply.created_at),
      },
    ];
    return replies;
  }, {});

  return NextResponse.json({
    ok: true,
    workspaces: workspaceRows.map((workspace, index) => ({
      id: workspace.id,
      initials: initialsFromName(workspace.name),
      name: workspace.name,
      accentIdx: index % 4,
    })),
    categories,
    activeWorkspaceId: firstWorkspace?.id || null,
    activeChannelId: firstTextChannel?.slug || firstTextChannel?.name || null,
    messages,
    forumPosts: forumPostRows.map(post => ({
      id: post.id,
      title: post.title,
      body: post.content,
      tag: typeof post.metadata?.tag === "string" ? post.metadata.tag : "General",
      status: post.status,
      replies: replyCounts[post.id] || 0,
      lastActivity: formatActivity(post.updated_at),
    })),
    forumReplies,
  });
}
