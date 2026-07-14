export type EnvCheck = {
  key: string;
  label: string;
  configured: boolean;
  scope: "public" | "server";
};

type AgentBridgeStatus = {
  label: "MASBRE" | "MASBRO" | "MASSEH" | "GPT" | "CLAUDE" | "GEMINI" | "QWEN" | "DEEPSEEK" | "GROK";
  profile: string;
  agentId: string;
  sessionKey: string;
  configured: boolean;
  providerReady: boolean;
  requiredProvider: string | null;
};

export type ConfigStatus = {
  auth: {
    configured: boolean;
    userStore: string;
    userStoreSupabase: boolean;
    usernameConfigured: boolean;
    passwordHashConfigured: boolean;
    passwordFallbackConfigured: boolean;
    accessTokenConfigured: boolean;
    refreshTokenConfigured: boolean;
    role: string;
  };
  supabase: {
    configured: boolean;
    urlConfigured: boolean;
    anonKeyConfigured: boolean;
    serviceRoleConfigured: boolean;
    projectHost: string | null;
  };
  agentBridge: {
    configured: boolean;
    mode: "cli" | "http";
    cliConfigured: boolean;
    agentConfigured: boolean;
    sessionConfigured: boolean;
    gatewayConfigured: boolean;
    apiKeyConfigured: boolean;
    profile: string;
  };
  agentBridges: AgentBridgeStatus[];
  providers: EnvCheck[];
};

function hasValue(value: string | undefined) {
  if (!value) return false;

  const normalizedValue = value.trim().toLowerCase();
  const placeholderValues = new Set([
    "",
    "***",
    "...",
    "your_key_here",
    "isi_key",
    "isi_key_disini",
    "paste_key_here",
    "password_baru_bang",
  ]);

  return !placeholderValues.has(normalizedValue);
}

