import { NextResponse } from "next/server";
import { isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CONFIRM_PHRASE = "BERSIHKAN DATABASE";
const CLEANUP_TABLES = ["forum_replies", "forum_posts", "messages"] as const;

type CleanupBody = {
  dryRun?: unknown;
  confirm?: unknown;
};

type CleanupTable = (typeof CLEANUP_TABLES)[number];

type CleanupCounts = Record<CleanupTable, number>;

function emptyCounts(): CleanupCounts {
  return {
    forum_replies: 0,
    forum_posts: 0,
    messages: 0,
  };
}

async function countRows(
  supabase: NonNullable<ReturnType<typeof createServerSupabaseClient>>,
) {
  const counts = emptyCounts();

  for (const table of CLEANUP_TABLES) {
    const result = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });

    if (result.error) {
      return { counts, error: result.error };
    }

    counts[table] = result.count || 0;
  }

  return { counts, error: null };
}

async function deleteRows(
  supabase: NonNullable<ReturnType<typeof createServerSupabaseClient>>,
) {
  for (const table of CLEANUP_TABLES) {
    const result = await supabase
      .from(table)
      .delete()
      .not("id", "is", null);

    if (result.error) {
      return result.error;
    }
  }

  return null;
}

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

  const body = await request.json().catch(() => ({})) as CleanupBody;
  const dryRun = body.dryRun !== false;
  const confirm = typeof body.confirm === "string" ? body.confirm.trim() : "";
  const before = await countRows(supabase);

  if (before.error) {
    return NextResponse.json(
      { ok: false, error: before.error.message },
      { status: 500 },
    );
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      scope: "chat-and-forum-content",
      confirmPhrase: CONFIRM_PHRASE,
      counts: before.counts,
    });
  }

  if (confirm !== CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        ok: false,
        error: `Confirmation phrase must be exactly "${CONFIRM_PHRASE}".`,
        confirmPhrase: CONFIRM_PHRASE,
        counts: before.counts,
      },
      { status: 400 },
    );
  }

  const deleteError = await deleteRows(supabase);

  if (deleteError) {
    return NextResponse.json(
      { ok: false, error: deleteError.message, counts: before.counts },
      { status: 500 },
    );
  }

  const after = await countRows(supabase);

  if (after.error) {
    return NextResponse.json(
      {
        ok: false,
        error: after.error.message,
        deleted: before.counts,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    dryRun: false,
    scope: "chat-and-forum-content",
    deleted: before.counts,
    counts: after.counts,
  });
}
