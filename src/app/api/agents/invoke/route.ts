import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getDashboardUser, isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveChannelId, resolveWorkspaceId } from "@/lib/supabase-records";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type AgentInvokeBody = {
  message?: unknown;
  workspaceId?: unknown;
  channelId?: unknown;
  agent?: unknown;
};

type OpenClawAgentConfig = {
  label: "MASBRE" | "MASBRO" | "MASSEH";
  profile: string;
  agentId: string;
  sessionKey: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getEnvValue(key: string, fallback: string) {
  return process.env[key]?.trim() || fallback;
}

function normalizeAgentLabel(agent: string): OpenClawAgentConfig["label"] {
  const normalizedAgent = agent.trim().toLowerCase();

  if (normalizedAgent === "masbro") return "MASBRO";
  if (normalizedAgent === "masseh") return "MASSEH";
  return "MASBRE";
}

function getOpenClawAgentConfig(agent: string): OpenClawAgentConfig {
  const label = normalizeAgentLabel(agent);

  if (label === "MASBRO") {
    const agentId = getEnvValue("OPENCLAW_MASBRO_AGENT_ID", "main");
    return {
      label,
      profile: getEnvValue("OPENCLAW_MASBRO_PROFILE", "masbro"),
      agentId,
      sessionKey: getEnvValue("OPENCLAW_MASBRO_SESSION_KEY", `agent:${agentId}:dashboard-masbro`),
    };
  }

  if (label === "MASSEH") {
    const agentId = getEnvValue("OPENCLAW_MASSEH_AGENT_ID", "main");
    return {
      label,
      profile: getEnvValue("OPENCLAW_MASSEH_PROFILE", "masseh"),
      agentId,
      sessionKey: getEnvValue("OPENCLAW_MASSEH_SESSION_KEY", `agent:${agentId}:dashboard-masseh`),
    };
  }

  const agentId = getEnvValue("OPENCLAW_MASBRE_AGENT_ID", getEnvValue("OPENCLAW_AGENT_ID", "main"));
  return {
    label,
    profile: getEnvValue("OPENCLAW_MASBRE_PROFILE", getEnvValue("OPENCLAW_PROFILE", "masbre")),
    agentId,
    sessionKey: getEnvValue("OPENCLAW_MASBRE_SESSION_KEY", getEnvValue("OPENCLAW_SESSION_KEY", `agent:${agentId}:dashboard-masbre`)),
  };
}

function parseOpenClawJson(output: string) {
  const firstBrace = output.indexOf("{");
  const lastBrace = output.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("OpenClaw did not return JSON.");
  }

  return JSON.parse(output.slice(firstBrace, lastBrace + 1)) as {
    status?: string;
    result?: {
      payloads?: Array<{ text?: string }>;
      meta?: {
        durationMs?: number;
        finalAssistantVisibleText?: string;
        finalAssistantRawText?: string;
        agentMeta?: {
          provider?: string;
          model?: string;
          usage?: unknown;
        };
      };
    };
    payloads?: Array<{ text?: string }>;
    meta?: {
      durationMs?: number;
      agentMeta?: {
        provider?: string;
        model?: string;
        usage?: unknown;
      };
    };
    error?: unknown;
  };
}

