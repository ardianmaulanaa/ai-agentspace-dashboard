"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import type { ChangeEvent, ClipboardEvent, FormEvent, ReactNode } from "react";
import Image from "next/image";
import { AppHeaderShell } from "@/components/dashboard/AppHeaderShell";
import { RightNavbarShell } from "@/components/dashboard/RightNavbarShell";
import type { DashboardUser } from "@/lib/auth";
import type { ConfigStatus } from "@/lib/env";

type Accent = {
  from: string;
  to: string;
};

type AccentPair = [string, string];

type ChannelType = "text" | "forum" | "voice";

type Channel = {
  name: string;
  type: ChannelType;
};

type Category = {
  name: string;
  channels: Channel[];
};

type Workspace = {
  id: string;
  initials: string;
  name: string;
  accentIdx: number;
};

type ChatMessage = {
  id?: string;
  author: string;
  time: string;
  ai: boolean;
  text: string;
  image?: string;
  imageName?: string;
  imageMime?: string;
  replyTo?: string;
  reactions?: Record<string, number>;
  edited?: boolean;
  pinned?: boolean;
};

type ForumPost = {
  id: string;
  title: string;
  body: string;
  tag: string;
  status: string;
  replies: number;
  lastActivity: string;
};

type ForumReply = {
  author: string;
  body: string;
  time: string;
};

type ApiLog = {
  id: string;
  time: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  endpoint: string;
  status: number;
  label: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
};

type DashboardData = {
  ok: boolean;
  error?: string;
  workspaces?: Workspace[];
  categories?: Category[];
  activeWorkspaceId?: string | null;
  activeChannelId?: string | null;
  messages?: ChatMessage[];
  forumPosts?: ForumPost[];
  forumReplies?: Record<string, ForumReply[]>;
};

type CleanupCounts = {
  forum_replies?: number;
  forum_posts?: number;
  messages?: number;
};

type CleanupResult = {
  ok?: boolean;
  dryRun?: boolean;
  error?: string;
  confirmPhrase?: string;
  counts?: CleanupCounts;
  deleted?: CleanupCounts;
};

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: DashboardUser["role"];
  createdAt?: string | null;
  lastSignInAt?: string | null;
};

type AdminUsersResult = {
  ok?: boolean;
  users?: AdminUser[];
  user?: AdminUser;
  error?: string;
};

type AttachedImage = {
  src: string;
  name: string;
  mime: string;
};

type ModelPreference = {
  provider: string;
  tone: string;
  models: string[];
};

type Profile = {
  name: string;
  role: string;
  initials: string;
  accent: AccentPair;
  status: "online" | "dnd";
  crown?: boolean;
  app?: boolean;
};

type AgentName =
  | "MASBRE"
  | "MASBRO"
  | "MASSEH"
  | "GPT"
  | "CLAUDE"
  | "GEMINI"
  | "NVIDIA"
  | "QWEN"
  | "DEEPSEEK"
  | "GROK";
type AgentAccessLevel = "viewer" | "operator" | "admin";

const ACCENTS: Accent[] = [
  { from: "#14b8a6", to: "#0f766e" },
  { from: "#2dd4bf", to: "#115e59" },
  { from: "#5eead4", to: "#0f766e" },
  { from: "#99f6e4", to: "#14b8a6" },
];

const initialWorkspaces: Workspace[] = [
  { id: "agentspace", initials: "AS", name: "AgentSpace", accentIdx: 0 },
];

const initialCategories: Category[] = [
  {
    name: "Portfolio",
    channels: [
      { name: "ide-project", type: "text" },
      { name: "forum-review", type: "forum" },
      { name: "voice-room", type: "voice" },
    ],
  },
];

const initialMessages: ChatMessage[] = [
  {
    author: "Ardian",
    time: "19:52",
    ai: false,
    text: "Aku mau bikin dashboard AI yang mirip Discord, tapi MVP dulu: satu kategori, satu channel, dan satu forum.",
  },
  {
    author: "AgentSpace AI",
    time: "19:53",
    ai: true,
    text: "Bisa. Fokus awalnya: kategori Portfolio, channel #ide-project untuk chat AI, dan forum-review untuk menyimpan diskusi ide.",
  },
  {
    author: "Ardian",
    time: "19:55",
    ai: false,
    text: "Jadi jangan terlalu banyak fitur dulu, yang penting bentuk dashboard-nya jelas.",
  },
  {
    author: "AgentSpace AI",
    time: "19:56",
    ai: true,
    text: "Siap. Setelah layout ini stabil, baru kita tambah tombol create category, create channel, dan create forum secara bertahap.",
  },
];

const initialForumPosts: ForumPost[] = [
  {
    id: "ai-workspace-dashboard",
    title: "Ide Porto: AI Workspace Dashboard Mirip Discord",
    body: "Review konsep, fitur MVP, stack, dan roadmap supaya project portfolio-nya jelas dari awal.",
    tag: "Portfolio",
    status: "Ready for review",
    replies: 4,
    lastActivity: "today",
  },
];

const initialForumReplies: Record<string, ForumReply[]> = {
  "ai-workspace-dashboard": [
    {
      author: "MASBRE",
      body: "MVP paling aman: workspace, channel, chat, forum post, attachment, dan config panel dulu.",
      time: "today",
    },
    {
      author: "Ardian",
      body: "Nanti database bisa masuk setelah flow UI-nya enak dipakai.",
      time: "today",
    },
  ],
};

const profiles: Profile[] = [
  {
    name: "Ardian",
    role: "Owner",
    initials: "A",
    accent: ["#475569", "#1f2937"],
    status: "dnd",
    crown: true,
  },
  {
    name: "MASBRE",
    role: "AI lead assistant",
    initials: "MB",
    accent: ["#14b8a6", "#0f766e"],
    status: "online",
    app: true,
  },
  {
    name: "MASBRO",
    role: "AI support",
    initials: "MO",
    accent: ["#2dd4bf", "#115e59"],
    status: "online",
    app: true,
  },
  {
    name: "MASSEH",
    role: "AI reviewer",
    initials: "MS",
    accent: ["#5eead4", "#0f766e"],
    status: "online",
    app: true,
  },
  {
    name: "GPT",
    role: "OpenAI generalist",
    initials: "GP",
    accent: ["#14b8a6", "#134e4a"],
    status: "online",
    app: true,
  },
  {
    name: "CLAUDE",
    role: "Anthropic reasoning",
    initials: "CL",
    accent: ["#2dd4bf", "#0f766e"],
    status: "online",
    app: true,
  },
  {
    name: "GEMINI",
    role: "Google multimodal",
    initials: "GM",
    accent: ["#5eead4", "#115e59"],
    status: "online",
    app: true,
  },
  {
    name: "NVIDIA",
    role: "NVIDIA Nemotron",
    initials: "NV",
    accent: ["#76b900", "#14532d"],
    status: "online",
    app: true,
  },
  {
    name: "QWEN",
    role: "Alibaba coding",
    initials: "QW",
    accent: ["#14b8a6", "#0f766e"],
    status: "online",
    app: true,
  },
  {
    name: "DEEPSEEK",
    role: "DeepSeek reasoning",
    initials: "DS",
    accent: ["#2dd4bf", "#134e4a"],
    status: "online",
    app: true,
  },
  {
    name: "GROK",
    role: "xAI realtime style",
    initials: "GX",
    accent: ["#64748b", "#334155"],
    status: "online",
    app: true,
  },
];

const AGENT_OPTIONS: AgentName[] = [
  "MASBRE",
  "MASBRO",
  "MASSEH",
  "GPT",
  "CLAUDE",
  "GEMINI",
  "NVIDIA",
  "QWEN",
  "DEEPSEEK",
  "GROK",
];

const initialAgentAccess = AGENT_OPTIONS.reduce(
  (access, agent) => ({
    ...access,
    [agent]: agent === "MASBRE" ? "admin" : "operator",
  }),
  {} as Record<AgentName, AgentAccessLevel>,
);

const initialAgentTokens = AGENT_OPTIONS.reduce(
  (tokens, agent) => ({
    ...tokens,
    [agent]: `ags_${agent.toLowerCase()}_demo_token`,
  }),
  {} as Record<AgentName, string>,
);

const MODEL_PREFERENCES: ModelPreference[] = [
  {
    provider: "OpenAI",
    tone: "general, coding, multimodal",
    models: [
      "gpt-5",
      "gpt-5-mini",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4o",
      "gpt-4o-mini",
      "o3",
      "o4-mini",
    ],
  },
  {
    provider: "Anthropic / Claude",
    tone: "writing, reasoning, coding",
    models: [
      "claude-opus-4.1",
      "claude-opus-4",
      "claude-sonnet-4.5",
      "claude-sonnet-4",
      "claude-3.7-sonnet",
      "claude-3.5-sonnet",
      "claude-3.5-haiku",
      "claude-3-opus",
    ],
  },
  {
    provider: "NVIDIA NIM",
    tone: "GPU hosted open models",
    models: [
      "nvidia/llama-3.1-nemotron-ultra-253b-v1",
      "nvidia/llama-3.3-nemotron-super-49b-v1",
      "nvidia/llama-3.1-nemotron-70b-instruct",
      "nvidia/llama-3.1-nemotron-nano-8b-v1",
      "nvidia/nemotron-3-nano",
      "meta/llama-3.1-405b-instruct",
      "meta/llama-3.3-70b-instruct",
      "mistralai/mixtral-8x22b-instruct-v0.1",
      "deepseek-ai/deepseek-r1",
      "deepseek-ai/deepseek-r1-distill-qwen-32b",
    ],
  },
  {
    provider: "Qwen / Alibaba",
    tone: "coding, long context, reasoning",
    models: [
      "qwen/qwen3.6-35b-a3b",
      "qwen/qwen3.5-397b-a17b",
      "qwen/qwen3-next-80b-a3b-thinking",
      "qwen/qwen3-235b-a22b",
      "qwen/qwen3-32b",
      "qwen/qwen2.5-coder-32b-instruct",
      "qwen/qwq-32b",
      "qwen/qwen2.5-vl-72b-instruct",
    ],
  },
  {
    provider: "Google Gemini",
    tone: "multimodal, long context",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
  },
  {
    provider: "Meta Llama",
    tone: "open model ecosystem",
    models: [
      "llama-4-maverick",
      "llama-4-scout",
      "llama-3.3-70b-instruct",
      "llama-3.1-405b-instruct",
      "llama-3.1-70b-instruct",
      "llama-3.1-8b-instruct",
    ],
  },
  {
    provider: "Mistral",
    tone: "fast chat and coding",
    models: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "codestral-latest",
      "ministral-8b-latest",
      "mixtral-8x22b-instruct",
      "mixtral-8x7b-instruct",
    ],
  },
  {
    provider: "DeepSeek",
    tone: "reasoning and coding",
    models: [
      "deepseek-reasoner",
      "deepseek-chat",
      "deepseek-v3",
      "deepseek-r1",
      "deepseek-coder",
      "deepseek-ai/deepseek-v4-flash",
    ],
  },
  {
    provider: "xAI / Grok",
    tone: "chat and realtime style",
    models: ["grok-4", "grok-3", "grok-3-mini", "grok-2-vision"],
  },
  {
    provider: "Cohere",
    tone: "enterprise retrieval",
    models: [
      "command-a",
      "command-r-plus",
      "command-r",
      "c4ai-aya-expanse-32b",
    ],
  },
];

function Avatar({
  initials,
  accent,
  size = 40,
  online,
  dnd,
}: {
  initials: string;
  accent: AccentPair;
  size?: number;
  online?: boolean;
  dnd?: boolean;
}) {
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.3,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif",
          boxShadow: "none",
        }}
      >
        {initials}
      </div>
      {(online !== undefined || dnd !== undefined) && (
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: dnd ? "#f43f5e" : "#22c55e",
            border: "2px solid var(--bg-rail)",
          }}
        />
      )}
    </div>
  );
}

function NeonBadge({
  children,
  color = "#22d3ee",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: `${color}18`,
        color,
        border: `1px solid ${color}44`,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

const initialDeveloperTools = {
  "File tools": true,
  Terminal: true,
  Browser: true,
  GitHub: false,
  Memory: false,
};

type DeveloperTool = keyof typeof initialDeveloperTools;
type ThemeMode = "dark" | "light";
const ACTIVE_CHANNEL_STORAGE_KEY = "agentspace-active-channel";

function getSavedActiveChannel() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(ACTIVE_CHANNEL_STORAGE_KEY) || "";
}

function saveActiveChannel(channelName: string) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ACTIVE_CHANNEL_STORAGE_KEY, channelName);
}

const ENV_TEMPLATE = `NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_USER_STORE=supabase-auth
DASHBOARD_USERNAME=
DASHBOARD_DISPLAY_NAME=
DASHBOARD_ROLE=admin
DASHBOARD_JWT_SECRET=
DASHBOARD_PASSWORD_HASH=
DASHBOARD_PASSWORD=
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW_SECONDS=60
OPENCLAW_CLI_PATH=openclaw
OPENCLAW_PROFILE=masbre
OPENCLAW_AGENT_ID=main
OPENCLAW_SESSION_KEY=agent:main:dashboard
OPENCLAW_MASBRE_PROFILE=masbre
OPENCLAW_MASBRE_AGENT_ID=main
OPENCLAW_MASBRE_SESSION_KEY=agent:main:dashboard-masbre
OPENCLAW_MASBRO_PROFILE=masbro
OPENCLAW_MASBRO_AGENT_ID=main
OPENCLAW_MASBRO_SESSION_KEY=agent:main:dashboard-masbro
OPENCLAW_MASSEH_PROFILE=masseh
OPENCLAW_MASSEH_AGENT_ID=main
OPENCLAW_MASSEH_SESSION_KEY=agent:main:dashboard-masseh
OPENCLAW_GPT_PROFILE=gpt
OPENCLAW_GPT_AGENT_ID=main
OPENCLAW_GPT_SESSION_KEY=agent:main:dashboard-gpt
OPENCLAW_CLAUDE_PROFILE=claude
OPENCLAW_CLAUDE_AGENT_ID=main
OPENCLAW_CLAUDE_SESSION_KEY=agent:main:dashboard-claude
OPENCLAW_GEMINI_PROFILE=gemini
OPENCLAW_GEMINI_AGENT_ID=main
OPENCLAW_GEMINI_SESSION_KEY=agent:main:dashboard-gemini
OPENCLAW_NVIDIA_PROFILE=masbro
OPENCLAW_NVIDIA_AGENT_ID=main
OPENCLAW_NVIDIA_SESSION_KEY=agent:main:dashboard-nvidia
OPENCLAW_QWEN_PROFILE=qwen
OPENCLAW_QWEN_AGENT_ID=main
OPENCLAW_QWEN_SESSION_KEY=agent:main:dashboard-qwen
OPENCLAW_DEEPSEEK_PROFILE=deepseek
OPENCLAW_DEEPSEEK_AGENT_ID=main
OPENCLAW_DEEPSEEK_SESSION_KEY=agent:main:dashboard-deepseek
OPENCLAW_GROK_PROFILE=grok
OPENCLAW_GROK_AGENT_ID=main
OPENCLAW_GROK_SESSION_KEY=agent:main:dashboard-grok
OPENCLAW_AGENT_RESPONSE_MODE=cli
OPENCLAW_AGENT_TIMEOUT_SECONDS=120
OPENCLAW_GATEWAY_URL=
OPENCLAW_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
NVIDIA_API_KEY=
QWEN_API_KEY=
MISTRAL_API_KEY=
DEEPSEEK_API_KEY=
XAI_API_KEY=
COHERE_API_KEY=`;

