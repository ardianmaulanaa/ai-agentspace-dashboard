import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getDashboardRequestUser, isDashboardRequestAuthenticated } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { resolveChannelId, resolveWorkspaceId } from "@/lib/supabase-records";
import { optionalString, readJsonObject, requiredString, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type OpenClawAgentConfig = {
  label: "MASBRE" | "MASBRO" | "MASSEH" | "GPT" | "CLAUDE" | "GEMINI" | "NVIDIA" | "QWEN" | "DEEPSEEK" | "GROK";
  profile: string;
  agentId: string;
  sessionKey: string;
};

const OPENCLAW_AGENT_DEFAULTS: Record<OpenClawAgentConfig["label"], { profile: string; sessionSuffix: string }> = {
  MASBRE: { profile: "masbre", sessionSuffix: "masbre" },
  MASBRO: { profile: "masbro", sessionSuffix: "masbro" },
  MASSEH: { profile: "masseh", sessionSuffix: "masseh" },
  GPT: { profile: "gpt", sessionSuffix: "gpt" },
  CLAUDE: { profile: "claude", sessionSuffix: "claude" },
  GEMINI: { profile: "gemini", sessionSuffix: "gemini" },
  NVIDIA: { profile: "masbro", sessionSuffix: "nvidia" },
  QWEN: { profile: "qwen", sessionSuffix: "qwen" },
  DEEPSEEK: { profile: "deepseek", sessionSuffix: "deepseek" },
  GROK: { profile: "grok", sessionSuffix: "grok" },
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
  const normalizedAgent = agent.trim().toUpperCase();

  if (normalizedAgent in OPENCLAW_AGENT_DEFAULTS) {
    return normalizedAgent as OpenClawAgentConfig["label"];
  }

  return "MASBRE";
}

function getOpenClawAgentConfig(agent: string): OpenClawAgentConfig {
  const label = normalizeAgentLabel(agent);
  const defaults = OPENCLAW_AGENT_DEFAULTS[label];
  const envPrefix = `OPENCLAW_${label}`;
  const agentId = getEnvValue(`${envPrefix}_AGENT_ID`, label === "MASBRE" ? getEnvValue("OPENCLAW_AGENT_ID", "main") : "main");
  return {
    label,
    profile: getEnvValue(`${envPrefix}_PROFILE`, label === "MASBRE" ? getEnvValue("OPENCLAW_PROFILE", defaults.profile) : defaults.profile),
    agentId,
    sessionKey: getEnvValue(`${envPrefix}_SESSION_KEY`, label === "MASBRE" ? getEnvValue("OPENCLAW_SESSION_KEY", `agent:${agentId}:dashboard-${defaults.sessionSuffix}`) : `agent:${agentId}:dashboard-${defaults.sessionSuffix}`),
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

function sanitizeOpenClawError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error || "OpenClaw invoke failed.");

  return rawMessage
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\[[0-9;]*m/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 480);
}

function getFastChatReply(message: string) {
  const normalizedMessage = message
    .trim()
    .toLowerCase()
    .replace(/[.!?。、]+$/g, "")
    .replace(/\s+/g, " ");

  const replies: Record<string, string> = {
    test: "Masuk mas.",
    tes: "Masuk mas.",
    ping: "Masuk mas.",
    p: "Masuk mas.",
    halo: "Halo mas.",
    hallo: "Halo mas.",
    hai: "Hai mas.",
    hi: "Hai mas.",
    hey: "Hai mas.",
    ok: "Oke mas.",
    oke: "Oke mas.",
    siap: "Siap mas.",
    sip: "Siap mas.",
    iya: "Iya mas.",
    ya: "Iya mas.",
    makasih: "Sama-sama mas.",
    "terima kasih": "Sama-sama mas.",
    thanks: "Sama-sama mas.",
    thx: "Sama-sama mas.",
  };

  if (replies[normalizedMessage]) {
    return replies[normalizedMessage];
  }

  if (/^(kamu|lu|lo|bro|mas)?\s*(ada|online)\s*(ga|gak|nggak|ngga)?$/.test(normalizedMessage)) {
    return "Ada mas.";
  }

  return "";
}

function getSmartFastReply(message: string, agent: OpenClawAgentConfig["label"]) {
  const normalizedMessage = message.trim().replace(/\s+/g, " ");
  const lowerMessage = normalizedMessage.toLowerCase();

  if (!normalizedMessage) return "";

  if (/^(bukan|salah|nggak|ngga|ga|gak|nope|bkn)$/i.test(lowerMessage)) {
    return "Oke mas, berarti bukan itu. Kasih arahan yang benernya, nanti saya ikuti.";
  }

  if (/(lebih cepat|cepet|cepat|lama|lemot|loading)/.test(lowerMessage)) {
    return "Bisa mas. Mode fast sudah aktif, jadi balasan dashboard dibuat instan tanpa nunggu proses agent yang berat.";
  }

  if (/(gimana|bagaimana|caranya|cara|bisa)/.test(lowerMessage)) {
    return "Bisa mas. Kasih detail bagian yang mau diubah, nanti saya bantu arahkan langkahnya.";
  }

  if (/(error|bug|gagal|forbidden|unauthorized|tidak bisa|nggak bisa|ga bisa|gabisa)/.test(lowerMessage)) {
    return "Kirim error lengkap atau screenshot terakhirnya mas, nanti saya cek bagian yang perlu diperbaiki.";
  }

  if (/(role|admin|owner|member|akses|hak akses|rbac)/.test(lowerMessage)) {
    return "Untuk role, pakai metadata Supabase `role` dengan value `admin`, `owner`, atau `member`. Kalau mau ganti cepat, ubah `raw_user_meta_data` user lalu logout-login ulang.";
  }

  if (/(supabase|database|query|sql|table)/.test(lowerMessage)) {
    return "Bisa mas. Untuk Supabase, cek dulu table/auth user yang dipakai, lalu update lewat SQL Editor atau dashboard Supabase. Kalau kirim struktur tabelnya, saya bantu bikinkan query yang pas.";
  }

  if (/(ui|tampilan|warna|dashboard|navbar|header|sidebar|menu)/.test(lowerMessage)) {
    return "Siap mas. Untuk UI kita ubah per bagian biar rapi: header, sidebar, panel kanan, lalu area chat.";
  }

  if (/(push|github|git|commit|branch|merge)/.test(lowerMessage)) {
    return "Untuk Git, cek dulu `git status`, lalu commit perubahan yang sudah aman. Kalau mau pindah branch pakai `git switch nama-branch`, dan push pakai `git push origin nama-branch`.";
  }

  if (/(api|endpoint|postman|swagger|openapi)/.test(lowerMessage)) {
    return "Untuk API, pastikan endpoint punya validasi request, cek auth/role, response status jelas, dan sudah masuk OpenAPI atau Postman Collection.";
  }

  return `Siap mas, ${agent} standby.`;
}

export async function POST(request: Request) {
  if (!isDashboardRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const body = await readJsonObject(request);

  if (!body) {
    return validationError("Request body must be a JSON object.");
  }

  const messageResult = requiredString(body, "message", "Agent message");
  const message = messageResult.value;
  const workspaceId = optionalString(body, "workspaceId") || "agentspace";
  const channelId = optionalString(body, "channelId") || "ide-project";
  const agent = optionalString(body, "agent") || "MASBRE";

  if (messageResult.error) {
    return validationError("Agent message is required.");
  }

  const openClawCli = process.env.OPENCLAW_CLI_PATH?.trim() || "openclaw";
  const openClawConfig = getOpenClawAgentConfig(agent);
  const timeoutSeconds = Number(process.env.OPENCLAW_AGENT_TIMEOUT_SECONDS || 120);
  const fastReply = getFastChatReply(message);
  const responsePreference = (process.env.OPENCLAW_AGENT_RESPONSE_MODE || "cli").trim().toLowerCase();
  const shouldUseCli = responsePreference === "cli" || responsePreference === "openclaw";
  let reply = fastReply || (!shouldUseCli ? getSmartFastReply(message, openClawConfig.label) : "");
  const responseMode: "fast-chat" | "openclaw-cli" = reply ? "fast-chat" : "openclaw-cli";
  let openClawMeta: ReturnType<typeof getOpenClawMeta> = {};
  let openClawInvokeError: string | null = null;

  if (!reply) {
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

    let openClawData: ReturnType<typeof parseOpenClawJson> | null = null;

    try {
      const { stdout, stderr } = await execFileAsync(openClawCli, commandArgs, {
        env: getOpenClawChildEnv(),
        timeout: timeoutSeconds * 1000,
        maxBuffer: 1024 * 1024 * 4,
      });

      openClawData = parseOpenClawJson(`${stdout}\n${stderr}`);
    } catch (error) {
      openClawInvokeError = sanitizeOpenClawError(error);
      reply = "Maaf mas, agent OpenClaw belum bisa dipanggil sekarang. Cek konfigurasi OpenClaw/profile agent dulu, atau coba lagi setelah servicenya aktif.";
    }

    if (openClawData) {
      reply = getOpenClawReply(openClawData);
      openClawMeta = getOpenClawMeta(openClawData);
    }
  }

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
  const user = getDashboardRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

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
                mode: responseMode === "fast-chat" ? "fast-chat" : "cli",
                profile: openClawConfig.profile,
                agentId: openClawConfig.agentId,
                sessionKey: openClawConfig.sessionKey,
                requestedBy: user.displayName,
                error: openClawInvokeError,
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
      mode: responseMode,
      agent: openClawConfig.label,
      openClawProfile: openClawConfig.profile,
      openClawAgentId: openClawConfig.agentId,
      sessionKey: openClawConfig.sessionKey,
      workspaceId,
      channelId,
      reply,
      persisted,
      persistError,
      openClawError: openClawInvokeError,
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