function getOpenClawReply(data: ReturnType<typeof parseOpenClawJson>) {
  const result = data.result || data;
  const payloadText = result.payloads
    ?.map(payload => payload.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n\n")
    .trim();

  return (
    payloadText ||
    data.result?.meta?.finalAssistantVisibleText?.trim() ||
    data.result?.meta?.finalAssistantRawText?.trim() ||
    ""
  );
}

function getOpenClawMeta(data: ReturnType<typeof parseOpenClawJson>) {
  return data.result?.meta || data.meta || {};
}

function getOpenClawChildEnv() {
  const childEnv = { ...process.env };

  delete childEnv.OPENCLAW_CONFIG_PATH;
  delete childEnv.OPENCLAW_STATE_DIR;
  delete childEnv.OPENCLAW_PROFILE;

  return childEnv;
}

export async function POST(request: Request) {
  if (!isDashboardRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null) as AgentInvokeBody | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "agentspace";
  const channelId = typeof body?.channelId === "string" ? body.channelId : "ide-project";
  const agent = typeof body?.agent === "string" ? body.agent : "MASBRE";

  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Agent message is required." },
      { status: 400 },
    );
  }

  const openClawCli = process.env.OPENCLAW_CLI_PATH?.trim() || "openclaw";
  const openClawConfig = getOpenClawAgentConfig(agent);
  const timeoutSeconds = Number(process.env.OPENCLAW_AGENT_TIMEOUT_SECONDS || 120);
  const commandArgs = [
    "--profile",
    openClawConfig.profile,
    "agent",
    "--agent",
    openClawConfig.agentId,
    "--session-key",
    openClawConfig.sessionKey,
    "--message",
    message,
    "--json",
    "--timeout",
    String(timeoutSeconds),
  ];

  let openClawData: ReturnType<typeof parseOpenClawJson>;

  try {
    const { stdout, stderr } = await execFileAsync(openClawCli, commandArgs, {
      env: getOpenClawChildEnv(),
      timeout: timeoutSeconds * 1000,
      maxBuffer: 1024 * 1024 * 4,
    });

    openClawData = parseOpenClawJson(`${stdout}\n${stderr}`);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        mode: "openclaw-cli",
        agent: openClawConfig.label,
        openClawProfile: openClawConfig.profile,
        openClawAgentId: openClawConfig.agentId,
        error: error instanceof Error ? error.message : "OpenClaw invoke failed.",
      },
      { status: 502 },
    );
  }

  const reply = getOpenClawReply(openClawData);
  const openClawMeta = getOpenClawMeta(openClawData);

  if (!reply) {
    return NextResponse.json(
      {
        ok: false,
        mode: "openclaw-cli",
        agent: openClawConfig.label,
        openClawProfile: openClawConfig.profile,
        openClawAgentId: openClawConfig.agentId,
        error: "OpenClaw response did not contain a visible reply.",
      },
      { status: 502 },
    );
  }

  const supabase = createServerSupabaseClient();
  const user = getDashboardUser();
  let savedMessage = null;
  let persisted: "supabase" | "not-configured" | "failed" = "not-configured";
  let persistError: string | null = null;

  if (supabase) {
    const workspaceResult = await resolveWorkspaceId(supabase, workspaceId);

    if (workspaceResult.error || !workspaceResult.id) {
      persisted = "failed";
      persistError = workspaceResult.error?.message || "Workspace not found.";
    } else {
      const channelResult = await resolveChannelId(supabase, workspaceResult.id, channelId);

      if (channelResult.error || !channelResult.id) {
        persisted = "failed";
        persistError = channelResult.error?.message || "Channel not found.";
      } else {
        const insertResult = await supabase
          .from("messages")
          .insert({
            workspace_id: workspaceResult.id,
            channel_id: channelResult.id,
            sender_type: "agent",
            sender_name: openClawConfig.label,
            content: reply,
            metadata: {
              openclaw: {
                mode: "cli",
                profile: openClawConfig.profile,
                agentId: openClawConfig.agentId,
                sessionKey: openClawConfig.sessionKey,
                requestedBy: user.displayName,
                provider: openClawMeta.agentMeta?.provider || null,
                model: openClawMeta.agentMeta?.model || null,
                durationMs: openClawMeta.durationMs || null,
                usage: openClawMeta.agentMeta?.usage || null,
              },
            },
          })
          .select("id,sender_type,sender_name,content,metadata,created_at")
          .single();

        if (insertResult.error) {
          persisted = "failed";
          persistError = insertResult.error.message;
        } else {
          persisted = "supabase";
          savedMessage = {
            id: insertResult.data.id,
            author: insertResult.data.sender_name || openClawConfig.label,
            time: formatTime(insertResult.data.created_at),
            ai: true,
            text: insertResult.data.content,
          };
        }
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      mode: "openclaw-cli",
      agent: openClawConfig.label,
      openClawProfile: openClawConfig.profile,
      openClawAgentId: openClawConfig.agentId,
      sessionKey: openClawConfig.sessionKey,
      workspaceId,
      channelId,
      reply,
      persisted,
      persistError,
      message: savedMessage,
      meta: {
        provider: openClawMeta.agentMeta?.provider || null,
        model: openClawMeta.agentMeta?.model || null,
        durationMs: openClawMeta.durationMs || null,
      },
    },
    { status: 200 },
  );
}