const initialApiLogs: ApiLog[] = [
  {
    id: "boot-workspace",
    time: "07:15:00",
    method: "GET",
    endpoint: "/api/workspaces/agentspace",
    status: 200,
    label: "Load workspace",
    payload: { workspaceId: "agentspace" },
    response: { name: "AgentSpace", channels: 3, members: 4 },
  },
  {
    id: "boot-messages",
    time: "07:15:01",
    method: "GET",
    endpoint: "/api/channels/ide-project/messages",
    status: 200,
    label: "Load channel messages",
    payload: { channelId: "ide-project", limit: 50 },
    response: { count: initialMessages.length },
  },
];

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

export default function AgentSpaceDashboard() {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [activeWs, setActiveWs] = useState("agentspace");
  const [categories, setCategories] = useState(initialCategories);
  const [activeChannel, setActiveChannel] = useState("ide-project");
  const [messages, setMessages] = useState(initialMessages);
  const [forumPosts, setForumPosts] = useState(initialForumPosts);
  const [forumReplies, setForumReplies] = useState(initialForumReplies);
  const [draft, setDraft] = useState("");
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(
    null,
  );
  const [rightPanel, setRightPanel] = useState("profiles");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState<
    number | null
  >(null);
  const [currentSearchResult, setCurrentSearchResult] = useState(0);
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState("");
  const [selectedForumPostId, setSelectedForumPostId] = useState<string | null>(
    null,
  );
  const [forumReplyDraft, setForumReplyDraft] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [channelTopic, setChannelTopic] = useState(
    "Brainstorm ideas, MVP scope, and portfolio polish with the team.",
  );
  const [announcement, setAnnouncement] = useState(
    "Welcome to AgentSpace. Build in public, iterate fast.",
  );
  const [apiLogs, setApiLogs] = useState<ApiLog[]>(initialApiLogs);
  const [selectedApiLogId, setSelectedApiLogId] = useState(
    initialApiLogs[0].id,
  );
  const [isMobile, setIsMobile] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [newPostTag, setNewPostTag] = useState("Portfolio");
  const [newPostStatus, setNewPostStatus] = useState("Ready for review");
  const [newChannelType, setNewChannelType] = useState<ChannelType>("text");
  const [targetCategory, setTargetCategory] = useState(
    initialCategories[0].name,
  );
  const [developerTools, setDeveloperTools] = useState(initialDeveloperTools);
  const [agentAccess, setAgentAccess] = useState(initialAgentAccess);
  const [agentTokens, setAgentTokens] = useState(initialAgentTokens);
  const [selectedModel, setSelectedModel] = useState(
    MODEL_PREFERENCES[0].models[0],
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentName>("MASBRE");
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [configChecking, setConfigChecking] = useState(false);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(
    null,
  );
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState("");
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState("");
  const [pendingAgentReplies, setPendingAgentReplies] = useState(0);
  const [currentUser, setCurrentUser] = useState<DashboardUser>({
    username: "ardian",
    displayName: "Ardian",
    role: "admin",
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const channelSearchRef = useRef<HTMLInputElement | null>(null);
  const globalSearchRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const msgEndRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const activeChannelRef = useRef(activeChannel);
  const messageLoadSeqRef = useRef(0);
  const skipInitialActiveChannelSaveRef = useRef(true);
  const skipInitialThemeSaveRef = useRef(true);

  useEffect(() => {
    const savedChannel = getSavedActiveChannel();
    if (savedChannel && savedChannel !== activeChannelRef.current) {
      activeChannelRef.current = savedChannel;
      setActiveChannel(savedChannel);
    }

    const savedTheme = window.localStorage.getItem("agentspace-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeMode(savedTheme);
    }
  }, []);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
    if (skipInitialActiveChannelSaveRef.current) {
      skipInitialActiveChannelSaveRef.current = false;
      return;
    }

    saveActiveChannel(activeChannel);
  }, [activeChannel]);

  useEffect(() => {
    function syncViewport() {
      const nextIsMobile = window.innerWidth < 1180;
      setIsMobile(nextIsMobile);
      if (nextIsMobile) {
        setSidebarCollapsed(true);
        setRightPanelOpen(false);
      } else {
        setRightPanelOpen(false);
      }
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (skipInitialThemeSaveRef.current) {
      skipInitialThemeSaveRef.current = false;
      return;
    }

    window.localStorage.setItem("agentspace-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!ignore && data.user?.displayName) {
          setCurrentUser(data.user);
        }
      } catch {}
    }

    loadCurrentUser();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      try {
        const response = await fetch("/api/dashboard/data");
        const data = (await response.json()) as DashboardData;

        if (ignore) return;

        if (!response.ok || !data.ok) {
          logApiCall({
            method: "GET",
            endpoint: "/api/dashboard/data",
            status: response.status,
            label: "Load Supabase dashboard",
            payload: { source: "supabase" },
            response: {
              ok: false,
              error: data.error || "Failed to load dashboard data",
            },
          });
          return;
        }

        const nextWorkspaceId =
          data.activeWorkspaceId || data.workspaces?.[0]?.id || "agentspace";

        if (data.workspaces?.length) {
          setWorkspaces(data.workspaces);
          setActiveWs(nextWorkspaceId);
        }

        let nextActiveChannel =
          activeChannelRef.current || data.activeChannelId || "";

        if (data.categories?.length) {
          setCategories(data.categories);
          setTargetCategory(data.categories[0].name);
          const channels = data.categories.flatMap(
            (category) => category.channels,
          );
          const savedChannel =
            getSavedActiveChannel() || activeChannelRef.current;
          const savedChannelExists = channels.some(
            (channel) => channel.name === savedChannel,
          );
          const currentChannelExists = channels.some(
            (channel) => channel.name === activeChannelRef.current,
          );

          nextActiveChannel = currentChannelExists
            ? activeChannelRef.current
            : savedChannelExists
              ? savedChannel
              : data.activeChannelId || channels[0]?.name || "";

          if (
            nextActiveChannel &&
            activeChannelRef.current !== nextActiveChannel
          ) {
            activeChannelRef.current = nextActiveChannel;
            setActiveChannel(nextActiveChannel);
          }
        }

        const loadSeq = ++messageLoadSeqRef.current;

        if (nextActiveChannel && nextActiveChannel !== data.activeChannelId) {
          const params = new URLSearchParams({
            workspaceId: nextWorkspaceId,
            channelId: nextActiveChannel,
          });
          const messagesResponse = await fetch(
            `/api/messages?${params.toString()}`,
          );
          const messagesData = await messagesResponse.json();
          if (
            !ignore &&
            activeChannelRef.current === nextActiveChannel &&
            loadSeq === messageLoadSeqRef.current
          ) {
            setMessages(messagesData.messages || []);
          }
        } else {
          if (
            !ignore &&
            (!nextActiveChannel ||
              activeChannelRef.current === nextActiveChannel) &&
            loadSeq === messageLoadSeqRef.current
          ) {
            setMessages(data.messages || []);
          }
        }

        setForumPosts(data.forumPosts || []);
        setForumReplies(data.forumReplies || {});
        setSelectedForumPostId(data.forumPosts?.[0]?.id || null);

        logApiCall({
          method: "GET",
          endpoint: "/api/dashboard/data",
          status: response.status,
          label: "Load Supabase dashboard",
          payload: { source: "supabase" },
          response: {
            workspaces: data.workspaces?.length || 0,
            categories: data.categories?.length || 0,
            messages: data.messages?.length || 0,
            forumPosts: data.forumPosts?.length || 0,
          },
        });
      } catch (error) {
        if (!ignore) {
          logApiCall({
            method: "GET",
            endpoint: "/api/dashboard/data",
            status: 500,
            label: "Load Supabase dashboard",
            payload: { source: "supabase" },
            response: {
              ok: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      }
    }

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (highlightedMessageIndex === null) return;

    const timeout = window.setTimeout(() => {
      setHighlightedMessageIndex(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [highlightedMessageIndex]);

  useEffect(() => {
    if (globalSearchOpen) {
      globalSearchRef.current?.focus();
      globalSearchRef.current?.select();
    }
  }, [globalSearchOpen]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setGlobalSearchOpen(true);
      }

      if (event.key === "Escape") {
        setGlobalSearchOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const isForum =
    categories.flatMap((c) => c.channels).find((c) => c.name === activeChannel)
      ?.type === "forum";
  const isVoice =
    categories.flatMap((c) => c.channels).find((c) => c.name === activeChannel)
      ?.type === "voice";
  const isAgentChannel = !isForum && !isVoice;
  const agentInvoking = pendingAgentReplies > 0;
  const forumChannelName =
    categories.flatMap((c) => c.channels).find((c) => c.type === "forum")
      ?.name || "forum";
  const selectedForumPost = forumPosts.find(
    (post) => post.id === selectedForumPostId,
  );
  const selectedApiLog =
    apiLogs.find((log) => log.id === selectedApiLogId) || apiLogs[0];
  const pinnedMessages = messages
    .map((message, index) => ({ ...message, index }))
    .filter((message) => message.pinned);
  const normalizedChannelSearch = channelSearch.trim().toLowerCase();
  const filteredCategories = categories
    .map((category) => {
      const categoryMatch = category.name
        .toLowerCase()
        .includes(normalizedChannelSearch);
      return {
        ...category,
        channels: normalizedChannelSearch
          ? category.channels.filter(
              (channel) =>
                categoryMatch ||
                channel.name.toLowerCase().includes(normalizedChannelSearch) ||
                channel.type.includes(normalizedChannelSearch as ChannelType),
            )
          : category.channels,
      };
    })
    .filter(
      (category) =>
        !normalizedChannelSearch ||
        category.name.toLowerCase().includes(normalizedChannelSearch) ||
        category.channels.length > 0,
    );
  const chatSearchQuery = globalSearchQuery.trim().toLowerCase();
  function getChatSearchResults(searchValue: string) {
    const query = searchValue.trim().toLowerCase();
    return query
      ? messages
          .map((message, index) => ({ ...message, index }))
          .filter(
            (message) =>
              message.text.toLowerCase().includes(query) ||
              message.author.toLowerCase().includes(query) ||
              message.imageName?.toLowerCase().includes(query),
          )
      : [];
  }

  const chatSearchResults = getChatSearchResults(globalSearchQuery);

  function openRightPanel(panel: string) {
    setRightPanel(panel);
    setSidebarCollapsed(true);
    setRightPanelOpen(true);
  }

  function updateAgentAccess(agent: AgentName, access: AgentAccessLevel) {
    setAgentAccess((current) => ({
      ...current,
      [agent]: access,
    }));
  }

  function regenerateAgentToken(agent: AgentName) {
    const randomPart =
      globalThis.crypto?.randomUUID?.().replaceAll("-", "").slice(0, 18) ||
      Math.random().toString(36).slice(2, 20);

    setAgentTokens((current) => ({
      ...current,
      [agent]: `ags_${agent.toLowerCase()}_${randomPart}`,
    }));
  }

  function logApiCall(log: Omit<ApiLog, "id" | "time">) {
    const now = new Date();
    const id = `${log.method}-${log.endpoint}-${now.getTime()}`;
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    const nextLog = { ...log, id, time };

    setApiLogs((current) => [nextLog, ...current].slice(0, 40));
    setSelectedApiLogId(id);
  }

  async function checkConfigStatus() {
    setConfigChecking(true);

    try {
      const response = await fetch("/api/config/status");
      const data = await response.json();
      setConfigStatus(data);
      logApiCall({
        method: "GET",
        endpoint: "/api/config/status",
        status: response.status,
        label: "Check env status",
        payload: { safe: true, revealSecrets: false },
        response: {
          supabaseConfigured: data.supabase?.configured ?? false,
          projectHost: data.supabase?.projectHost ?? null,
          providersReady: Array.isArray(data.providers)
            ? data.providers.filter(
                (provider: { configured: boolean }) => provider.configured,
              ).length
            : 0,
          agentBridgeReady: data.agentBridge?.configured ?? false,
        },
      });
    } catch (error) {
      logApiCall({
        method: "GET",
        endpoint: "/api/config/status",
        status: 500,
        label: "Check env status",
        payload: { safe: true },
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } finally {
      setConfigChecking(false);
    }
  }

  async function loadAdminUsers() {
    setAdminUsersLoading(true);
    setAdminUsersError("");

    try {
      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as AdminUsersResult;

      if (!response.ok || !data.ok) {
        const message = data.error || "Failed to load users.";
        setAdminUsersError(message);
        logApiCall({
          method: "GET",
          endpoint: "/api/admin/users",
          status: response.status,
          label: "Load admin users",
          payload: { roleRequired: "admin" },
          response: { ok: false, error: message },
        });
        return;
      }

      setAdminUsers(data.users || []);
      logApiCall({
        method: "GET",
        endpoint: "/api/admin/users",
        status: response.status,
        label: "Load admin users",
        payload: { roleRequired: "admin" },
        response: { users: data.users?.length || 0 },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setAdminUsersError(message);
      logApiCall({
        method: "GET",
        endpoint: "/api/admin/users",
        status: 500,
        label: "Load admin users",
        payload: { roleRequired: "admin" },
        response: { ok: false, error: message },
      });
    } finally {
      setAdminUsersLoading(false);
    }
  }

  async function updateAdminUserRole(userId: string, role: AdminUser["role"]) {
    setUpdatingRoleUserId(userId);
    setAdminUsersError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = (await response.json()) as AdminUsersResult;

      if (!response.ok || !data.ok || !data.user) {
        const message = data.error || "Failed to update user role.";
        setAdminUsersError(message);
        logApiCall({
          method: "PATCH",
          endpoint: "/api/admin/users",
          status: response.status,
          label: "Update user role",
          payload: { userId, role },
          response: { ok: false, error: message },
        });
        return;
      }

      setAdminUsers((current) =>
        current.map((user) =>
          user.id === userId ? (data.user as AdminUser) : user,
        ),
      );
      logApiCall({
        method: "PATCH",
        endpoint: "/api/admin/users",
        status: response.status,
        label: "Update user role",
        payload: { userId, role },
        response: { user: data.user.email, role: data.user.role },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setAdminUsersError(message);
      logApiCall({
        method: "PATCH",
        endpoint: "/api/admin/users",
        status: 500,
        label: "Update user role",
        payload: { userId, role },
        response: { ok: false, error: message },
      });
    } finally {
      setUpdatingRoleUserId("");
    }
  }

  async function runDatabaseCleanup(dryRun: boolean) {
    const confirmPhrase = "BERSIHKAN DATABASE";
    let confirm = "";

    if (!dryRun) {
      const totalRows =
        (cleanupResult?.counts?.messages || 0) +
        (cleanupResult?.counts?.forum_posts || 0) +
        (cleanupResult?.counts?.forum_replies || 0);

      confirm =
        window
          .prompt(
            `Ini akan menghapus ${totalRows} chat/forum item. Ketik ${confirmPhrase} untuk lanjut.`,
            "",
          )
          ?.trim() || "";

      if (confirm !== confirmPhrase) {
        return;
      }
    }

    setCleanupRunning(true);

    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, confirm }),
      });
      const data = (await response.json()) as CleanupResult;

      setCleanupResult(data);

      if (!dryRun && response.ok && data.ok) {
        setMessages([]);
        setForumPosts([]);
        setForumReplies({});
        setSelectedForumPostId(null);
      }

      logApiCall({
        method: "POST",
        endpoint: "/api/admin/cleanup",
        status: response.status,
        label: dryRun ? "Preview database cleanup" : "Run database cleanup",
        payload: { dryRun, scope: "chat-and-forum-content" },
        response: data as Record<string, unknown>,
      });
    } catch (error) {
      const responsePayload = {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setCleanupResult(responsePayload);
      logApiCall({
        method: "POST",
        endpoint: "/api/admin/cleanup",
        status: 500,
        label: dryRun ? "Preview database cleanup" : "Run database cleanup",
        payload: { dryRun, scope: "chat-and-forum-content" },
        response: responsePayload,
      });
    } finally {
      setCleanupRunning(false);
    }
  }

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim() && !attachedImage) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const tempId = `temp-${now.getTime()}`;
    const messagePayload = {
      workspaceId: activeWs,
      channelId: activeChannel,
      content: draft.trim(),
      attachmentData: attachedImage?.src || null,
      attachmentName: attachedImage?.name || null,
      attachmentMime: attachedImage?.mime || null,
      replyTo: replyingTo?.author || null,
    };
    setMessages((m) => [
      ...m,
      {
        id: tempId,
        author: currentUser.displayName,
        time,
        ai: false,
        text: draft.trim(),
        image: attachedImage?.src,
        imageName: attachedImage?.name,
        imageMime: attachedImage?.mime,
        replyTo: replyingTo
          ? `${replyingTo.author}: ${replyingTo.text || replyingTo.imageName || "Attachment"}`
          : undefined,
      },
    ]);
    setDraft("");
    setAttachedImage(null);
    setReplyingTo(null);
    window.requestAnimationFrame(() => messageInputRef.current?.focus());

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessages((current) =>
          current.filter((message) => message.id !== tempId),
        );
        setDraft(messagePayload.content);
        throw new Error(data.error || "Message failed to save");
      }

      if (data.message) {
        setMessages((current) =>
          current.map((message) =>
            message.id === tempId ? data.message : message,
          ),
        );
      }

      logApiCall({
        method: "POST",
        endpoint: "/api/messages",
        status: response.status,
        label: "Send message",
        payload: messagePayload,
        response: data,
      });

      if (isAgentChannel && messagePayload.content) {
        void invokeAgentReply(messagePayload);
      }
    } catch (error) {
      setMessages((current) =>
        current.filter((message) => message.id !== tempId),
      );
      logApiCall({
        method: "POST",
        endpoint: "/api/messages",
        status: 500,
        label: "Send message",
        payload: messagePayload,
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  async function invokeAgentReply(messagePayload: {
    workspaceId: string;
    channelId: string;
    content: string;
  }) {
    const now = new Date();
    const tempId = `agent-temp-${now.getTime()}`;
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const invokePayload = {
      workspaceId: messagePayload.workspaceId,
      channelId: messagePayload.channelId,
      message: messagePayload.content,
      agent: selectedAgent,
    };

    setPendingAgentReplies((current) => current + 1);
    if (activeChannelRef.current === messagePayload.channelId) {
      setMessages((current) => [
        ...current,
        {
          id: tempId,
          author: selectedAgent,
          time,
          ai: true,
          text: `${selectedAgent} sedang mengetik...`,
        },
      ]);
    }

    try {
      const response = await fetch("/api/agents/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invokePayload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OpenClaw invoke failed");
      }

      const agentMessage = data.message || {
        id: `agent-${Date.now()}`,
        author: data.agent || selectedAgent,
        time,
        ai: true,
        text: data.reply || "OpenClaw selesai, tapi tidak ada balasan teks.",
      };

      if (activeChannelRef.current === messagePayload.channelId) {
        setMessages((current) =>
          current.map((message) =>
            message.id === tempId ? agentMessage : message,
          ),
        );
      }

      logApiCall({
        method: "POST",
        endpoint: "/api/agents/invoke",
        status: response.status,
        label: "Invoke OpenClaw agent",
        payload: invokePayload,
        response: {
          ok: data.ok,
          mode: data.mode,
          persisted: data.persisted,
          agent: data.agent,
          openClawAgentId: data.openClawAgentId,
          model: data.meta?.model,
        },
      });
    } catch (error) {
      if (activeChannelRef.current === messagePayload.channelId) {
        setMessages((current) =>
          current.map((message) =>
            message.id === tempId
              ? {
                  ...message,
                  text: "Maaf mas, agent OpenClaw belum bisa dipanggil sekarang. Cek konfigurasi agent atau coba lagi nanti.",
                }
              : message,
          ),
        );
      }

      logApiCall({
        method: "POST",
        endpoint: "/api/agents/invoke",
        status: 500,
        label: "Invoke OpenClaw agent",
        payload: invokePayload,
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } finally {
      setPendingAgentReplies((current) => Math.max(0, current - 1));
    }
  }

  function addWorkspace(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const workspaceName = newWorkspaceName.trim();
    if (!workspaceName) return;

    const baseId =
      workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `workspace-${workspaces.length + 1}`;
    let workspaceId = baseId;
    let counter = 2;

    while (workspaces.some((ws) => ws.id === workspaceId)) {
      workspaceId = `${baseId}-${counter}`;
      counter += 1;
    }

    const initials = workspaceName
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const workspace: Workspace = {
      id: workspaceId,
      initials: initials || "WS",
      name: workspaceName,
      accentIdx: workspaces.length % ACCENTS.length,
    };

    setWorkspaces((current) => [...current, workspace]);
    setActiveWs(workspace.id);
    setNewWorkspaceName("");
    setShowWorkspaceForm(false);
    logApiCall({
      method: "POST",
      endpoint: "/api/workspaces",
      status: 201,
      label: "Create workspace",
      payload: { name: workspace.name, initials: workspace.initials },
      response: { id: workspace.id, created: true },
    });
  }

  function deleteWorkspace(workspaceId: string) {
    if (workspaces.length <= 1) {
      window.alert("Minimal harus ada 1 workspace.");
      return;
    }

    const workspace = workspaces.find((ws) => ws.id === workspaceId);
    if (!workspace) return;

    const shouldDelete = window.confirm(`Hapus workspace "${workspace.name}"?`);
    if (!shouldDelete) return;

    const workspaceIndex = workspaces.findIndex((ws) => ws.id === workspaceId);
    const nextWorkspaces = workspaces.filter((ws) => ws.id !== workspaceId);
    const nextActiveWorkspace =
      nextWorkspaces[Math.min(workspaceIndex, nextWorkspaces.length - 1)] ||
      nextWorkspaces[0];

    setWorkspaces(nextWorkspaces);
    if (activeWs === workspaceId) {
      setActiveWs(nextActiveWorkspace.id);
    }
    setShowWorkspaceForm(false);
    logApiCall({
      method: "DELETE",
      endpoint: `/api/workspaces/${workspaceId}`,
      status: 204,
      label: "Delete workspace",
      payload: { workspaceId },
      response: { deleted: true },
    });
  }

  async function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const categoryName = newCategoryName.trim();
    if (!categoryName) return;

    setCategories((current) => [
      ...current,
      { name: categoryName, channels: [] },
    ]);
    setTargetCategory(categoryName);
    setNewCategoryName("");
    setShowCategoryForm(false);

    const payload = { workspaceId: activeWs, name: categoryName };

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      logApiCall({
        method: "POST",
        endpoint: "/api/categories",
        status: response.status,
        label: "Create category",
        payload,
        response: data,
      });
    } catch (error) {
      logApiCall({
        method: "POST",
        endpoint: "/api/categories",
        status: 500,
        label: "Create category",
        payload,
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  function openChannelForm(categoryName: string) {
    setTargetCategory(categoryName);
    setShowChannelForm(true);
    setShowCategoryForm(false);
  }

  async function addChannel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const channelName = newChannelName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!channelName || !targetCategory) return;

    setCategories((current) =>
      current.map((category) =>
        category.name === targetCategory
          ? {
              ...category,
              channels: [
                ...category.channels,
                { name: channelName, type: newChannelType },
              ],
            }
          : category,
      ),
    );
    setActiveChannel(channelName);
    saveActiveChannel(channelName);
    setSelectedForumPostId(null);
    setReplyingTo(null);
    setEditingMessageIndex(null);
    setNewChannelName("");
    setNewChannelType("text");
    setShowChannelForm(false);

    const payload = {
      workspaceId: activeWs,
      category: targetCategory,
      name: channelName,
      type: newChannelType,
    };

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      logApiCall({
        method: "POST",
        endpoint: "/api/channels",
        status: response.status,
        label: "Create channel",
        payload,
        response: data,
      });
    } catch (error) {
      logApiCall({
        method: "POST",
        endpoint: "/api/channels",
        status: 500,
        label: "Create channel",
        payload,
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  async function addForumPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newPostTitle.trim();
    const body = newPostBody.trim();
    const tag = newPostTag.trim() || "General";
    const status = newPostStatus.trim() || "Ready for review";

    if (!title || !body) return;

    const idBase =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `post-${forumPosts.length + 1}`;
    let postId = idBase;
    let counter = 2;

    while (forumPosts.some((post) => post.id === postId)) {
      postId = `${idBase}-${counter}`;
      counter += 1;
    }

    setForumPosts((current) => [
      {
        id: postId,
        title,
        body,
        tag,
        status,
        replies: 0,
        lastActivity: "just now",
      },
      ...current,
    ]);
    setForumReplies((current) => ({ ...current, [postId]: [] }));
    setNewPostTitle("");
    setNewPostBody("");
    setNewPostTag("Portfolio");
    setNewPostStatus("Ready for review");
    setShowPostForm(false);
    setSelectedForumPostId(postId);

    const payload = {
      workspaceId: activeWs,
      channelId: activeChannel,
      title,
      body,
      tag,
      status,
    };

    try {
      const response = await fetch("/api/forum-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.post) {
        setForumPosts((current) =>
          current.map((post) => (post.id === postId ? data.post : post)),
        );
        setForumReplies((current) => {
          const { [postId]: tempReplies, ...rest } = current;
          return { ...rest, [data.post.id]: tempReplies || [] };
        });
        setSelectedForumPostId(data.post.id);
      }

      logApiCall({
        method: "POST",
        endpoint: "/api/forum-posts",
        status: response.status,
        label: "Create forum post",
        payload,
        response: data,
      });
    } catch (error) {
      logApiCall({
        method: "POST",
        endpoint: "/api/forum-posts",
        status: 500,
        label: "Create forum post",
        payload,
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  async function addForumReply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedForumPost || !forumReplyDraft.trim()) return;
    const replyText = forumReplyDraft.trim();

    setForumReplies((current) => ({
      ...current,
      [selectedForumPost.id]: [
        ...(current[selectedForumPost.id] || []),
        { author: currentUser.displayName, body: replyText, time: "just now" },
      ],
    }));
    setForumPosts((current) =>
      current.map((post) =>
        post.id === selectedForumPost.id
          ? { ...post, replies: post.replies + 1, lastActivity: "just now" }
          : post,
      ),
    );
    setForumReplyDraft("");
    const payload = { postId: selectedForumPost.id, body: replyText };

    try {
      const response = await fetch(
        `/api/forum-posts/${selectedForumPost.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: replyText }),
        },
      );
      const data = await response.json();

      logApiCall({
        method: "POST",
        endpoint: `/api/forum-posts/${selectedForumPost.id}/replies`,
        status: response.status,
        label: "Reply forum post",
        payload,
        response: data,
      });
    } catch (error) {
      logApiCall({
        method: "POST",
        endpoint: `/api/forum-posts/${selectedForumPost.id}/replies`,
        status: 500,
        label: "Reply forum post",
        payload,
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  async function toggleReaction(messageIndex: number, emoji: string) {
    const targetMessage = messages[messageIndex];
    const nextReactions = { ...(targetMessage?.reactions || {}) };
    nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;

    setMessages((current) =>
      current.map((message, index) => {
        if (index !== messageIndex) return message;
        return { ...message, reactions: nextReactions };
      }),
    );

    let status = targetMessage?.id ? 200 : 201;
    let responsePayload: Record<string, unknown> = {
      ok: true,
      persisted: targetMessage?.id ? "supabase" : "local",
    };

    if (targetMessage?.id) {
      try {
        const response = await fetch(`/api/messages/${targetMessage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reactions: nextReactions }),
        });
        responsePayload = await response.json();
        status = response.status;
      } catch (error) {
        status = 500;
        responsePayload = {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    logApiCall({
      method: "POST",
      endpoint: targetMessage?.id
        ? `/api/messages/${targetMessage.id}`
        : `/api/messages/${messageIndex}/reactions`,
      status,
      label: "Add reaction",
      payload: { messageIndex, emoji },
      response: responsePayload,
    });
  }

  async function togglePin(messageIndex: number) {
    const targetMessage = messages[messageIndex];
    const nextPinned = !targetMessage?.pinned;

    setMessages((current) =>
      current.map((message, index) =>
        index === messageIndex ? { ...message, pinned: nextPinned } : message,
      ),
    );
    setRightPanel("pins");

    let status = targetMessage?.id ? 200 : 200;
    let responsePayload: Record<string, unknown> = {
      ok: true,
      persisted: targetMessage?.id ? "supabase" : "local",
    };

    if (targetMessage?.id) {
      try {
        const response = await fetch(`/api/messages/${targetMessage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinned: nextPinned }),
        });
        responsePayload = await response.json();
        status = response.status;
      } catch (error) {
        status = 500;
        responsePayload = {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    logApiCall({
      method: "PATCH",
      endpoint: targetMessage?.id
        ? `/api/messages/${targetMessage.id}`
        : `/api/messages/${messageIndex}`,
      status,
      label: "Toggle pin",
      payload: { messageIndex, pinned: nextPinned },
      response: responsePayload,
    });
  }

  function startEditMessage(messageIndex: number) {
    setEditingMessageIndex(messageIndex);
    setEditDraft(messages[messageIndex]?.text || "");
  }

  async function saveEditMessage(messageIndex: number) {
    const nextText = editDraft.trim();
    if (!nextText) return;
    const targetMessage = messages[messageIndex];

    setMessages((current) =>
      current.map((message, index) =>
        index === messageIndex
          ? { ...message, text: nextText, edited: true }
          : message,
      ),
    );
    setEditingMessageIndex(null);
    setEditDraft("");

    let status = targetMessage?.id ? 200 : 200;
    let responsePayload: Record<string, unknown> = {
      edited: true,
      persisted: targetMessage?.id ? "supabase" : "local",
    };

    if (targetMessage?.id) {
      try {
        const response = await fetch(`/api/messages/${targetMessage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: nextText }),
        });
        responsePayload = await response.json();
        status = response.status;
      } catch (error) {
        status = 500;
        responsePayload = {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    logApiCall({
      method: "PATCH",
      endpoint: targetMessage?.id
        ? `/api/messages/${targetMessage.id}`
        : `/api/messages/${messageIndex}`,
      status,
      label: "Edit message",
      payload: { messageIndex, content: nextText },
      response: responsePayload,
    });
  }

  async function deleteMessage(messageIndex: number) {
    const shouldDelete = window.confirm("Hapus message ini?");
    if (!shouldDelete) return;
    const targetMessage = messages[messageIndex];

    setMessages((current) =>
      current.filter((_, index) => index !== messageIndex),
    );

    let status = targetMessage?.id ? 200 : 204;
    let responsePayload: Record<string, unknown> = {
      deleted: true,
      persisted: targetMessage?.id ? "supabase" : "local",
    };

    if (targetMessage?.id) {
      try {
        const response = await fetch(`/api/messages/${targetMessage.id}`, {
          method: "DELETE",
        });
        responsePayload = await response.json();
        status = response.status;
      } catch (error) {
        status = 500;
        responsePayload = {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    logApiCall({
      method: "DELETE",
      endpoint: targetMessage?.id
        ? `/api/messages/${targetMessage.id}`
        : `/api/messages/${messageIndex}`,
      status,
      label: "Delete message",
      payload: { messageIndex, mode: targetMessage?.id ? "supabase" : "local" },
      response: responsePayload,
    });
  }

  function prepareAttachment(file: File, source: "picker" | "clipboard") {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const mime = file.type || "application/octet-stream";
        const name =
          file.name ||
          `pasted-image-${Date.now()}.${mime.split("/")[1] || "png"}`;
        setAttachedImage({ src: reader.result, name, mime });
        logApiCall({
          method: "POST",
          endpoint: "/api/attachments/presign",
          status: 200,
          label: "Prepare attachment",
          payload: { fileName: name, mime, size: file.size, source },
          response: { uploadMode: "browser-preview", storageProvider: "demo" },
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function attachImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    prepareAttachment(file, "picker");
    e.target.value = "";
  }

  function pasteAttachment(e: ClipboardEvent<HTMLInputElement>) {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    const file = imageItem?.getAsFile();

    if (!file) return;

    e.preventDefault();
    prepareAttachment(file, "clipboard");
  }

  function toggleDeveloperTool(tool: DeveloperTool) {
    setDeveloperTools((current) => ({
      ...current,
      [tool]: !current[tool],
    }));
  }

  async function loadChannelMessages(channelName: string) {
    const loadSeq = ++messageLoadSeqRef.current;

    try {
      const params = new URLSearchParams({
        workspaceId: activeWs,
        channelId: channelName,
      });
      const response = await fetch(`/api/messages?${params.toString()}`);
      const data = await response.json();

      if (
        data.messages &&
        activeChannelRef.current === channelName &&
        loadSeq === messageLoadSeqRef.current
      ) {
        setMessages(data.messages);
      }

      logApiCall({
        method: "GET",
        endpoint: "/api/messages",
        status: response.status,
        label: "Load channel messages",
        payload: { workspaceId: activeWs, channelId: channelName },
        response: {
          ok: data.ok,
          count: Array.isArray(data.messages) ? data.messages.length : 0,
          error: data.error,
        },
      });
    } catch (error) {
      logApiCall({
        method: "GET",
        endpoint: "/api/messages",
        status: 500,
        label: "Load channel messages",
        payload: { workspaceId: activeWs, channelId: channelName },
        response: {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  function selectChannel(channelName: string) {
    activeChannelRef.current = channelName;
    setActiveChannel(channelName);
    saveActiveChannel(channelName);
    setGlobalSearchOpen(false);
    setGlobalSearchQuery("");
    setSelectedForumPostId(null);
    setReplyingTo(null);
    setEditingMessageIndex(null);
    void loadChannelMessages(channelName);
  }

  function openMessageResult(index: number) {
    setHighlightedMessageIndex(index);
    window.setTimeout(() => {
      messageRefs.current[index]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }

  function moveChatSearch(direction: 1 | -1) {
    if (chatSearchResults.length === 0) return;

    const next =
      (currentSearchResult + direction + chatSearchResults.length) %
      chatSearchResults.length;
    const result = chatSearchResults[next];
    setCurrentSearchResult(next);
    if (result) openMessageResult(result.index);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/";
  }

  function toggleThemeMode() {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"));
  }

  function renderHighlightedText(text: string) {
    if (!chatSearchQuery) return text;

    const lowerText = text.toLowerCase();
    const parts: ReactNode[] = [];
    let currentIndex = 0;
    let matchIndex = lowerText.indexOf(chatSearchQuery);

    while (matchIndex !== -1) {
      if (matchIndex > currentIndex) {
        parts.push(text.slice(currentIndex, matchIndex));
      }

      parts.push(
        <mark
          key={`${matchIndex}-${chatSearchQuery}`}
          style={{
            background: `${accent.from}35`,
            color: "var(--text-main)",
            borderRadius: 4,
            padding: "0 2px",
          }}
        >
          {text.slice(matchIndex, matchIndex + chatSearchQuery.length)}
        </mark>,
      );

      currentIndex = matchIndex + chatSearchQuery.length;
      matchIndex = lowerText.indexOf(chatSearchQuery, currentIndex);
    }

    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }

    return parts;
  }

  function renderInlineFormattedText(text: string, keyPrefix: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
      if (!part) return null;

      const isBold = part.startsWith("**") && part.endsWith("**");
      const content = isBold ? part.slice(2, -2) : part;
      const renderedContent = renderHighlightedText(content);

      if (isBold) {
        return (
          <strong
            key={`${keyPrefix}-bold-${index}`}
            style={{ fontWeight: 900, color: "var(--text-main)" }}
          >
            {renderedContent}
          </strong>
        );
      }

      return (
        <Fragment key={`${keyPrefix}-text-${index}`}>
          {renderedContent}
        </Fragment>
      );
    });
  }

  function renderFormattedMessageText(text: string) {
    return text
      .trimEnd()
      .split(/\n{2,}/)
      .map((block, blockIndex) => {
        const lines = block
          .split("\n")
          .map((line) => line.trimEnd())
          .filter(Boolean);

        if (lines.length === 0) return null;

        const isBulletList = lines.every((line) => /^\s*[-*]\s+/.test(line));

        if (isBulletList) {
          return (
            <ul
              key={`message-list-${blockIndex}`}
              style={{
                margin: blockIndex === 0 ? "0 0 8px 0" : "8px 0",
                paddingLeft: 18,
              }}
            >
              {lines.map((line, lineIndex) => (
                <li
                  key={`message-list-${blockIndex}-${lineIndex}`}
                  style={{ margin: "4px 0" }}
                >
                  {renderInlineFormattedText(
                    line.replace(/^\s*[-*]\s+/, ""),
                    `message-list-${blockIndex}-${lineIndex}`,
                  )}
                </li>
              ))}
            </ul>
          );
        }

        return lines.map((line, lineIndex) => (
          <p
            key={`message-paragraph-${blockIndex}-${lineIndex}`}
            style={{
              margin: blockIndex === 0 && lineIndex === 0 ? 0 : "8px 0 0",
            }}
          >
            {renderInlineFormattedText(
              line,
              `message-paragraph-${blockIndex}-${lineIndex}`,
            )}
          </p>
        ));
      });
  }

  const activeWsData =
    workspaces.find((w) => w.id === activeWs) || workspaces[0];
  const accent = ACCENTS[activeWsData.accentIdx];
  const isLightTheme = themeMode === "light";
  const currentUserInitials = getInitials(currentUser.displayName);
  const visibleProfiles = profiles.map((profile) =>
    profile.crown
      ? {
          ...profile,
          name: currentUser.displayName,
          initials: currentUserInitials,
        }
      : profile,
  );
  const selectedModelPreference =
    MODEL_PREFERENCES.find((group) => group.models.includes(selectedModel)) ||
    MODEL_PREFERENCES[0];
  const selectedAgentProfile = visibleProfiles.find(
    (profile) => profile.name === selectedAgent,
  );
  const selectedAgentStatus = configStatus?.agentBridges.find(
    (agent) => agent.label === selectedAgent,
  );

  return (
    <div
      className={`agentspace-shell theme-${themeMode}`}
      style={{
        display: "flex",
        width: "100vw",
        height: "100dvh",
        background: "var(--bg-app)",
        color: "var(--text-main)",
        fontFamily: "'Space Grotesk', sans-serif",
        overflow: "hidden",
        position: "relative",
        transition: "background 0.22s ease, color 0.22s ease",
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: isLightTheme ? 0.46 : 1,
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "linear-gradient(to bottom, black, transparent 82%)",
        }}
      />
      <AppHeaderShell
        isMobile={isMobile}
        isOpen={!sidebarCollapsed}
        onClose={() => setSidebarCollapsed(true)}
        rail={
          <>
            <div
              style={{
                width: isMobile ? 46 : 46,
                height: isMobile ? 46 : 46,
                borderRadius: 15,
                marginBottom: 6,
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <div
              style={{
                width: 32,
                height: 1,
                background: "var(--border-subtle)",
              }}
            />

            {workspaces.map((ws) => {
              const wAccent = ACCENTS[ws.accentIdx];
              const isActive = ws.id === activeWs;
              return (
                <div
                  key={ws.id}
                  style={{
                    position: "relative",
                    width: isMobile ? 44 : 44,
                    height: isMobile ? 44 : 44,
                  }}
                >
                  <button
                    onClick={() => setActiveWs(ws.id)}
                    title={ws.name}
                    style={{
                      width: isMobile ? 44 : 44,
                      height: isMobile ? 44 : 44,
                      borderRadius: isActive ? 14 : 20,
                      background: isActive
                        ? `linear-gradient(135deg, ${wAccent.from}, ${wAccent.to})`
                        : "var(--bg-btn-ghost)",
                      border: isActive
                        ? "none"
                        : "1px solid var(--border-subtle)",
                      color: isActive ? "white" : "var(--text-muted)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      boxShadow: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderRadius = "14px";
                        e.currentTarget.style.background =
                          "var(--bg-btn-ghost-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderRadius = "20px";
                        e.currentTarget.style.background =
                          "var(--bg-btn-ghost)";
                      }
                    }}
                  >
                    {ws.initials}
                  </button>
                  <button
                    title={
                      workspaces.length > 1
                        ? `Hapus ${ws.name}`
                        : "Minimal harus ada 1 workspace"
                    }
                    aria-label={
                      workspaces.length > 1
                        ? `Hapus ${ws.name}`
                        : "Minimal harus ada 1 workspace"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkspace(ws.id);
                    }}
                    style={{
                      position: "absolute",
                      right: -6,
                      top: -6,
                      width: 19,
                      height: 19,
                      borderRadius: 999,
                      background:
                        workspaces.length > 1
                          ? "rgba(244,63,94,0.96)"
                          : "var(--bg-btn-ghost)",
                      border: "1px solid var(--border-subtle)",
                      color:
                        workspaces.length > 1 ? "#fff" : "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      lineHeight: 0,
                      boxShadow:
                        workspaces.length > 1
                          ? "0 8px 18px rgba(244,63,94,0.34)"
                          : "none",
                      transition: "transform 0.16s ease, background 0.16s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            <button
              title="Add workspace"
              onClick={() => setShowWorkspaceForm(true)}
              style={{
                width: isMobile ? 44 : 44,
                height: isMobile ? 44 : 44,
                borderRadius: 20,
                marginTop: 4,
                background: `${accent.from}10`,
                border: `1px dashed ${accent.from}44`,
                color: accent.from,
                cursor: "pointer",
                fontSize: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${accent.from}25`;
                e.currentTarget.style.borderRadius = "14px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${accent.from}10`;
                e.currentTarget.style.borderRadius = "20px";
              }}
            >
              +
            </button>

            {showWorkspaceForm && (
              <form
                onSubmit={addWorkspace}
                style={{
                  position: "absolute",
                  left: 76,
                  top: 170,
                  width: 214,
                  padding: 12,
                  borderRadius: 14,
                  background: "var(--bg-popover)",
                  border: `1px solid ${accent.from}36`,
                  boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--text-main)",
                    marginBottom: 8,
                  }}
                >
                  Tambah workspace
                </div>
                <input
                  autoFocus
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Nama workspace"
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: 10,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    outline: "none",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                  }}
                />
                <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "8px 9px",
                      borderRadius: 10,
                      border: "none",
                      background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                      color: "white",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 11,
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWorkspaceForm(false)}
                    style={{
                      flex: 1,
                      padding: "8px 9px",
                      borderRadius: 10,
                      background: "var(--bg-btn-ghost)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 11,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ flex: 1 }} />

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Avatar
                initials={currentUserInitials}
                accent={["#6b7280", "#374151"]}
                size={40}
                dnd
              />
              <button
                type="button"
                title={`Logout ${currentUser.displayName}`}
                onClick={logout}
                style={{
                  width: 48,
                  height: 30,
                  borderRadius: 10,
                  border: "1px solid rgba(244,63,94,0.24)",
                  background: "rgba(244,63,94,0.10)",
                  color: "#fb7185",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 10,
                  fontWeight: 900,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                Logout
              </button>
            </div>
          </>
        }
      >
        <div
          style={{
            padding: "18px 16px 14px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "white",
                  boxShadow: `0 14px 28px ${accent.from}2f`,
                }}
              >
                {activeWsData.initials}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-main)",
                    lineHeight: 1.2,
                  }}
                >
                  {activeWsData.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  AI workspace
                </div>
              </div>
            </div>
            <button
              type="button"
              title={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
              aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
              onClick={() => setSidebarCollapsed((current) => !current)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                lineHeight: 0,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-main)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: "8px 12px",
              boxShadow: "var(--shadow-inset)",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={channelSearchRef}
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Search channels..."
              style={{
                flex: 1,
                minWidth: 0,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text-main)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 12,
              }}
            />
            {channelSearch ? (
              <button
                type="button"
                title="Clear channel search"
                onClick={() => {
                  setChannelSearch("");
                  channelSearchRef.current?.focus();
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  border: "none",
                  background: "var(--bg-btn-ghost)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  lineHeight: 0,
                }}
              >
                ×
              </button>
            ) : (
              <button
                type="button"
                title="Open global search"
                onClick={() => setGlobalSearchOpen(true)}
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  color: "var(--text-muted)",
                  background: "var(--bg-btn-ghost)",
                  borderRadius: 5,
                  padding: "1px 5px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ⌘K
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {filteredCategories.map((cat) => (
            <div key={cat.name} style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {cat.name}
                </span>
                <button
                  title={`Add channel to ${cat.name}`}
                  onClick={() => openChannelForm(cat.name)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 0,
                    lineHeight: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = accent.from)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              {cat.channels.map((ch) => {
                const isActive = activeChannel === ch.name;
                return (
                  <button
                    key={ch.name}
                    onClick={() => selectChannel(ch.name)}
                    onMouseEnter={() => setHoveredChannel(ch.name)}
                    onMouseLeave={() => setHoveredChannel(null)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      background: isActive
                        ? `linear-gradient(90deg, ${accent.from}22, ${accent.to}14)`
                        : hoveredChannel === ch.name
                          ? "var(--bg-btn-ghost)"
                          : "transparent",
                      color: isActive
                        ? "var(--text-main)"
                        : "var(--text-muted)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      marginBottom: 2,
                      transition: "all 0.15s",
                      borderLeft: isActive
                        ? `2px solid ${accent.from}`
                        : "2px solid transparent",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: isActive ? accent.from : "var(--text-muted)",
                      }}
                    >
                      {ch.type === "forum"
                        ? "◈"
                        : ch.type === "voice"
                          ? "◆"
                          : "#"}
                    </span>
                    {ch.name}
                    {isActive && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: accent.from,
                          boxShadow: "none",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div
              style={{
                padding: "18px 10px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Tidak ada channel yang cocok.
            </div>
          )}

          {showCategoryForm && (
            <form
              onSubmit={addCategory}
              style={{
                margin: "8px 0 10px",
                padding: 10,
                borderRadius: 12,
                background: "var(--bg-btn-ghost)",
                border: `1px solid ${accent.from}28`,
              }}
            >
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "7px 8px",
                    borderRadius: 9,
                    border: "none",
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    color: "white",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  style={{
                    flex: 1,
                    padding: "7px 8px",
                    borderRadius: 9,
                    background: "var(--bg-btn-ghost)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showChannelForm && (
            <form
              onSubmit={addChannel}
              style={{
                margin: "8px 0 10px",
                padding: 10,
                borderRadius: 12,
                background: "var(--bg-btn-ghost)",
                border: `1px solid ${accent.from}28`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginBottom: 7,
                }}
              >
                Channel untuk {targetCategory}
              </div>
              <input
                autoFocus
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="nama-channel"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                }}
              />
              <select
                value={newChannelType}
                onChange={(e) =>
                  setNewChannelType(e.target.value as ChannelType)
                }
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                }}
              >
                <option value="text">Text channel</option>
                <option value="forum">Forum channel</option>
                <option value="voice">Voice channel</option>
              </select>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "7px 8px",
                    borderRadius: 9,
                    border: "none",
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    color: "white",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowChannelForm(false)}
                  style={{
                    flex: 1,
                    padding: "7px 8px",
                    borderRadius: 9,
                    background: "var(--bg-btn-ghost)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        <div
          style={{
            padding: "12px 8px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: 6,
          }}
        >
          {[
            {
              label: "+ Category",
              action: () => {
                setShowCategoryForm(true);
                setShowChannelForm(false);
              },
            },
            {
              label: "+ Channel",
              action: () => openChannelForm(categories[0]?.name || ""),
            },
          ].map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: 10,
                background:
                  i === 1
                    ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                    : "var(--bg-btn-ghost)",
                border: i === 0 ? "1px solid var(--border-subtle)" : "none",
                color: i === 1 ? "white" : "var(--text-muted)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "none",
              }}
              onMouseEnter={(e) => {
                if (i === 0)
                  e.currentTarget.style.background =
                    "var(--bg-btn-ghost-hover)";
              }}
              onMouseLeave={(e) => {
                if (i === 0)
                  e.currentTarget.style.background = "var(--bg-btn-ghost)";
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </AppHeaderShell>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          zIndex: 8,
          position: "relative",
          paddingLeft: isMobile ? 64 : 72,
        }}
      >
        <div
          style={{
            minHeight: isMobile ? 104 : 68,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            flexWrap: isMobile ? "wrap" : "nowrap",
            alignContent: isMobile ? "center" : undefined,
            padding: isMobile ? "10px 12px" : "0 22px",
            gap: isMobile ? "8px" : 14,
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-header)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
          }}
        >
          <button
            type="button"
            title={sidebarCollapsed ? "Open app header" : "Close app header"}
            onClick={() => setSidebarCollapsed((current) => !current)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              lineHeight: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-main)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div
            style={{
              width: isMobile ? 40 : 36,
              height: isMobile ? 40 : 36,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${accent.from}20, ${accent.to}12)`,
              border: `1px solid ${accent.from}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent.from,
              fontSize: 15,
              boxShadow: `0 12px 28px ${accent.from}12`,
            }}
          >
            {isForum ? "◈" : isVoice ? "◆" : "#"}
          </div>

          <div style={{ minWidth: 0, flex: "1 1 auto" }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-main)",
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeChannel}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isForum
                ? "Forum · discuss ideas & get reviews"
                : isVoice
                  ? "Voice · team room & live session"
                  : "Text channel · brainstorm & plan"}
            </div>
          </div>

          <div
            className="header-actions"
            style={{
              marginLeft: isMobile ? 0 : "auto",
              display: "flex",
              justifyContent: isMobile ? "flex-end" : "center",
              width: isMobile ? "100%" : undefined,
              flex: isMobile ? "0 0 100%" : "0 0 auto",
              padding: "2px 0",
            }}
          >
            <button
              type="button"
              title="Open menu"
              onClick={() => openRightPanel("hub")}
              style={{
                width: isMobile ? 44 : 40,
                height: isMobile ? 44 : 40,
                borderRadius: 12,
                background:
                  rightPanel === "hub" && rightPanelOpen
                    ? `${accent.from}18`
                    : "var(--bg-btn-ghost)",
                border:
                  rightPanel === "hub" && rightPanelOpen
                    ? `1px solid ${accent.from}55`
                    : "1px solid var(--border-subtle)",
                color:
                  rightPanel === "hub" && rightPanelOpen
                    ? accent.from
                    : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow:
                  rightPanel === "hub" && rightPanelOpen
                    ? `0 10px 24px ${accent.from}16`
                    : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  rightPanel === "hub" && rightPanelOpen
                    ? `${accent.from}22`
                    : "var(--bg-btn-ghost-hover)";
                e.currentTarget.style.color =
                  rightPanel === "hub" && rightPanelOpen
                    ? accent.from
                    : "var(--text-main)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  rightPanel === "hub" && rightPanelOpen
                    ? `${accent.from}18`
                    : "var(--bg-btn-ghost)";
                e.currentTarget.style.color =
                  rightPanel === "hub" && rightPanelOpen
                    ? accent.from
                    : "var(--text-muted)";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
            </button>
          </div>
        </div>

        {globalSearchOpen && (
          <div
            style={{
              position: "absolute",
              top: 72,
              right: 16,
              zIndex: 30,
              width: "min(440px, calc(100% - 32px))",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 12,
              background: "var(--bg-popover)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 18px 46px rgba(0,0,0,0.25)",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accent.from}
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={globalSearchRef}
              value={globalSearchQuery}
              onChange={(e) => {
                const value = e.target.value;
                const firstResult = getChatSearchResults(value)[0];
                setGlobalSearchQuery(value);
                setCurrentSearchResult(0);
                if (firstResult) {
                  openMessageResult(firstResult.index);
                } else {
                  setHighlightedMessageIndex(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  moveChatSearch(e.shiftKey ? -1 : 1);
                }
              }}
              placeholder="Find"
              style={{
                flex: 1,
                minWidth: 0,
                height: 28,
                background: "var(--bg-input)",
                border: `1px solid ${chatSearchQuery && chatSearchResults.length === 0 ? "rgba(244,63,94,0.55)" : "var(--border-subtle)"}`,
                borderRadius: 7,
                outline: "none",
                color: "var(--text-main)",
                padding: "0 9px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
              }}
            />
            <span
              style={{
                minWidth: 72,
                textAlign: "center",
                color:
                  chatSearchQuery && chatSearchResults.length === 0
                    ? "#fb7185"
                    : "var(--text-muted)",
                fontSize: 12,
              }}
            >
              {chatSearchQuery
                ? chatSearchResults.length
                  ? `${currentSearchResult + 1} of ${chatSearchResults.length}`
                  : "No results"
                : "0 of 0"}
            </span>
            <button
              type="button"
              title="Previous match"
              disabled={chatSearchResults.length === 0}
              onClick={() => moveChatSearch(-1)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "transparent",
                border: "none",
                color: chatSearchResults.length
                  ? "var(--text-muted)"
                  : "var(--border-subtle)",
                cursor: chatSearchResults.length ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              title="Next match"
              disabled={chatSearchResults.length === 0}
              onClick={() => moveChatSearch(1)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "transparent",
                border: "none",
                color: chatSearchResults.length
                  ? "var(--text-muted)"
                  : "var(--border-subtle)",
                cursor: chatSearchResults.length ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              title="Close find"
              onClick={() => {
                setGlobalSearchOpen(false);
                setGlobalSearchQuery("");
                setHighlightedMessageIndex(null);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {isVoice ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "16px 14px" : "28px",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: "min(620px, 100%)",
                borderRadius: 22,
                padding: isMobile ? 18 : 28,
                background: `linear-gradient(135deg, ${accent.from}${isLightTheme ? "08" : "16"}, var(--bg-btn-ghost))`,
                border: `1px solid ${accent.from}30`,
                boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 22,
                }}
              >
                <div>
                  <NeonBadge color={accent.from}>voice channel</NeonBadge>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: "var(--text-main)",
                      marginTop: 12,
                    }}
                  >
                    {activeChannel}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginTop: 6,
                    }}
                  >
                    Live room untuk brainstorming cepat bareng AI team.
                  </div>
                </div>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "none",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <path d="M12 19v3M8 22h8" />
                  </svg>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {visibleProfiles.map((member) => (
                  <div
                    key={member.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      borderRadius: 14,
                      background: "var(--bg-btn-ghost)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Avatar
                      initials={member.initials}
                      accent={member.accent}
                      size={38}
                      online={member.status === "online"}
                      dnd={member.status === "dnd"}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-main)",
                        }}
                      >
                        {member.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {member.app ? "Listening" : "Muted"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 10,
                }}
              >
                {["Join Voice", "Mute", "Share Screen"].map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    style={{
                      flex: 1,
                      padding: "12px 10px",
                      borderRadius: 13,
                      border:
                        index === 0 ? "none" : "1px solid var(--border-subtle)",
                      background:
                        index === 0
                          ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                          : "var(--bg-btn-ghost)",
                      color: index === 0 ? "white" : "var(--text-muted)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : isForum ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "16px 14px" : "24px 28px",
            }}
          >
            {selectedForumPost ? (
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedForumPostId(null)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 11px",
                    borderRadius: 10,
                    marginBottom: 16,
                    background: "var(--bg-btn-ghost)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back to posts
                </button>
                <div
                  style={{
                    borderRadius: 20,
                    padding: "22px 24px",
                    marginBottom: 14,
                    background: `linear-gradient(135deg, ${accent.from}${isLightTheme ? "08" : "18"}, var(--bg-btn-ghost))`,
                    border: `1px solid ${accent.from}28`,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <NeonBadge color={accent.from}>
                      {selectedForumPost.tag}
                    </NeonBadge>
                    <NeonBadge color="#22c55e">
                      {selectedForumPost.status}
                    </NeonBadge>
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "var(--text-main)",
                      marginBottom: 10,
                    }}
                  >
                    {selectedForumPost.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    {selectedForumPost.body}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      marginTop: 16,
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    <span>{selectedForumPost.replies} replies</span>
                    <span>Last activity: {selectedForumPost.lastActivity}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  {(forumReplies[selectedForumPost.id] || []).map(
                    (reply, index) => (
                      <div
                        key={`${reply.author}-${reply.time}-${index}`}
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: 14,
                          borderRadius: 16,
                          background: "var(--bg-btn-ghost)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Avatar
                          initials={getInitials(reply.author)}
                          accent={
                            reply.author === currentUser.displayName
                              ? ["#6b7280", "#374151"]
                              : [accent.from, accent.to]
                          }
                          size={34}
                        />
                        <div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              marginBottom: 5,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "var(--text-main)",
                              }}
                            >
                              {reply.author}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {reply.time}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--text-main)",
                              opacity: 0.8,
                              lineHeight: 1.65,
                            }}
                          >
                            {reply.body}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <form
                  onSubmit={addForumReply}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-end",
                    padding: 12,
                    borderRadius: 16,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <textarea
                    value={forumReplyDraft}
                    onChange={(e) => setForumReplyDraft(e.target.value)}
                    placeholder="Reply to this post"
                    rows={2}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      resize: "vertical",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--text-main)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!forumReplyDraft.trim()}
                    style={{
                      padding: "10px 15px",
                      borderRadius: 12,
                      border: "none",
                      background: forumReplyDraft.trim()
                        ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                        : "var(--bg-btn-ghost)",
                      color: forumReplyDraft.trim()
                        ? "white"
                        : "var(--text-muted)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: forumReplyDraft.trim()
                        ? "pointer"
                        : "not-allowed",
                    }}
                  >
                    Reply
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div
                  style={{
                    borderRadius: 20,
                    padding: "24px 28px",
                    marginBottom: 20,
                    background: `linear-gradient(135deg, ${accent.from}${isLightTheme ? "08" : "18"}, ${accent.to}${isLightTheme ? "04" : "10"}, var(--bg-rail))`,
                    border: `1px solid ${accent.from}22`,
                  }}
                >
                  <NeonBadge color={accent.from}>{forumChannelName}</NeonBadge>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--text-main)",
                      margin: "12px 0 8px",
                    }}
                  >
                    Idea Review Board
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.7,
                      maxWidth: 500,
                    }}
                  >
                    Post portfolio ideas, get AI reviews, break them into scope
                    and actionable tasks.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPostForm(true)}
                    style={{
                      marginTop: 16,
                      padding: "10px 20px",
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                      border: "none",
                      color: "white",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New post
                  </button>
                </div>

                {showPostForm && (
                  <form
                    onSubmit={addForumPost}
                    style={{
                      borderRadius: 18,
                      padding: "18px 20px",
                      marginBottom: 16,
                      background: "var(--bg-popover)",
                      border: `1px solid ${accent.from}30`,
                      boxShadow: "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "var(--text-main)",
                        marginBottom: 12,
                      }}
                    >
                      Tambah post baru
                    </div>
                    <input
                      autoFocus
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Judul post"
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        borderRadius: 12,
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-main)",
                        outline: "none",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13,
                      }}
                    />
                    <textarea
                      value={newPostBody}
                      onChange={(e) => setNewPostBody(e.target.value)}
                      placeholder="Deskripsi ide / request review"
                      rows={4}
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: "11px 12px",
                        borderRadius: 12,
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-main)",
                        outline: "none",
                        resize: "vertical",
                        minHeight: 92,
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13,
                        lineHeight: 1.55,
                      }}
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginTop: 10,
                      }}
                    >
                      <input
                        value={newPostTag}
                        onChange={(e) => setNewPostTag(e.target.value)}
                        placeholder="Tag"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-main)",
                          outline: "none",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 12,
                        }}
                      />
                      <select
                        value={newPostStatus}
                        onChange={(e) => setNewPostStatus(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-main)",
                          outline: "none",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 12,
                        }}
                      >
                        <option value="Ready for review">
                          Ready for review
                        </option>
                        <option value="Draft">Draft</option>
                        <option value="In progress">In progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 12,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowPostForm(false)}
                        style={{
                          padding: "9px 14px",
                          borderRadius: 11,
                          background: "var(--bg-btn-ghost)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newPostTitle.trim() || !newPostBody.trim()}
                        style={{
                          padding: "9px 16px",
                          borderRadius: 11,
                          border: "none",
                          background:
                            newPostTitle.trim() && newPostBody.trim()
                              ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                              : "var(--bg-btn-ghost)",
                          color:
                            newPostTitle.trim() && newPostBody.trim()
                              ? "white"
                              : "var(--text-muted)",
                          fontWeight: 800,
                          cursor:
                            newPostTitle.trim() && newPostBody.trim()
                              ? "pointer"
                              : "not-allowed",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 12,
                          boxShadow: "none",
                        }}
                      >
                        Post
                      </button>
                    </div>
                  </form>
                )}
                {forumPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedForumPostId(post.id)}
                    style={{
                      borderRadius: 18,
                      padding: "20px 24px",
                      marginBottom: 12,
                      background: "var(--bg-btn-ghost)",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--bg-btn-ghost-hover)";
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.borderColor = `${accent.from}44`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-btn-ghost)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor =
                        "var(--border-subtle)";
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <NeonBadge color={accent.from}>{post.tag}</NeonBadge>
                      <NeonBadge color="#22c55e">{post.status}</NeonBadge>
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--text-main)",
                        marginBottom: 10,
                      }}
                    >
                      {post.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        lineHeight: 1.6,
                      }}
                    >
                      {post.body}
                    </div>
                    <div
                      style={{
                        marginTop: 16,
                        fontSize: 12,
                        color: "var(--text-muted)",
                        display: "flex",
                        gap: 16,
                        opacity: 0.6,
                      }}
                    >
                      <span>{post.replies} replies</span>
                      <span>Last activity: {post.lastActivity}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: isMobile ? "16px 14px" : "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              <div
                style={{
                  borderRadius: 22,
                  minHeight: isMobile ? 64 : 72,
                  padding: isMobile ? "12px 14px" : "12px 22px",
                  margin: isMobile ? "0 0 18px" : "0 0 24px",
                  background: `linear-gradient(135deg, ${accent.from}${isLightTheme ? "14" : "20"}, ${accent.to}${isLightTheme ? "08" : "12"}, var(--surface-strong))`,
                  border: `1px solid ${accent.from}30`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  position: "sticky",
                  top: 0,
                  zIndex: 12,
                  overflow: "visible",
                  width: "100%",
                  maxWidth: "100%",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "linear-gradient(120deg, rgba(255,255,255,0.12), transparent 38%, transparent 70%, rgba(255,255,255,0.06))",
                    opacity: isLightTheme ? 0.55 : 0.28,
                  }}
                />
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 18px 36px ${accent.from}35`,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                    <path d="M9 18h6M10 22h4" />
                  </svg>
                </div>
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    minWidth: 0,
                    flex: 1,
                    alignSelf: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginBottom: 4,
                      minHeight: 22,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--text-main)",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedAgent} Active
                    </span>
                    <NeonBadge color="#22c55e">Online</NeonBadge>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      lineHeight: 1.35,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedAgentProfile?.role || "AI agent"} siap bantu di
                    channel ini.
                  </div>
                </div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    ref={(element) => {
                      messageRefs.current[i] = element;
                    }}
                    onMouseEnter={() => setHoveredMessageIndex(i)}
                    onMouseLeave={() => setHoveredMessageIndex(null)}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      flexDirection: msg.ai ? "row" : "row-reverse",
                      position: "relative",
                    }}
                  >
                    {hoveredMessageIndex === i && (
                      <div
                        style={{
                          position: "absolute",
                          top: -12,
                          [msg.ai ? "right" : "left"]: 54,
                          display: "flex",
                          gap: 4,
                          padding: 4,
                          borderRadius: 10,
                          background: "var(--bg-popover)",
                          border: "1px solid var(--border-subtle)",
                          boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                          zIndex: 5,
                        }}
                      >
                        {["👍", "🔥"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            title={`React ${emoji}`}
                            onClick={() => toggleReaction(i, emoji)}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 8,
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                        {[
                          {
                            label: "Reply",
                            icon: "↩",
                            action: () => setReplyingTo(msg),
                          },
                          {
                            label: msg.pinned ? "Unpin" : "Pin",
                            icon: msg.pinned ? "●" : "○",
                            action: () => togglePin(i),
                          },
                          {
                            label: "Edit",
                            icon: "✎",
                            action: () => startEditMessage(i),
                            hidden: msg.ai,
                          },
                          {
                            label: "Delete",
                            icon: "×",
                            action: () => deleteMessage(i),
                            danger: true,
                          },
                        ]
                          .filter((item) => !item.hidden)
                          .map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              title={item.label}
                              onClick={item.action}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                background: item.danger
                                  ? "rgba(244,63,94,0.10)"
                                  : "var(--bg-btn-ghost)",
                                border: "1px solid var(--border-subtle)",
                                color: item.danger
                                  ? "#fb7185"
                                  : "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: 13,
                                lineHeight: 1,
                              }}
                            >
                              {item.icon}
                            </button>
                          ))}
                      </div>
                    )}
                    <Avatar
                      initials={msg.ai ? "AI" : "A"}
                      accent={
                        msg.ai
                          ? [accent.from, accent.to]
                          : ["#6b7280", "#374151"]
                      }
                      size={36}
                    />
                    <div
                      style={{
                        maxWidth: isMobile ? "92%" : "68%",
                        borderRadius: 20,
                        borderTopLeftRadius: msg.ai ? 6 : 20,
                        borderTopRightRadius: msg.ai ? 20 : 6,
                        padding: "13px 17px",
                        background: msg.ai
                          ? "var(--surface)"
                          : `linear-gradient(135deg, ${accent.from}${isLightTheme ? "22" : "34"}, ${accent.to}${isLightTheme ? "18" : "26"})`,
                        border:
                          highlightedMessageIndex === i
                            ? `1px solid ${accent.from}`
                            : msg.ai
                              ? "1px solid var(--border-subtle)"
                              : `1px solid ${accent.from}33`,
                        boxShadow:
                          highlightedMessageIndex === i
                            ? "0 14px 34px rgba(0,0,0,0.22)"
                            : "var(--shadow-message)",
                        transition:
                          "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                        backdropFilter: "blur(18px)",
                      }}
                    >
                      {msg.replyTo && (
                        <div
                          style={{
                            marginBottom: 8,
                            padding: "7px 9px",
                            borderRadius: 9,
                            background: "var(--bg-input)",
                            borderLeft: `2px solid ${accent.from}`,
                            color: "var(--text-muted)",
                            fontSize: 11,
                            maxWidth: 360,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {msg.replyTo}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 6,
                          flexDirection: msg.ai ? "row" : "row-reverse",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: msg.ai ? accent.from : "var(--text-main)",
                          }}
                        >
                          {msg.author}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            opacity: 0.6,
                          }}
                        >
                          {msg.time}
                        </span>
                        {msg.edited && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              opacity: 0.6,
                            }}
                          >
                            (edited)
                          </span>
                        )}
                        {msg.pinned && (
                          <span style={{ fontSize: 11, color: accent.from }}>
                            pinned
                          </span>
                        )}
                      </div>
                      {msg.image && msg.imageMime?.startsWith("image/") && (
                        <div
                          style={{
                            overflow: "hidden",
                            borderRadius: 16,
                            marginTop: 10,
                            border: "1px solid var(--border-subtle)",
                            background: "var(--bg-input)",
                            boxShadow: "0 14px 34px rgba(0,0,0,0.16)",
                          }}
                        >
                          <Image
                            src={msg.image}
                            alt={msg.imageName || "Chat attachment"}
                            width={640}
                            height={360}
                            unoptimized
                            style={{
                              display: "block",
                              width: "100%",
                              maxHeight: 260,
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}
                      {msg.image && !msg.imageMime?.startsWith("image/") && (
                        <a
                          href={msg.image}
                          download={msg.imageName}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            marginTop: 8,
                            padding: "10px 11px",
                            borderRadius: 12,
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            textDecoration: "none",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={accent.from}
                            strokeWidth="2"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                            <path d="M14 2v6h6" />
                          </svg>
                          {msg.imageName || "Attachment"}
                        </a>
                      )}
                      {editingMessageIndex === i ? (
                        <div style={{ marginTop: msg.image ? 8 : 0 }}>
                          <textarea
                            autoFocus
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            rows={3}
                            style={{
                              width: "100%",
                              minWidth: isMobile ? 0 : 260,
                              resize: "vertical",
                              padding: "9px 10px",
                              borderRadius: 10,
                              background: "var(--bg-input)",
                              border: `1px solid ${accent.from}44`,
                              color: "var(--text-main)",
                              outline: "none",
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: 13,
                              lineHeight: 1.55,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                              justifyContent: "flex-end",
                              marginTop: 8,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setEditingMessageIndex(null)}
                              style={{
                                padding: "7px 10px",
                                borderRadius: 9,
                                background: "var(--bg-btn-ghost)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditMessage(i)}
                              style={{
                                padding: "7px 10px",
                                borderRadius: 9,
                                border: "none",
                                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                                color: "white",
                                cursor: "pointer",
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.text && (
                          <div
                            style={{
                              fontSize: 13.5,
                              color: "var(--text-main)",
                              opacity: 0.9,
                              lineHeight: 1.68,
                              marginTop: msg.image ? 10 : 0,
                            }}
                          >
                            {renderFormattedMessageText(msg.text)}
                          </div>
                        )
                      )}
                      {msg.reactions &&
                        Object.keys(msg.reactions).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                              marginTop: 10,
                            }}
                          >
                            {Object.entries(msg.reactions).map(
                              ([emoji, count]) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleReaction(i, emoji)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "3px 8px",
                                    borderRadius: 999,
                                    background: `${accent.from}13`,
                                    border: `1px solid ${accent.from}28`,
                                    color: "var(--text-main)",
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontSize: 11,
                                    cursor: "pointer",
                                  }}
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
                <div ref={msgEndRef} />
              </div>
            </div>
            <div
              style={{
                padding: isMobile ? "12px 12px 16px" : "14px 24px 20px",
                borderTop: "1px solid var(--border-subtle)",
                background: "var(--composer-bg)",
                backdropFilter: "blur(20px)",
              }}
            >
              {agentInvoking && isAgentChannel && (
                <div
                  style={{
                    margin: "0 0 8px 2px",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {pendingAgentReplies} balasan AI sedang diproses. Kamu tetap
                  bisa kirim chat lagi.
                </div>
              )}
              <form
                aria-busy={agentInvoking && isAgentChannel}
                onSubmit={sendMessage}
                style={{
                  background: "var(--surface-strong)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: isMobile ? 18 : 20,
                  padding: isMobile ? "10px 12px" : "10px 14px",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxShadow: "var(--shadow-composer)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = `${accent.from}66`;
                  e.currentTarget.style.boxShadow = "var(--shadow-composer)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.boxShadow = "var(--shadow-composer)";
                }}
              >
                {replyingTo && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      marginBottom: 9,
                      padding: "8px 10px",
                      borderRadius: 11,
                      background: "var(--bg-btn-ghost)",
                      borderLeft: `2px solid ${accent.from}`,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        color: "var(--text-muted)",
                        fontSize: 11,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Replying to{" "}
                      <span
                        style={{ color: "var(--text-main)", fontWeight: 800 }}
                      >
                        {replyingTo.author}
                      </span>
                      {" · "}
                      {replyingTo.text || replyingTo.imageName || "Attachment"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: "var(--bg-btn-ghost)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {attachedImage && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 9,
                      padding: 7,
                      borderRadius: 12,
                      background: `${accent.from}12`,
                      border: `1px solid ${accent.from}2f`,
                    }}
                  >
                    {attachedImage.mime.startsWith("image/") ? (
                      <Image
                        src={attachedImage.src}
                        alt={attachedImage.name}
                        width={44}
                        height={44}
                        unoptimized
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          background: "var(--bg-btn-ghost)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={accent.from}
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </div>
                    )}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-main)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {attachedImage.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        background: "var(--bg-btn-ghost)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 8 : 10,
                  }}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    onChange={attachImage}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      width: isMobile ? 42 : 32,
                      height: isMobile ? 42 : 32,
                      borderRadius: 11,
                      background: "var(--bg-btn-ghost)",
                      border: "1px solid var(--border-subtle)",
                      padding: 0,
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      lineHeight: 0,
                      transition: "color 0.2s",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = accent.from)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>
                  <input
                    ref={messageInputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onPaste={pasteAttachment}
                    placeholder={`Message #${activeChannel}`}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: isMobile ? 15 : 14,
                      color: "var(--text-main)",
                      outline: "none",
                      height: isMobile ? 42 : 34,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() && !attachedImage}
                    style={{
                      width: isMobile ? 44 : 36,
                      height: isMobile ? 44 : 36,
                      borderRadius: 12,
                      border: "none",
                      cursor:
                        !draft.trim() && !attachedImage
                          ? "not-allowed"
                          : "pointer",
                      background:
                        draft.trim() || attachedImage
                          ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                          : "var(--bg-btn-ghost)",
                      color:
                        draft.trim() || attachedImage
                          ? "white"
                          : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      flexShrink: 0,
                      boxShadow:
                        draft.trim() || attachedImage
                          ? `0 14px 28px ${accent.from}32`
                          : "none",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <RightNavbarShell
        isMobile={isMobile}
        isOpen={rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 18px 16px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: "var(--text-main)",
                lineHeight: 1,
              }}
            >
              Menu
            </div>
            {rightPanel !== "hub" && (
              <button
                type="button"
                onClick={() => setRightPanel("hub")}
                style={{
                  marginTop: 7,
                  padding: 0,
                  background: "none",
                  border: "none",
                  color: accent.from,
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                Kembali ke menu
              </button>
            )}
          </div>
          <button
            type="button"
            title="Close panel"
            onClick={() => setRightPanelOpen(false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              flexShrink: 0,
              background: "var(--bg-btn-ghost)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {rightPanel === "hub" ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "18px 16px" : "22px 18px",
            }}
          >
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.34em",
                  color: accent.from,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Dashboard
              </div>
              <div
                style={{
                  fontSize: 30,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  color: "var(--text-main)",
                }}
              >
                Akun
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 22,
                }}
              >
                <Avatar
                  initials={currentUserInitials}
                  accent={["#14b8a6", "#0f766e"]}
                  size={52}
                  dnd
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                      color: "var(--text-main)",
                      lineHeight: 1.25,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {currentUser.displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 3,
                      textTransform: "capitalize",
                    }}
                  >
                    {currentUser.role} · {activeWsData.name}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "var(--text-main)",
                marginBottom: 12,
              }}
            >
              Data Dashboard
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border-subtle)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {[
                {
                  title: "Info Pribadi",
                  desc: "Lihat profil, role, dan workspace aktif.",
                  action: () => openRightPanel("profiles"),
                },
                {
                  title: "Member",
                  desc: `${visibleProfiles.length} member dan agent online.`,
                  action: () => openRightPanel("profiles"),
                },
                {
                  title: "Pin",
                  desc: `${pinnedMessages.length} pesan tersimpan di channel.`,
                  action: () => openRightPanel("pins"),
                },
                {
                  title: "Threads",
                  desc: `${forumPosts.length} diskusi forum aktif.`,
                  action: () => openRightPanel("threads"),
                },
                {
                  title: "Cari Pesan",
                  desc: "Cari chat, author, dan attachment.",
                  action: () => setGlobalSearchOpen(true),
                },
                {
                  title: "Undang Member",
                  desc: "Buat link invite untuk workspace.",
                  action: () => setShowInviteModal(true),
                },
                {
                  title: "Ubah Kata Sandi",
                  desc: "Perbarui password akun dashboard.",
                  action: () => setShowSettingsModal(true),
                },
                {
                  title: "Developer Portal",
                  desc: "Hak akses agent, token, dan gateway.",
                  action: () => openRightPanel("developer"),
                },
                {
                  title: "Konfigurasi",
                  desc: "Env, model, tools, dan status API.",
                  action: () => openRightPanel("config"),
                },
                {
                  title: isLightTheme ? "Mode Gelap" : "Mode Terang",
                  desc: "Ganti tema dashboard.",
                  action: toggleThemeMode,
                },
              ].map((item, index, list) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      index === list.length - 1
                        ? "none"
                        : "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-btn-ghost)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 900 }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          lineHeight: 1.45,
                          marginTop: 5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                    <span
                      style={{
                        color: accent.from,
                        fontSize: 24,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ›
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : rightPanel === "developer" ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "14px" : "16px",
            }}
          >
            <div
              style={{
                borderRadius: 14,
                padding: 16,
                marginBottom: 14,
                background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}10)`,
                border: `1px solid ${accent.from}28`,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: "var(--text-main)",
                }}
              >
                Developer Portal
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 5,
                  lineHeight: 1.55,
                }}
              >
                Kelola hak akses agent, token, dan status gateway seperti
                halaman developer Discord.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {[
                ["Agents", String(AGENT_OPTIONS.length)],
                [
                  "Admin",
                  String(
                    Object.values(agentAccess).filter(
                      (access) => access === "admin",
                    ).length,
                  ),
                ],
                [
                  "Tokens",
                  String(Object.values(agentTokens).filter(Boolean).length),
                ],
                ["Logs", String(apiLogs.length)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "11px 9px",
                    borderRadius: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                      color: "var(--text-main)",
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Agent Permissions
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AGENT_OPTIONS.map((agent) => {
                const profile = visibleProfiles.find(
                  (item) => item.name === agent,
                );
                const token = agentTokens[agent];

                return (
                  <div
                    key={agent}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      background:
                        selectedAgent === agent
                          ? `${accent.from}12`
                          : "var(--bg-btn-ghost)",
                      border:
                        selectedAgent === agent
                          ? `1px solid ${accent.from}33`
                          : "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 9,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: "var(--text-main)",
                          }}
                        >
                          {agent}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginTop: 2,
                          }}
                        >
                          {profile?.role || "AI agent"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAgent(agent)}
                        style={{
                          padding: "7px 9px",
                          borderRadius: 9,
                          background:
                            selectedAgent === agent
                              ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                              : "var(--bg-input)",
                          border:
                            selectedAgent === agent
                              ? "none"
                              : "1px solid var(--border-subtle)",
                          color:
                            selectedAgent === agent
                              ? "white"
                              : "var(--text-main)",
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        {selectedAgent === agent ? "Active" : "Use"}
                      </button>
                    </div>

                    <select
                      value={agentAccess[agent]}
                      onChange={(e) =>
                        updateAgentAccess(
                          agent,
                          e.target.value as AgentAccessLevel,
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        borderRadius: 10,
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-main)",
                        outline: "none",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <option value="viewer">Viewer - baca data</option>
                      <option value="operator">
                        Operator - chat dan invoke
                      </option>
                      <option value="admin">Admin - manage config</option>
                    </select>

                    <div
                      style={{
                        marginTop: 9,
                        padding: "8px 9px",
                        borderRadius: 10,
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          fontWeight: 800,
                          marginBottom: 5,
                        }}
                      >
                        TOKEN
                      </div>
                      <div
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: 10,
                          color: "var(--text-main)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {token}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginTop: 9,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(token)}
                        style={{
                          padding: "8px 9px",
                          borderRadius: 10,
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-main)",
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        Copy Token
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateAgentToken(agent)}
                        style={{
                          padding: "8px 9px",
                          borderRadius: 10,
                          background: `${accent.from}14`,
                          border: `1px solid ${accent.from}2f`,
                          color: accent.from,
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : rightPanel === "profiles" ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: isMobile ? "14px" : "16px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[
                [
                  "Online",
                  String(
                    visibleProfiles.filter(
                      (profile) => profile.status === "online",
                    ).length,
                  ),
                ],
                [
                  "AI",
                  String(
                    visibleProfiles.filter((profile) => profile.app).length,
                  ),
                ],
                [
                  "Users",
                  String(
                    visibleProfiles.filter((profile) => !profile.app).length,
                  ),
                ],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 14,
                    padding: "11px 8px",
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    textAlign: "center",
                    boxShadow: "var(--shadow-soft)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--text-main)",
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Online — {visibleProfiles.length}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {visibleProfiles.map((p) => {
                const profileAgent = AGENT_OPTIONS.find(
                  (agent) => agent === p.name,
                );
                const isSelectedAgent = profileAgent === selectedAgent;

                return (
                  <button
                    key={p.name}
                    type="button"
                    disabled={!profileAgent}
                    onClick={() =>
                      profileAgent && setSelectedAgent(profileAgent)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 10px",
                      borderRadius: 14,
                      cursor: profileAgent ? "pointer" : "default",
                      transition:
                        "background 0.15s, border-color 0.15s, transform 0.15s",
                      background: isSelectedAgent
                        ? `${p.accent[0]}16`
                        : "transparent",
                      border: isSelectedAgent
                        ? `1px solid ${p.accent[0]}44`
                        : "1px solid transparent",
                      width: "100%",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelectedAgent)
                        e.currentTarget.style.background =
                          "var(--bg-btn-ghost-hover)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelectedAgent)
                        e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Avatar
                      initials={p.initials}
                      accent={p.accent}
                      size={38}
                      online={p.status === "online"}
                      dnd={p.status === "dnd"}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text-main)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.name}
                        </span>
                        {p.crown && (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="#fbbf24"
                            stroke="#fbbf24"
                            strokeWidth="1"
                          >
                            <path d="M2 20h20M5 20V8l7-5 7 5v12" />
                          </svg>
                        )}
                        {p.app && (
                          <span
                            style={{
                              fontSize: 10,
                              background: "#4f46e5",
                              color: "#c7d2fe",
                              borderRadius: 5,
                              padding: "1px 5px",
                              fontWeight: 700,
                            }}
                          >
                            APP
                          </span>
                        )}
                        {isSelectedAgent && (
                          <span
                            style={{
                              fontSize: 10,
                              color: p.accent[0],
                              fontWeight: 900,
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {p.role}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : rightPanel === "pins" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              Pinned Messages — {pinnedMessages.length}
            </div>
            {pinnedMessages.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "var(--bg-btn-ghost)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: 12,
                  lineHeight: 1.55,
                }}
              >
                Belum ada pinned message. Hover chat, lalu klik tombol pin.
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {pinnedMessages.map((message) => (
                  <button
                    key={message.index}
                    type="button"
                    onClick={() => openMessageResult(message.index)}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderRadius: 14,
                      background: `${accent.from}10`,
                      border: `1px solid ${accent.from}25`,
                      color: "var(--text-main)",
                      cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: accent.from,
                        }}
                      >
                        {message.author}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          opacity: 0.6,
                        }}
                      >
                        {message.time}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-main)",
                        opacity: 0.7,
                        lineHeight: 1.55,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {message.text || message.imageName || "Attachment"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : rightPanel === "threads" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              Active Threads
            </div>
            {forumPosts.slice(0, 4).map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => {
                  activeChannelRef.current = forumChannelName;
                  setActiveChannel(forumChannelName);
                  saveActiveChannel(forumChannelName);
                  setSelectedForumPostId(post.id);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 14,
                  background: "var(--bg-btn-ghost)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  marginBottom: 9,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                  {post.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {post.replies} replies · {post.lastActivity}
                </div>
              </button>
            ))}
          </div>
        ) : rightPanel === "devtools" ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 14,
                padding: 14,
                background: `linear-gradient(135deg, ${accent.from}16, var(--bg-btn-ghost))`,
                border: `1px solid ${accent.from}28`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "var(--text-main)",
                    }}
                  >
                    Internal DevTools
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 3,
                    }}
                  >
                    API bridge inspector
                  </div>
                </div>
                <NeonBadge color={accent.from}>{apiLogs.length} logs</NeonBadge>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const logText = JSON.stringify(apiLogs, null, 2);
                    navigator.clipboard?.writeText(logText);
                  }}
                  style={{
                    padding: "8px 9px",
                    borderRadius: 10,
                    background: "var(--bg-btn-ghost)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Copy logs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApiLogs([]);
                    setSelectedApiLogId("");
                  }}
                  style={{
                    padding: "8px 9px",
                    borderRadius: 10,
                    background: "rgba(244,63,94,0.10)",
                    border: "1px solid rgba(244,63,94,0.22)",
                    color: "#fb7185",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {apiLogs.length === 0 ? (
                <div
                  style={{
                    padding: 15,
                    borderRadius: 14,
                    background: "var(--bg-btn-ghost)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: 12,
                    lineHeight: 1.55,
                  }}
                >
                  Belum ada log. Coba kirim chat, upload file, bikin channel,
                  atau react message.
                </div>
              ) : (
                apiLogs.map((log) => {
                  const selected = log.id === selectedApiLogId;
                  const methodColor =
                    log.method === "GET"
                      ? "#38bdf8"
                      : log.method === "POST"
                        ? "#22c55e"
                        : log.method === "PATCH"
                          ? "#f59e0b"
                          : "#fb7185";
                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedApiLogId(log.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 11px",
                        borderRadius: 12,
                        background: selected
                          ? `${accent.from}14`
                          : "var(--bg-btn-ghost)",
                        border: selected
                          ? `1px solid ${accent.from}35`
                          : "1px solid var(--border-subtle)",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            color: methodColor,
                          }}
                        >
                          {log.method}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: log.status >= 400 ? "#fb7185" : "#22c55e",
                            fontWeight: 800,
                          }}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "var(--text-main)",
                          marginBottom: 4,
                        }}
                      >
                        {log.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.endpoint}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {selectedApiLog && (
              <div
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {selectedApiLog.time}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color:
                        selectedApiLog.status >= 400 ? "#fb7185" : "#22c55e",
                      fontWeight: 900,
                    }}
                  >
                    {selectedApiLog.status}
                  </span>
                </div>
                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: accent.from,
                      marginBottom: 6,
                    }}
                  >
                    Payload
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 10,
                      borderRadius: 10,
                      background: "var(--bg-btn-ghost)",
                      color: "var(--text-main)",
                      opacity: 0.8,
                      fontSize: 10,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    {JSON.stringify(selectedApiLog.payload, null, 2)}
                  </pre>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: accent.from,
                      margin: "12px 0 6px",
                    }}
                  >
                    Response
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 10,
                      borderRadius: 10,
                      background: "var(--bg-btn-ghost)",
                      color: "var(--text-main)",
                      opacity: 0.8,
                      fontSize: 10,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    {JSON.stringify(selectedApiLog.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            <div
              style={{
                borderRadius: 14,
                padding: "16px",
                marginBottom: 14,
                background: `linear-gradient(135deg, ${accent.from}${isLightTheme ? "10" : "18"}, ${accent.to}${isLightTheme ? "05" : "10"})`,
                border: `1px solid ${accent.from}28`,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "none",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="14" rx="3" />
                    <path d="M8 20h8M10 9h4M8 13h8" />
                  </svg>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-main)",
                    }}
                  >
                    Agent Config
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Workspace gateway
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginBottom: 14,
                padding: 12,
                borderRadius: 14,
                background: configStatus?.supabase.configured
                  ? "rgba(34,197,94,0.08)"
                  : "var(--bg-btn-ghost)",
                border: configStatus?.supabase.configured
                  ? "1px solid rgba(34,197,94,0.24)"
                  : "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: "var(--text-main)",
                    }}
                  >
                    Environment Status
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 3,
                    }}
                  >
                    Paste env asli di .env, bukan di browser.
                  </div>
                </div>
                <NeonBadge
                  color={
                    configStatus?.supabase.configured ? "#22c55e" : "#f59e0b"
                  }
                >
                  {configStatus?.supabase.configured ? "ready" : "pending"}
                </NeonBadge>
              </div>
              <button
                type="button"
                onClick={checkConfigStatus}
                disabled={configChecking}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: configChecking
                    ? "var(--bg-btn-ghost)"
                    : `${accent.from}14`,
                  border: `1px solid ${accent.from}2f`,
                  color: configChecking ? "var(--text-muted)" : accent.from,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: configChecking ? "not-allowed" : "pointer",
                }}
              >
                {configChecking ? "Checking..." : "Check Env"}
              </button>
              {configStatus && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                    marginTop: 11,
                  }}
                >
                  {[
                    ["Supabase URL", configStatus.supabase.urlConfigured],
                    [
                      "Supabase anon key",
                      configStatus.supabase.anonKeyConfigured,
                    ],
                    [
                      "Service role key",
                      configStatus.supabase.serviceRoleConfigured,
                    ],
                  ].map(([label, ready]) => (
                    <div
                      key={label as string}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 11,
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>{label}</span>
                      <span
                        style={{
                          color: ready ? "#22c55e" : "#f59e0b",
                          fontWeight: 900,
                        }}
                      >
                        {ready ? "set" : "empty"}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 2,
                      padding: "8px 9px",
                      borderRadius: 10,
                      background: "var(--bg-input)",
                      color: "var(--text-muted)",
                      fontSize: 11,
                      wordBreak: "break-word",
                    }}
                  >
                    Project host:{" "}
                    {configStatus.supabase.projectHost || "not connected"}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      padding: "8px 9px",
                      borderRadius: 10,
                      background: configStatus.auth.configured
                        ? "rgba(34,197,94,0.08)"
                        : "var(--bg-input)",
                      border: configStatus.auth.configured
                        ? "1px solid rgba(34,197,94,0.20)"
                        : "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                      fontSize: 11,
                    }}
                  >
                    Auth store:{" "}
                    <span
                      style={{
                        color: configStatus.auth.configured
                          ? "#22c55e"
                          : "#f59e0b",
                        fontWeight: 900,
                      }}
                    >
                      {configStatus.auth.configured
                        ? configStatus.auth.userStore
                        : "needs setup"}
                    </span>
                    <div style={{ marginTop: 7, display: "grid", gap: 5 }}>
                      {[
                        ["JWT secret", configStatus.auth.jwtSecretConfigured],
                        ["Supabase Auth", configStatus.auth.userStoreSupabase],
                      ].map(([label, ready]) => (
                        <div
                          key={label as string}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <span>{label}</span>
                          <span
                            style={{
                              color: ready ? "#22c55e" : "#f59e0b",
                              fontWeight: 900,
                            }}
                          >
                            {ready ? "ready" : "empty"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      padding: "8px 9px",
                      borderRadius: 10,
                      background: configStatus.agentBridge.configured
                        ? "rgba(34,197,94,0.08)"
                        : "var(--bg-input)",
                      border: configStatus.agentBridge.configured
                        ? "1px solid rgba(34,197,94,0.20)"
                        : "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                      fontSize: 11,
                    }}
                  >
                    OpenClaw bridge:{" "}
                    <span
                      style={{
                        color: configStatus.agentBridge.configured
                          ? "#22c55e"
                          : "#f59e0b",
                        fontWeight: 900,
                      }}
                    >
                      {configStatus.agentBridge.configured
                        ? `ready (${configStatus.agentBridge.mode})`
                        : "empty"}
                    </span>
                    <div style={{ marginTop: 7, display: "grid", gap: 6 }}>
                      {configStatus.agentBridges.map((agent) => (
                        <div
                          key={agent.label}
                          style={{
                            padding: "7px 8px",
                            borderRadius: 9,
                            background: agent.configured
                              ? "rgba(34,197,94,0.07)"
                              : "rgba(245,158,11,0.08)",
                            border: agent.configured
                              ? "1px solid rgba(34,197,94,0.16)"
                              : "1px solid rgba(245,158,11,0.18)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                color: "var(--text-main)",
                                fontWeight: 900,
                              }}
                            >
                              {agent.label}
                            </span>
                            <span
                              style={{
                                color: agent.configured ? "#22c55e" : "#f59e0b",
                                fontWeight: 900,
                              }}
                            >
                              {agent.configured ? "ready" : "needs setup"}
                            </span>
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span>profile `{agent.profile}`</span>
                            <span>{agent.agentId}</span>
                          </div>
                          {agent.requiredProvider && (
                            <div
                              style={{
                                marginTop: 3,
                                color: agent.providerReady
                                  ? "#22c55e"
                                  : "#f59e0b",
                                fontWeight: 800,
                              }}
                            >
                              {agent.requiredProvider}:{" "}
                              {agent.providerReady ? "set" : "empty"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginBottom: 14,
                padding: 12,
                borderRadius: 14,
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.22)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 9,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: "var(--text-main)",
                    }}
                  >
                    User Roles
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 3,
                    }}
                  >
                    Kelola role Supabase Auth untuk RBAC dashboard.
                  </div>
                </div>
                <NeonBadge color="#60a5fa">admin</NeonBadge>
              </div>
              <button
                type="button"
                onClick={() => void loadAdminUsers()}
                disabled={adminUsersLoading}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: adminUsersLoading
                    ? "var(--bg-btn-ghost)"
                    : "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: adminUsersLoading
                    ? "var(--text-muted)"
                    : "var(--text-main)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: adminUsersLoading ? "not-allowed" : "pointer",
                }}
              >
                {adminUsersLoading ? "Loading users..." : "Load Users"}
              </button>
              {adminUsersError && (
                <div
                  style={{
                    marginTop: 9,
                    padding: "8px 9px",
                    borderRadius: 10,
                    background: "rgba(244,63,94,0.12)",
                    border: "1px solid rgba(244,63,94,0.24)",
                    color: "#fb7185",
                    fontSize: 11,
                    lineHeight: 1.45,
                  }}
                >
                  {adminUsersError}
                </div>
              )}
              {adminUsers.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {adminUsers.map((user) => {
                    const isCurrentUser =
                      currentUser.username.toLowerCase() ===
                      user.email.toLowerCase();
                    return (
                      <div
                        key={user.id}
                        style={{
                          padding: "9px 10px",
                          borderRadius: 11,
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 9,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: "var(--text-main)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {user.displayName}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                marginTop: 3,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {user.email || "no email"}
                              {isCurrentUser ? " - current session" : ""}
                            </div>
                          </div>
                          <select
                            value={user.role}
                            disabled={
                              updatingRoleUserId === user.id ||
                              (isCurrentUser && user.role === "admin")
                            }
                            onChange={(event) =>
                              void updateAdminUserRole(
                                user.id,
                                event.target.value as AdminUser["role"],
                              )
                            }
                            style={{
                              flexShrink: 0,
                              padding: "7px 8px",
                              borderRadius: 9,
                              background: "var(--bg-btn-ghost)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-main)",
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: 11,
                              fontWeight: 900,
                              cursor:
                                updatingRoleUserId === user.id
                                  ? "wait"
                                  : "pointer",
                            }}
                          >
                            <option value="member">member</option>
                            <option value="owner">owner</option>
                            <option value="admin">admin</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                marginBottom: 14,
                padding: 12,
                borderRadius: 14,
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.24)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 9,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: "var(--text-main)",
                    }}
                  >
                    Database Cleanup
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 3,
                    }}
                  >
                    Hapus chat dan forum content. Workspace, category, dan
                    channel tetap aman.
                  </div>
                </div>
                <NeonBadge color="#fb7185">admin</NeonBadge>
              </div>
              {cleanupResult && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 7,
                    marginBottom: 9,
                  }}
                >
                  {[
                    [
                      "Messages",
                      cleanupResult.counts?.messages ??
                        cleanupResult.deleted?.messages ??
                        0,
                    ],
                    [
                      "Posts",
                      cleanupResult.counts?.forum_posts ??
                        cleanupResult.deleted?.forum_posts ??
                        0,
                    ],
                    [
                      "Replies",
                      cleanupResult.counts?.forum_replies ??
                        cleanupResult.deleted?.forum_replies ??
                        0,
                    ],
                  ].map(([label, count]) => (
                    <div
                      key={label as string}
                      style={{
                        padding: "8px 7px",
                        borderRadius: 10,
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: "var(--text-main)",
                        }}
                      >
                        {count}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {cleanupResult?.error && (
                <div
                  style={{
                    marginBottom: 9,
                    padding: "8px 9px",
                    borderRadius: 10,
                    background: "rgba(244,63,94,0.12)",
                    border: "1px solid rgba(244,63,94,0.24)",
                    color: "#fb7185",
                    fontSize: 11,
                    lineHeight: 1.45,
                  }}
                >
                  {cleanupResult.error}
                </div>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => void runDatabaseCleanup(true)}
                  disabled={cleanupRunning}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 10,
                    background: cleanupRunning
                      ? "var(--bg-btn-ghost)"
                      : "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: cleanupRunning
                      ? "var(--text-muted)"
                      : "var(--text-main)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: cleanupRunning ? "not-allowed" : "pointer",
                  }}
                >
                  {cleanupRunning ? "Working..." : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={() => void runDatabaseCleanup(false)}
                  disabled={cleanupRunning}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 10,
                    background: cleanupRunning
                      ? "var(--bg-btn-ghost)"
                      : "rgba(244,63,94,0.92)",
                    border: "1px solid rgba(244,63,94,0.35)",
                    color: cleanupRunning ? "var(--text-muted)" : "#fff",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: cleanupRunning ? "not-allowed" : "pointer",
                    boxShadow: "none",
                  }}
                >
                  Run Cleanup
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                Env Slots
              </div>
              <pre
                style={{
                  margin: 0,
                  maxHeight: 176,
                  overflow: "auto",
                  padding: 10,
                  borderRadius: 10,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  opacity: 0.7,
                  fontSize: 10,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {ENV_TEMPLATE}
              </pre>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(ENV_TEMPLATE)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "8px 9px",
                  borderRadius: 10,
                  background: "var(--bg-btn-ghost)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Copy env template
              </button>
            </div>

            {configStatus && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  API Providers
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 7,
                  }}
                >
                  {configStatus.providers.map((provider) => (
                    <div
                      key={provider.key}
                      style={{
                        padding: "8px 9px",
                        borderRadius: 10,
                        background: provider.configured
                          ? "rgba(34,197,94,0.08)"
                          : "var(--bg-btn-ghost)",
                        border: provider.configured
                          ? "1px solid rgba(34,197,94,0.2)"
                          : "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "var(--text-main)",
                        }}
                      >
                        {provider.label}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: provider.configured
                            ? "#22c55e"
                            : "var(--text-muted)",
                          marginTop: 3,
                        }}
                      >
                        {provider.configured ? "ready" : "empty"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                Active Agent
              </div>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value as AgentName)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                {AGENT_OPTIONS.map((agent) => {
                  const profile = visibleProfiles.find(
                    (item) => item.name === agent,
                  );
                  return (
                    <option key={agent} value={agent}>
                      {agent} - {profile?.role || "AI agent"}
                    </option>
                  );
                })}
              </select>
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: `${selectedAgentProfile?.accent[0] || accent.from}10`,
                  border: `1px solid ${selectedAgentProfile?.accent[0] || accent.from}24`,
                  color: "var(--text-muted)",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                Semua text channel, termasuk #{activeChannel}, akan dikirim ke{" "}
                <span style={{ color: "var(--text-main)", fontWeight: 800 }}>
                  {selectedAgent}
                </span>
                .
                {selectedAgentStatus && !selectedAgentStatus.configured ? (
                  <span style={{ color: "#f59e0b", fontWeight: 800 }}>
                    {" "}
                    Status: perlu{" "}
                    {selectedAgentStatus.requiredProvider || "env profile"}.
                  </span>
                ) : null}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                Model
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                {MODEL_PREFERENCES.map((group) => (
                  <optgroup
                    key={group.provider}
                    label={`${group.provider} - ${group.tone}`}
                  >
                    {group.models.map((model) => (
                      <option key={`${group.provider}-${model}`} value={model}>
                        {model}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: `${accent.from}10`,
                  border: `1px solid ${accent.from}24`,
                  color: "var(--text-muted)",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                  {selectedModelPreference.provider}
                </span>
                {" · "}
                {selectedModelPreference.tone}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Developer Tools
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(
                  Object.entries(developerTools) as [DeveloperTool, boolean][]
                ).map(([tool, on]) => {
                  return (
                    <div
                      key={tool}
                      onClick={() => toggleDeveloperTool(tool)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        background: on
                          ? `${accent.from}14`
                          : "var(--bg-btn-ghost)",
                        border: on
                          ? `1px solid ${accent.from}33`
                          : "1px solid var(--border-subtle)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: on ? "var(--text-main)" : "var(--text-muted)",
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        {tool}
                      </span>
                      <div
                        style={{
                          width: 34,
                          height: 19,
                          borderRadius: 999,
                          padding: 2,
                          background: on
                            ? `linear-gradient(90deg, ${accent.from}, ${accent.to})`
                            : "var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: on ? "flex-end" : "flex-start",
                          transition: "all 0.2s",
                          boxShadow: "none",
                        }}
                      >
                        <div
                          style={{
                            width: 15,
                            height: 15,
                            borderRadius: "50%",
                            background: "#fff",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                border: "none",
                color: "white",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "none",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Save Configuration
            </button>
          </div>
        )}
      </RightNavbarShell>

      {(showInviteModal || showSettingsModal) && (
        <div
          onClick={() => {
            setShowInviteModal(false);
            setShowSettingsModal(false);
          }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.48)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(460px, calc(100% - 32px))",
              borderRadius: 20,
              padding: 20,
              background: "var(--bg-popover)",
              border: `1px solid ${accent.from}30`,
              boxShadow: "0 28px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text-main)",
                  }}
                >
                  {showInviteModal ? "Invite People" : "Server Settings"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 3,
                  }}
                >
                  {showInviteModal
                    ? activeWsData.name
                    : "Basic workspace and channel config"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setShowSettingsModal(false);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "var(--bg-btn-ghost)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {showInviteModal ? (
              <>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 12,
                  }}
                >
                  https://agentspace.local/invite/{activeWsData.id}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `https://agentspace.local/invite/${activeWsData.id}`,
                    );
                    window.alert("Invite link disalin.");
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 13,
                    border: "none",
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    color: "white",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Copy Invite Link
                </button>
              </>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <label style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    Announcement
                  </span>
                  <input
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      outline: "none",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12,
                    }}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    Channel Topic
                  </span>
                  <textarea
                    value={channelTopic}
                    onChange={(e) => setChannelTopic(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{
                    padding: 12,
                    borderRadius: 13,
                    border: "none",
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    color: "white",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

	        :root {
	          --bg-app: #111318;
	          --bg-rail: rgba(15, 17, 21, 0.92);
	          --bg-sidebar: rgba(18, 20, 25, 0.90);
	          --bg-header: rgba(18, 20, 25, 0.82);
	          --bg-input: rgba(255, 255, 255, 0.055);
	          --bg-popover: rgba(22, 24, 29, 0.98);
	          --bg-btn-ghost: rgba(255, 255, 255, 0.07);
	          --bg-btn-ghost-hover: rgba(255, 255, 255, 0.12);
	          --surface: rgba(18, 20, 25, 0.88);
	          --surface-strong: rgba(18, 20, 25, 0.94);
	          --composer-bg: linear-gradient(to top, rgba(13, 15, 18, 0.95), rgba(13, 15, 18, 0.70));
	          --text-main: #f1f5f9;
	          --text-muted: rgba(241, 245, 249, 0.64);
	          --border-subtle: rgba(255, 255, 255, 0.11);
	          --grid-line: rgba(255, 255, 255, 0.026);
	          --shadow-panel: 12px 0 34px rgba(0, 0, 0, 0.22);
	          --shadow-card: 0 18px 48px rgba(0, 0, 0, 0.20), 0 1px 0 rgba(255,255,255,0.08) inset;
	          --shadow-soft: 0 10px 26px rgba(0,0,0,0.14);
	          --shadow-message: 0 10px 24px rgba(0,0,0,0.16);
	          --shadow-composer: 0 16px 38px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.08) inset;
	          --shadow-inset: 0 1px 0 rgba(255,255,255,0.06) inset;
	        }

	        .theme-light {
	          --bg-app: #f7f8fa;
	          --bg-rail: rgba(255, 255, 255, 0.86);
	          --bg-sidebar: rgba(255, 255, 255, 0.86);
	          --bg-header: rgba(255, 255, 255, 0.82);
	          --bg-input: rgba(15, 23, 42, 0.055);
	          --bg-popover: #ffffff;
	          --bg-btn-ghost: rgba(15, 23, 42, 0.055);
          --bg-btn-ghost-hover: rgba(15, 23, 42, 0.090);
          --surface: rgba(255, 255, 255, 0.80);
          --surface-strong: rgba(255, 255, 255, 0.95);
	          --composer-bg: linear-gradient(to top, rgba(237,244,255,0.97), rgba(237,244,255,0.76));
	          --text-main: #0f172a;
	          --text-muted: #64748b;
	          --border-subtle: rgba(15, 23, 42, 0.10);
          --grid-line: rgba(15, 23, 42, 0.055);
          --shadow-panel: 14px 0 34px rgba(15, 23, 42, 0.07);
          --shadow-card: 0 24px 60px rgba(15, 23, 42, 0.10), 0 1px 0 rgba(255,255,255,0.9) inset;
          --shadow-soft: 0 12px 30px rgba(15,23,42,0.08);
          --shadow-message: 0 14px 34px rgba(15,23,42,0.09);
          --shadow-composer: 0 20px 46px rgba(15,23,42,0.12), 0 1px 0 rgba(255,255,255,0.9) inset;
          --shadow-inset: 0 1px 0 rgba(255,255,255,0.8) inset;
        }

        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
	        ::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
	        input::placeholder { color: var(--text-muted) !important; opacity: 0.7; }
          button, input, textarea, select {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
          button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
            outline: 2px solid rgba(34, 211, 238, 0.55);
            outline-offset: 2px;
          }
	        select option { background: var(--bg-popover); color: var(--text-main); }
	        .header-actions {
	          scrollbar-width: none;
	          -ms-overflow-style: none;
	        }
	        .header-actions::-webkit-scrollbar {
	          display: none;
	        }
          @media (pointer: coarse), (max-width: 820px) {
            .agentspace-shell button {
              min-width: 42px;
              min-height: 42px;
            }

            .agentspace-shell input,
            .agentspace-shell textarea,
            .agentspace-shell select {
              min-height: 42px;
              font-size: 16px !important;
            }

            .agentspace-shell button[title^="Hapus"],
            .agentspace-shell button[aria-label^="Hapus"] {
              min-width: 24px;
              min-height: 24px;
            }
          }
	      `}</style>
    </div>
  );
}
