"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import Image from "next/image";

type Accent = {
  from: string;
  to: string;
};

type AccentPair = [string, string];

type ChannelType = "text" | "forum";

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
  author: string;
  time: string;
  ai: boolean;
  text: string;
  image?: string;
  imageName?: string;
};

type AttachedImage = {
  src: string;
  name: string;
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

const ACCENTS: Accent[] = [
  { from: "#22d3ee", to: "#10b981" },
  { from: "#a78bfa", to: "#ec4899" },
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#34d399", to: "#06b6d4" },
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
    ],
  },
];

const initialMessages: ChatMessage[] = [
  { author: "Ardian", time: "19:52", ai: false, text: "Aku mau bikin dashboard AI yang mirip Discord, tapi MVP dulu: satu kategori, satu channel, dan satu forum." },
  { author: "AgentSpace AI", time: "19:53", ai: true, text: "Bisa. Fokus awalnya: kategori Portfolio, channel #ide-project untuk chat AI, dan forum-review untuk menyimpan diskusi ide." },
  { author: "Ardian", time: "19:55", ai: false, text: "Jadi jangan terlalu banyak fitur dulu, yang penting bentuk dashboard-nya jelas." },
  { author: "AgentSpace AI", time: "19:56", ai: true, text: "Siap. Setelah layout ini stabil, baru kita tambah tombol create category, create channel, dan create forum secara bertahap." },
];

