import { NextResponse } from "next/server";
import { isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveWorkspaceId, slugify } from "@/lib/supabase-records";
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

  const nameResult = requiredString(body, "name", "Category name");
  const name = nameResult.value;
  const workspaceInput = optionalString(body, "workspaceId");
  const slug = slugify(name);

  if (nameResult.error || !slug) {
    return validationError("Category name is required.");
  }

  const workspaceResult = await resolveWorkspaceId(supabase, workspaceInput);

  if (workspaceResult.error || !workspaceResult.id) {
    return NextResponse.json(
      { ok: false, error: workspaceResult.error?.message || "Workspace not found." },
      { status: 404 },
    );
  }

  const countResult = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceResult.id);

  const result = await supabase
    .from("categories")
    .insert({
      workspace_id: workspaceResult.id,
      name,
      slug,
      position: (countResult.count || 0) + 1,
    })
    .select("id,name,slug")
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
      category: {
        id: result.data.id,
        name: result.data.name,
        slug: result.data.slug,
      },
      persisted: "supabase",
    },
    { status: 201 },
  );
}