function getProjectHost(url: string | undefined) {
  if (!url) return null;

  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function getConfigStatus(): ConfigStatus {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dashboardUsername = process.env.DASHBOARD_USERNAME;
  const authUserStore = process.env.AUTH_USER_STORE || "supabase-auth";
  const dashboardPasswordHash = process.env.DASHBOARD_PASSWORD_HASH;
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;
  const dashboardAccessToken = process.env.DASHBOARD_ACCESS_TOKEN;
  const dashboardRefreshToken = process.env.DASHBOARD_REFRESH_TOKEN;
  const dashboardRole = process.env.DASHBOARD_ROLE || "admin";
  const openClawCliPath = process.env.OPENCLAW_CLI_PATH || "openclaw";
  const openClawProfile = process.env.OPENCLAW_PROFILE || "masbre";
  const openClawAgentId = process.env.OPENCLAW_AGENT_ID || "main";
  const openClawSessionKey = process.env.OPENCLAW_SESSION_KEY || "agent:main:dashboard";
  const openClawGatewayUrl = process.env.OPENCLAW_GATEWAY_URL;
  const openClawApiKey = process.env.OPENCLAW_API_KEY;
  const cliBridgeConfigured = hasValue(openClawCliPath) && hasValue(openClawAgentId) && hasValue(openClawSessionKey);
  const httpBridgeConfigured = hasValue(openClawGatewayUrl) && hasValue(openClawApiKey);
  const providerReadyByKey = {
    OPENAI_API_KEY: hasValue(process.env.OPENAI_API_KEY),
    ANTHROPIC_API_KEY: hasValue(process.env.ANTHROPIC_API_KEY),
    GEMINI_API_KEY: hasValue(process.env.GEMINI_API_KEY),
    NVIDIA_API_KEY: hasValue(process.env.NVIDIA_API_KEY),
    QWEN_API_KEY: hasValue(process.env.QWEN_API_KEY),
    DEEPSEEK_API_KEY: hasValue(process.env.DEEPSEEK_API_KEY),
    XAI_API_KEY: hasValue(process.env.XAI_API_KEY),
  };

  const agentBridgeDefaults: AgentBridgeStatus[] = [
    {
      label: "MASBRE",
      profile: process.env.OPENCLAW_MASBRE_PROFILE || openClawProfile,
      agentId: process.env.OPENCLAW_MASBRE_AGENT_ID || openClawAgentId,
      sessionKey: process.env.OPENCLAW_MASBRE_SESSION_KEY || "agent:main:dashboard-masbre",
      requiredProvider: null,
      providerReady: true,
      configured: false,
    },
    {
      label: "MASBRO",
      profile: process.env.OPENCLAW_MASBRO_PROFILE || "masbro",
      agentId: process.env.OPENCLAW_MASBRO_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_MASBRO_SESSION_KEY || "agent:main:dashboard-masbro",
      requiredProvider: "NVIDIA_API_KEY",
      providerReady: providerReadyByKey.NVIDIA_API_KEY,
      configured: false,
    },
    {
      label: "MASSEH",
      profile: process.env.OPENCLAW_MASSEH_PROFILE || "masseh",
      agentId: process.env.OPENCLAW_MASSEH_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_MASSEH_SESSION_KEY || "agent:main:dashboard-masseh",
      requiredProvider: null,
      providerReady: true,
      configured: false,
    },
    {
      label: "GPT",
      profile: process.env.OPENCLAW_GPT_PROFILE || "gpt",
      agentId: process.env.OPENCLAW_GPT_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_GPT_SESSION_KEY || "agent:main:dashboard-gpt",
      requiredProvider: "OPENAI_API_KEY",
      providerReady: providerReadyByKey.OPENAI_API_KEY,
      configured: false,
    },
    {
      label: "CLAUDE",
      profile: process.env.OPENCLAW_CLAUDE_PROFILE || "claude",
      agentId: process.env.OPENCLAW_CLAUDE_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_CLAUDE_SESSION_KEY || "agent:main:dashboard-claude",
      requiredProvider: "ANTHROPIC_API_KEY",
      providerReady: providerReadyByKey.ANTHROPIC_API_KEY,
      configured: false,
    },
    {
      label: "GEMINI",
      profile: process.env.OPENCLAW_GEMINI_PROFILE || "gemini",
      agentId: process.env.OPENCLAW_GEMINI_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_GEMINI_SESSION_KEY || "agent:main:dashboard-gemini",
      requiredProvider: "GEMINI_API_KEY",
      providerReady: providerReadyByKey.GEMINI_API_KEY,
      configured: false,
    },
    {
      label: "QWEN",
      profile: process.env.OPENCLAW_QWEN_PROFILE || "qwen",
      agentId: process.env.OPENCLAW_QWEN_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_QWEN_SESSION_KEY || "agent:main:dashboard-qwen",
      requiredProvider: "QWEN_API_KEY",
      providerReady: providerReadyByKey.QWEN_API_KEY,
      configured: false,
    },
    {
      label: "DEEPSEEK",
      profile: process.env.OPENCLAW_DEEPSEEK_PROFILE || "deepseek",
      agentId: process.env.OPENCLAW_DEEPSEEK_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_DEEPSEEK_SESSION_KEY || "agent:main:dashboard-deepseek",
      requiredProvider: "DEEPSEEK_API_KEY",
      providerReady: providerReadyByKey.DEEPSEEK_API_KEY,
      configured: false,
    },
    {
      label: "GROK",
      profile: process.env.OPENCLAW_GROK_PROFILE || "grok",
      agentId: process.env.OPENCLAW_GROK_AGENT_ID || "main",
      sessionKey: process.env.OPENCLAW_GROK_SESSION_KEY || "agent:main:dashboard-grok",
      requiredProvider: "XAI_API_KEY",
      providerReady: providerReadyByKey.XAI_API_KEY,
      configured: false,
    },
  ];

  const agentBridges = agentBridgeDefaults.map(agent => ({
    ...agent,
    configured:
      hasValue(openClawCliPath) &&
      hasValue(agent.profile) &&
      hasValue(agent.agentId) &&
      hasValue(agent.sessionKey) &&
      agent.providerReady,
  }));

  const providers: EnvCheck[] = [
    { key: "OPENAI_API_KEY", label: "OpenAI", configured: hasValue(process.env.OPENAI_API_KEY), scope: "server" },
    { key: "ANTHROPIC_API_KEY", label: "Anthropic", configured: hasValue(process.env.ANTHROPIC_API_KEY), scope: "server" },
    { key: "GEMINI_API_KEY", label: "Gemini", configured: hasValue(process.env.GEMINI_API_KEY), scope: "server" },
    { key: "NVIDIA_API_KEY", label: "NVIDIA", configured: hasValue(process.env.NVIDIA_API_KEY), scope: "server" },
    { key: "QWEN_API_KEY", label: "Qwen", configured: hasValue(process.env.QWEN_API_KEY), scope: "server" },
    { key: "MISTRAL_API_KEY", label: "Mistral", configured: hasValue(process.env.MISTRAL_API_KEY), scope: "server" },
    { key: "DEEPSEEK_API_KEY", label: "DeepSeek", configured: hasValue(process.env.DEEPSEEK_API_KEY), scope: "server" },
    { key: "XAI_API_KEY", label: "xAI", configured: hasValue(process.env.XAI_API_KEY), scope: "server" },
    { key: "COHERE_API_KEY", label: "Cohere", configured: hasValue(process.env.COHERE_API_KEY), scope: "server" },
  ];

  return {
    auth: {
      configured:
        authUserStore === "supabase-auth" &&
        hasValue(supabaseUrl) &&
        hasValue(supabaseAnonKey) &&
        hasValue(supabaseServiceRoleKey) &&
        hasValue(dashboardAccessToken) &&
        hasValue(dashboardRefreshToken),
      userStore: authUserStore,
      userStoreSupabase: authUserStore === "supabase-auth",
      usernameConfigured: hasValue(dashboardUsername),
      passwordHashConfigured: hasValue(dashboardPasswordHash),
      passwordFallbackConfigured: hasValue(dashboardPassword),
      accessTokenConfigured: hasValue(dashboardAccessToken),
      refreshTokenConfigured: hasValue(dashboardRefreshToken),
      role: dashboardRole,
    },
    supabase: {
      configured: hasValue(supabaseUrl) && hasValue(supabaseAnonKey),
      urlConfigured: hasValue(supabaseUrl),
      anonKeyConfigured: hasValue(supabaseAnonKey),
      serviceRoleConfigured: hasValue(supabaseServiceRoleKey),
      projectHost: getProjectHost(supabaseUrl),
    },
    agentBridge: {
      configured: cliBridgeConfigured || httpBridgeConfigured,
      mode: cliBridgeConfigured ? "cli" : "http",
      cliConfigured: hasValue(openClawCliPath),
      agentConfigured: hasValue(openClawAgentId),
      sessionConfigured: hasValue(openClawSessionKey),
      gatewayConfigured: hasValue(openClawGatewayUrl),
      apiKeyConfigured: hasValue(openClawApiKey),
      profile: openClawProfile,
    },
    agentBridges,
    providers,
  };
}