const profiles: Profile[] = [
  { name: "Ardian", role: "Owner", initials: "A", accent: ["#6b7280","#374151"], status: "dnd", crown: true },
  { name: "MASBRE", role: "AI lead assistant", initials: "MB", accent: ["#22d3ee","#3b82f6"], status: "online", app: true },
  { name: "MASBRO", role: "AI support", initials: "MO", accent: ["#fbbf24","#f97316"], status: "online", app: true },
  { name: "MASSEH", role: "AI reviewer", initials: "MS", accent: ["#34d399","#14b8a6"], status: "online", app: true },
];

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
    models: [
      "grok-4",
      "grok-3",
      "grok-3-mini",
      "grok-2-vision",
    ],
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
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 14,
        background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.3, fontWeight: 800, color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: `0 0 16px ${accent[0]}44`,
      }}>{initials}</div>
      {(online !== undefined || dnd !== undefined) && (
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          width: 11, height: 11, borderRadius: "50%",
          background: dnd ? "#f43f5e" : "#22c55e",
          border: "2px solid #060d1a",
        }} />
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
    <span style={{
      padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}44`,
      letterSpacing: "0.02em",
    }}>{children}</span>
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

export default function AgentSpaceDashboard() {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [activeWs, setActiveWs] = useState("agentspace");
  const [categories, setCategories] = useState(initialCategories);
  const [activeChannel, setActiveChannel] = useState("ide-project");
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [rightPanel, setRightPanel] = useState("profiles");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<ChannelType>("text");
  const [targetCategory, setTargetCategory] = useState(initialCategories[0].name);
  const [developerTools, setDeveloperTools] = useState(initialDeveloperTools);
  const [selectedModel, setSelectedModel] = useState(MODEL_PREFERENCES[0].models[0]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const msgEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isForum = categories.flatMap(c => c.channels).find(c => c.name === activeChannel)?.type === "forum";

  function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim() && !attachedImage) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    setMessages(m => [
      ...m,
      {
        author: "Ardian",
        time,
        ai: false,
        text: draft.trim(),
        image: attachedImage?.src,
        imageName: attachedImage?.name,
      },
    ]);
    setDraft("");
    setAttachedImage(null);
  }

  function addWorkspace(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const workspaceName = newWorkspaceName.trim();
    if (!workspaceName) return;

    const baseId = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `workspace-${workspaces.length + 1}`;
    let workspaceId = baseId;
    let counter = 2;

    while (workspaces.some(ws => ws.id === workspaceId)) {
      workspaceId = `${baseId}-${counter}`;
      counter += 1;
    }

    const initials = workspaceName
      .split(/\s+/)
      .map(word => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const workspace: Workspace = {
      id: workspaceId,
      initials: initials || "WS",
      name: workspaceName,
      accentIdx: workspaces.length % ACCENTS.length,
    };

    setWorkspaces(current => [...current, workspace]);
    setActiveWs(workspace.id);
    setNewWorkspaceName("");
    setShowWorkspaceForm(false);
  }

  function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const categoryName = newCategoryName.trim();
    if (!categoryName) return;

    setCategories(current => [
      ...current,
      { name: categoryName, channels: [] },
    ]);
    setTargetCategory(categoryName);
    setNewCategoryName("");
    setShowCategoryForm(false);
  }

  function openChannelForm(categoryName: string) {
    setTargetCategory(categoryName);
    setShowChannelForm(true);
    setShowCategoryForm(false);
  }

  function addChannel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const channelName = newChannelName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!channelName || !targetCategory) return;

    setCategories(current =>
      current.map(category =>
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
    setNewChannelName("");
    setNewChannelType("text");
    setShowChannelForm(false);
  }

  function attachImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage({ src: reader.result, name: file.name });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function toggleDeveloperTool(tool: DeveloperTool) {
    setDeveloperTools(current => ({
      ...current,
      [tool]: !current[tool],
    }));
  }

  const activeWsData = workspaces.find(w => w.id === activeWs) || workspaces[0];
  const accent = ACCENTS[activeWsData.accentIdx];
  const selectedModelPreference = MODEL_PREFERENCES.find(group =>
    group.models.includes(selectedModel),
  ) || MODEL_PREFERENCES[0];

  return (
    <div style={{
      display: "flex", height: "100vh", background: "#060d1a",
      color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif",
      overflow: "hidden", position: "relative",
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 50% at 15% 0%, ${accent.from}18 0%, transparent 60%),
                     radial-gradient(ellipse 40% 30% at 85% 80%, #a78bfa14 0%, transparent 50%),
                     radial-gradient(ellipse 30% 25% at 50% 50%, #06b6d408 0%, transparent 60%)`,
      }} />

      {/* Workspace rail */}
      <div style={{
        width: 68, flexShrink: 0, background: "rgba(6,13,26,0.9)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "16px 0", gap: 10, zIndex: 10, position: "relative",
      }}>
        {/* Logo */}
        <div style={{
          width: 44, height: 44, borderRadius: 14, marginBottom: 4,
          background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 24px ${accent.from}55`,
          cursor: "pointer", transition: "transform 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#060d1a" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>

        <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.08)" }} />

        {workspaces.map(ws => {
          const wAccent = ACCENTS[ws.accentIdx];
          const isActive = ws.id === activeWs;
          return (
            <button key={ws.id} onClick={() => setActiveWs(ws.id)} style={{
              width: 44, height: 44, borderRadius: isActive ? 14 : 20,
              background: isActive ? `linear-gradient(135deg, ${wAccent.from}, ${wAccent.to})` : "rgba(255,255,255,0.06)",
              border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
              color: isActive ? "#060d1a" : "rgba(255,255,255,0.5)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13, fontWeight: 800, cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: isActive ? `0 0 20px ${wAccent.from}55` : "none",
            }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderRadius = "14px"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderRadius = "20px"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}}
            >{ws.initials}</button>
          );
        })}

        {/* Add workspace */}
        <button
          title="Add workspace"
          onClick={() => setShowWorkspaceForm(true)}
          style={{
          width: 44, height: 44, borderRadius: 20, marginTop: 4,
          background: "rgba(34,211,238,0.08)",
          border: "1px dashed rgba(34,211,238,0.3)",
          color: "#22d3ee", cursor: "pointer", fontSize: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.15)"; e.currentTarget.style.borderRadius = "14px"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,211,238,0.08)"; e.currentTarget.style.borderRadius = "20px"; }}
        >+</button>

        {showWorkspaceForm && (
          <form onSubmit={addWorkspace} style={{
            position: "absolute", left: 76, top: 170, width: 214,
            padding: 12, borderRadius: 14,
            background: "rgba(8,14,26,0.98)",
            border: `1px solid ${accent.from}36`,
            boxShadow: `0 20px 48px rgba(0,0,0,0.45), 0 0 24px ${accent.from}18`,
            backdropFilter: "blur(16px)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
              Tambah workspace
            </div>
            <input
              autoFocus
              value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              placeholder="Nama workspace"
              style={{
                width: "100%", padding: "9px 10px", borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#e2e8f0", outline: "none",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 12,
              }}
            />
            <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
              <button type="submit" style={{
                flex: 1, padding: "8px 9px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                color: "#060d1a", fontWeight: 800, cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
              }}>Add</button>
              <button type="button" onClick={() => setShowWorkspaceForm(false)} style={{
                flex: 1, padding: "8px 9px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.55)", cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
              }}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ flex: 1 }} />

        {/* User avatar at bottom */}
        <Avatar initials="A" accent={["#6b7280","#374151"]} size={40} dnd />
      </div>

      {/* Channel sidebar */}
      <div style={{
        width: sidebarCollapsed ? 0 : 240,
        flexShrink: 0, overflow: "hidden",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        background: "rgba(8,14,26,0.85)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column",
        zIndex: 9,
      }}>
        {/* Workspace header */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#060d1a",
                boxShadow: `0 0 12px ${accent.from}44`,
              }}>{activeWsData.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.2 }}>{activeWsData.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>AI workspace</div>
              </div>
            </div>
            <button onClick={() => setSidebarCollapsed(true)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.3)",
              cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: 0,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          </div>
          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "7px 12px",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Search channels...</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", borderRadius: 5, padding: "1px 5px" }}>⌘K</span>
          </div>
        </div>

        {/* Categories */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {categories.map(cat => (
            <div key={cat.name} style={{ marginBottom: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 8px", marginBottom: 2,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{cat.name}</span>
                <button
                  title={`Add channel to ${cat.name}`}
                  onClick={() => openChannelForm(cat.name)}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", padding: 0, lineHeight: 0, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#22d3ee"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              {cat.channels.map(ch => {
                const isActive = activeChannel === ch.name;
                return (
                  <button key={ch.name}
                    onClick={() => setActiveChannel(ch.name)}
                    onMouseEnter={() => setHoveredChannel(ch.name)}
                    onMouseLeave={() => setHoveredChannel(null)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: isActive ? `linear-gradient(90deg, ${accent.from}22, ${accent.to}14)` : hoveredChannel === ch.name ? "rgba(255,255,255,0.04)" : "transparent",
                      color: isActive ? "#f1f5f9" : "rgba(255,255,255,0.45)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      marginBottom: 2, transition: "all 0.15s",
                      borderLeft: isActive ? `2px solid ${accent.from}` : "2px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 14, color: isActive ? accent.from : "rgba(255,255,255,0.25)" }}>
                      {ch.type === "forum" ? "◈" : "#"}
                    </span>
                    {ch.name}
                    {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: accent.from, boxShadow: `0 0 8px ${accent.from}` }} />}
                  </button>
                );
              })}
            </div>
          ))}

          {showCategoryForm && (
            <form onSubmit={addCategory} style={{
              margin: "8px 0 10px", padding: 10, borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${accent.from}28`,
            }}>
              <input
                autoFocus
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 9,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 12,
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button type="submit" style={{
                  flex: 1, padding: "7px 8px", borderRadius: 9, border: "none",
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  color: "#060d1a", fontWeight: 800, cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
                }}>Add</button>
                <button type="button" onClick={() => setShowCategoryForm(false)} style={{
                  flex: 1, padding: "7px 8px", borderRadius: 9,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)", cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
                }}>Cancel</button>
              </div>
            </form>
          )}

          {showChannelForm && (
            <form onSubmit={addChannel} style={{
              margin: "8px 0 10px", padding: 10, borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${accent.from}28`,
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 7 }}>
                Channel untuk {targetCategory}
              </div>
              <input
                autoFocus
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="nama-channel"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 9,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 12,
                }}
              />
              <select
                value={newChannelType}
                onChange={e => setNewChannelType(e.target.value as ChannelType)}
                style={{
                  width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 9,
                  background: "rgba(8,14,26,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 12,
                }}
              >
                <option value="text">Text channel</option>
                <option value="forum">Forum channel</option>
              </select>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button type="submit" style={{
                  flex: 1, padding: "7px 8px", borderRadius: 9, border: "none",
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  color: "#060d1a", fontWeight: 800, cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
                }}>Add</button>
                <button type="button" onClick={() => setShowChannelForm(false)} style={{
                  flex: 1, padding: "7px 8px", borderRadius: 9,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)", cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
                }}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom actions */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 6 }}>
          {[
            { label: "+ Category", action: () => { setShowCategoryForm(true); setShowChannelForm(false); } },
            { label: "+ Channel", action: () => openChannelForm(categories[0]?.name || "") },
          ].map((item, i) => (
            <button key={item.label} onClick={item.action} style={{
              flex: 1, padding: "8px 6px", borderRadius: 10,
              background: i === 1 ? `linear-gradient(135deg, ${accent.from}, ${accent.to})` : "rgba(255,255,255,0.05)",
              border: i === 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              color: i === 1 ? "#060d1a" : "rgba(255,255,255,0.5)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s", boxShadow: i === 1 ? `0 0 16px ${accent.from}44` : "none",
            }}
              onMouseEnter={e => { if (i === 0) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { if (i === 0) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >{item.label}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, zIndex: 8 }}>
        {/* Header */}
        <div style={{
          height: 60, flexShrink: 0, display: "flex", alignItems: "center",
          padding: "0 20px", gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(6,13,26,0.7)", backdropFilter: "blur(20px)",
        }}>
          {sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(false)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.4)",
              cursor: "pointer", padding: 4, lineHeight: 0, transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          )}

          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `linear-gradient(135deg, ${accent.from}33, ${accent.to}22)`,
            border: `1px solid ${accent.from}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent.from, fontSize: 15,
          }}>
            {isForum ? "◈" : "#"}
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>{activeChannel}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
              {isForum ? "Forum · discuss ideas & get reviews" : "Text channel · brainstorm & plan"}
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {[
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="17" cy="21" r="3"/><circle cx="7" cy="21" r="3"/><path d="M13 21V7a4 4 0 0 0-8 0v14"/><path d="M13 7a4 4 0 0 1 8 0v2h-8"/></svg>, label: "Threads" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: "Members" },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, label: "Search" },
            ].map(({ icon, label }) => (
              <button key={label} title={label} style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.4)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f1f5f9"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >{icon}</button>
            ))}
          </div>
        </div>

        {/* Chat / Forum area */}
        {isForum ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {/* Forum hero */}
            <div style={{
              borderRadius: 20, padding: "24px 28px", marginBottom: 20,
              background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}10, rgba(8,14,26,0.9))`,
              border: `1px solid ${accent.from}22`,
            }}>
              <NeonBadge color={accent.from}>forum-review</NeonBadge>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "12px 0 8px" }}>Idea Review Board</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 500 }}>
                Post portfolio ideas, get AI reviews, break them into scope and actionable tasks.
              </div>
              <button style={{
                marginTop: 16, padding: "10px 20px", borderRadius: 12,
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                border: "none", color: "#060d1a", fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: `0 0 20px ${accent.from}44`,
                display: "flex", alignItems: "center", gap: 8, transition: "transform 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New post
              </button>
            </div>

            {/* Post card */}
            {[{
              title: "Ide Porto: AI Workspace Dashboard Mirip Discord",
              replies: 4, tag: "Portfolio", status: "Ready for review",
            }].map(post => (
              <div key={post.title} style={{
                borderRadius: 18, padding: "20px 24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer", transition: "all 0.25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.055)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = `${accent.from}44`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <NeonBadge color={accent.from}>{post.tag}</NeonBadge>
                  <NeonBadge color="#22c55e">{post.status}</NeonBadge>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>{post.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Review konsep, fitur MVP, stack, dan roadmap supaya project portfolio-nya jelas dari awal.
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.25)", display: "flex", gap: 16 }}>
                  <span>{post.replies} replies</span>
                  <span>Last activity: today</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
              {/* AI persona banner */}
              <div style={{
                borderRadius: 18, padding: "16px 20px", marginBottom: 24,
                background: `linear-gradient(135deg, ${accent.from}15, ${accent.to}0a, rgba(8,14,26,0.8))`,
                border: `1px solid ${accent.from}28`,
                display: "flex", alignItems: "flex-start", gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 16px ${accent.from}55`,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#060d1a" strokeWidth="2.5"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg>
                </div>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>AI Persona Active</span>
                    <NeonBadge color="#22c55e">Online</NeonBadge>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                    Portfolio mentor mode. Helps turn rough ideas into scope, MVP features, stack decisions, and realistic roadmaps.
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    flexDirection: msg.ai ? "row" : "row-reverse",
                  }}>
                    <Avatar
                      initials={msg.ai ? "AI" : "A"}
                      accent={msg.ai ? [accent.from, accent.to] : ["#6b7280", "#374151"]}
                      size={36}
                    />
                    <div style={{
                      maxWidth: "72%", borderRadius: 16,
                      borderTopLeftRadius: msg.ai ? 4 : 16,
                      borderTopRightRadius: msg.ai ? 16 : 4,
                      padding: "12px 16px",
                      background: msg.ai
                        ? "rgba(255,255,255,0.05)"
                        : `linear-gradient(135deg, ${accent.from}22, ${accent.to}18)`,
                      border: msg.ai
                        ? "1px solid rgba(255,255,255,0.07)"
                        : `1px solid ${accent.from}33`,
                    }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6, flexDirection: msg.ai ? "row" : "row-reverse" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: msg.ai ? accent.from : "#94a3b8" }}>{msg.author}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{msg.time}</span>
                      </div>
                      {msg.image && (
                        <div style={{
                          overflow: "hidden", borderRadius: 12, marginTop: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.18)",
                        }}>
                          <Image
                            src={msg.image}
                            alt={msg.imageName || "Chat attachment"}
                            width={640}
                            height={360}
                            unoptimized
                            style={{
                              display: "block", width: "100%", maxHeight: 260,
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}
                      {msg.text && (
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginTop: msg.image ? 8 : 0 }}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={msgEndRef} />
              </div>
            </div>

            {/* Message input */}
            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <form onSubmit={sendMessage} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 16, padding: "8px 14px",
                transition: "border-color 0.2s",
              }}
                onFocus={e => e.currentTarget.style.borderColor = `${accent.from}66`}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"}
              >
                {attachedImage && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 9, padding: 7, borderRadius: 12,
                    background: `${accent.from}12`,
                    border: `1px solid ${accent.from}2f`,
                  }}>
                    <Image
                      src={attachedImage.src}
                      alt={attachedImage.name}
                      width={44}
                      height={44}
                      unoptimized
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                    />
                    <div style={{
                      flex: 1, minWidth: 0, fontSize: 11, fontWeight: 700,
                      color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {attachedImage.name}
                    </div>
                    <button type="button" onClick={() => setAttachedImage(null)} style={{
                      width: 28, height: 28, borderRadius: 9,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.55)", cursor: "pointer",
                    }}>×</button>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={attachImage}
                    style={{ display: "none" }}
                  />
                  <button type="button" onClick={() => imageInputRef.current?.click()} style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    color: "rgba(255,255,255,0.3)", lineHeight: 0, transition: "color 0.2s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = accent.from}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </button>
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={`Message #${activeChannel}`}
                    style={{
                      flex: 1, background: "none", border: "none",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13, color: "#e2e8f0", outline: "none",
                    }}
                  />
                  <button type="submit" disabled={!draft.trim() && !attachedImage} style={{
                    width: 32, height: 32, borderRadius: 10, border: "none", cursor: (!draft.trim() && !attachedImage) ? "not-allowed" : "pointer",
                    background: (draft.trim() || attachedImage) ? `linear-gradient(135deg, ${accent.from}, ${accent.to})` : "rgba(255,255,255,0.06)",
                    color: (draft.trim() || attachedImage) ? "#060d1a" : "rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", flexShrink: 0,
                    boxShadow: (draft.trim() || attachedImage) ? `0 0 16px ${accent.from}55` : "none",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Right panel */}
      <div style={{
        width: 260, flexShrink: 0,
        background: "rgba(8,14,26,0.85)",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", zIndex: 8,
      }}>
        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, padding: "14px 14px 0",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          {[["profiles", "Members"], ["config", "Config"]].map(([id, label]) => (
            <button key={id} onClick={() => setRightPanel(id)} style={{
              flex: 1, padding: "8px 0 12px",
              background: "none", border: "none",
              borderBottom: rightPanel === id ? `2px solid ${accent.from}` : "2px solid transparent",
              color: rightPanel === id ? "#f1f5f9" : "rgba(255,255,255,0.35)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "color 0.2s", letterSpacing: "0.03em",
            }}>{label}</button>
          ))}
        </div>

        {rightPanel === "profiles" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[["Online", "4"], ["AI", "3"], ["Users", "1"]].map(([label, val]) => (
                <div key={label} style={{
                  borderRadius: 12, padding: "10px 8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>
              Online — {profiles.length}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {profiles.map(p => (
                <div key={p.name} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px", borderRadius: 12, cursor: "pointer",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Avatar initials={p.initials} accent={p.accent} size={38} online={p.status === "online"} dnd={p.status === "dnd"} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                      {p.crown && <svg width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1"><path d="M2 20h20M5 20V8l7-5 7 5v12"/></svg>}
                      {p.app && <span style={{ fontSize: 10, background: "#4f46e5", color: "#c7d2fe", borderRadius: 5, padding: "1px 5px", fontWeight: 700 }}>APP</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            {/* Config header card */}
            <div style={{
              borderRadius: 14, padding: "16px", marginBottom: 14,
              background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}10)`,
              border: `1px solid ${accent.from}28`,
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 14px ${accent.from}55`,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#060d1a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="14" rx="3" />
                    <path d="M8 20h8M10 9h4M8 13h8" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Agent Config</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Workspace gateway</div>
                </div>
              </div>
            </div>

            {[
              { label: "Endpoint", placeholder: "http://localhost:7331", type: "text" },
              { label: "API Key", placeholder: "oc_sk_...", type: "password" },
              { label: "Project ID", placeholder: "ai-agentspace-dashboard", type: "text" },
            ].map(field => (
              <div key={field.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>{field.label}</div>
                <input type={field.type} placeholder={field.placeholder} style={{
                  width: "100%", padding: "9px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12, outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                  onFocus={e => e.currentTarget.style.borderColor = `${accent.from}66`}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Model</div>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                width: "100%", padding: "9px 12px", borderRadius: 10,
                background: "rgba(8,14,26,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 12, outline: "none", boxSizing: "border-box",
              }}>
                {MODEL_PREFERENCES.map(group => (
                  <optgroup key={group.provider} label={`${group.provider} - ${group.tone}`}>
                    {group.models.map(model => (
                      <option key={`${group.provider}-${model}`} value={model}>
                        {model}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div style={{
                marginTop: 8, padding: "8px 10px", borderRadius: 10,
                background: `${accent.from}10`,
                border: `1px solid ${accent.from}24`,
                color: "rgba(255,255,255,0.48)", fontSize: 11, lineHeight: 1.5,
              }}>
                <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{selectedModelPreference.provider}</span>
                {" · "}
                {selectedModelPreference.tone}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Developer Tools</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(developerTools) as [DeveloperTool, boolean][]).map(([tool, on]) => {
                  return (
                    <div key={tool} onClick={() => toggleDeveloperTool(tool)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                      background: on ? `${accent.from}14` : "rgba(255,255,255,0.03)",
                      border: on ? `1px solid ${accent.from}33` : "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 12, color: on ? "#e2e8f0" : "rgba(255,255,255,0.4)", fontWeight: on ? 600 : 400 }}>{tool}</span>
                      <div style={{
                        width: 34, height: 19, borderRadius: 999, padding: 2,
                        background: on ? `linear-gradient(90deg, ${accent.from}, ${accent.to})` : "rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center",
                        justifyContent: on ? "flex-end" : "flex-start",
                        transition: "all 0.2s", boxShadow: on ? `0 0 10px ${accent.from}55` : "none",
                      }}>
                        <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#fff" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button style={{
              width: "100%", padding: "12px", borderRadius: 12,
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              border: "none", color: "#060d1a",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 0 24px ${accent.from}44`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 28px ${accent.from}66`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 0 24px ${accent.from}44`; }}
            >Save Configuration</button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        select option { background: #060d1a; }
      `}</style>
    </div>
  );
}
