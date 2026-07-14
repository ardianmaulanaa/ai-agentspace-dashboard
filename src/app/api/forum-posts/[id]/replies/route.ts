import { NextResponse } from "next/server";
import { getDashboardRequestUser, isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { readJsonObject, requiredString, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
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
  const body = await readJsonObject(request);

  if (!body) {
    return validationError("Request body must be a JSON object.");
  }

  const contentResult = requiredString(body, "body", "Reply body");
  const content = contentResult.value;

  if (contentResult.error) {
    return validationError("Reply body is required.");
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

  const user = getDashboardRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

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
