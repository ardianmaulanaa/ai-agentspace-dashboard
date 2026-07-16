import { NextResponse } from "next/server";
import { requireDashboardRoles } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveWorkspaceId, slugify } from "@/lib/supabase-records";
import { optionalString, readJsonObject, requiredString, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const channelTypes = ["text", "forum", "voice"] as const;

export async function POST(request: Request) {
  const authError = requireDashboardRoles(request, ["admin", "owner"]);
  if (authError) return authError;

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

  const nameResult = requiredString(body, "name", "Channel name");
  const workspaceInput = optionalString(body, "workspaceId");
  const categoryName = optionalString(body, "category");
  const name = nameResult.value;
  const slug = slugify(name);
  const rawType = optionalString(body, "type") || "text";
  const type = channelTypes.includes(rawType as typeof channelTypes[number])
    ? (rawType as typeof channelTypes[number])
    : null;

  if (nameResult.error || !slug) {
    return validationError("Channel name is required.");
  }

  if (!type) {
    return validationError("Channel type must be text, forum, or voice.");
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
