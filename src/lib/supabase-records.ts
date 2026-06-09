import type { SupabaseClient } from "@supabase/supabase-js";

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function resolveWorkspaceId(supabase: SupabaseClient, workspaceInput: string) {
  if (workspaceInput) {
    const query = supabase.from("workspaces").select("id").limit(1);
    const result = isUuid(workspaceInput)
      ? await query.eq("id", workspaceInput).maybeSingle()
      : await query.eq("slug", workspaceInput).maybeSingle();

    return { id: result.data?.id || null, error: result.error };
  }

  const result = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return { id: result.data?.id || null, error: result.error };
}

export async function resolveChannelId(
  supabase: SupabaseClient,
  workspaceId: string,
  channelInput: string,
) {
  if (channelInput) {
    const query = supabase.from("channels").select("id").eq("workspace_id", workspaceId).limit(1);
    const result = isUuid(channelInput)
      ? await query.eq("id", channelInput).maybeSingle()
      : await query.eq("slug", channelInput).maybeSingle();

    return { id: result.data?.id || null, error: result.error };
  }

  const result = await supabase
    .from("channels")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("type", "text")
    .order("position", { ascending: true })
    .limit(1)
    .single();

  return { id: result.data?.id || null, error: result.error };
}
