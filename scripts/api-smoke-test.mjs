import { spawn } from "node:child_process";
import process from "node:process";

const port = Number(process.env.SMOKE_TEST_PORT || 3100);
const baseUrl = `http://127.0.0.1:${port}`;
const startupTimeoutMs = 30_000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  return spawn("npm", ["run", "start", "--", "--port", String(port)], {
    env: {
      ...process.env,
      PORT: String(port),
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function waitForServer() {
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < startupTimeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/docs/openapi`);
      if (response.ok) return;
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await wait(500);
  }

  throw new Error(`Dev server did not start within ${startupTimeoutMs}ms: ${lastError}`);
}

async function expectJson(path, expectedStatus, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
    ...init,
  });
  const data = await response.json().catch(() => null);

  if (response.status !== expectedStatus) {
    throw new Error(`${path} expected ${expectedStatus}, got ${response.status}`);
  }

  return { response, data };
}

async function runAssertions() {
  const openApi = await expectJson("/api/docs/openapi", 200);

  if (openApi.data?.openapi !== "3.0.3") {
    throw new Error("/api/docs/openapi did not return OpenAPI 3.0.3");
  }

  const requiredPaths = [
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/auth/me",
    "/api/auth/register",
    "/api/dashboard/data",
    "/api/categories",
    "/api/channels",
    "/api/messages",
    "/api/messages/{id}",
    "/api/forum-posts",
    "/api/forum-posts/{id}/replies",
    "/api/workspace-members",
    "/api/agents/invoke",
    "/api/admin/users",
    "/api/admin/cleanup",
  ];

  for (const path of requiredPaths) {
    if (!openApi.data.paths?.[path]) {
      throw new Error(`OpenAPI document is missing ${path}`);
    }
  }

  const me = await expectJson("/api/auth/me", 401);
  if (me.data?.ok !== false) {
    throw new Error("/api/auth/me should reject unauthenticated requests");
  }

  const dashboard = await expectJson("/api/dashboard/data", 401);
  if (dashboard.data?.ok !== false) {
    throw new Error("/api/dashboard/data should reject unauthenticated requests");
  }

  const config = await expectJson("/api/config/status", 401);
  if (config.data?.ok !== false) {
    throw new Error("/api/config/status should reject unauthenticated requests");
  }

  const adminUsers = await expectJson("/api/admin/users", 401);
  if (adminUsers.data?.ok !== false) {
    throw new Error("/api/admin/users should reject unauthenticated requests");
  }

  const workspaceMembers = await expectJson("/api/workspace-members", 401);
  if (workspaceMembers.data?.ok !== false) {
    throw new Error("/api/workspace-members should reject unauthenticated requests");
  }

  const createCategory = await expectJson("/api/categories", 401, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Smoke Test" }),
  });
  if (createCategory.data?.ok !== false) {
    throw new Error("/api/categories should reject unauthenticated writes");
  }
}

async function main() {
  const server = startServer();
  let stderr = "";

  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();
    await runAssertions();
    console.log("API smoke test passed.");
  } finally {
    server.kill("SIGTERM");
    await wait(500);
    if (!server.killed) {
      server.kill("SIGKILL");
    }
  }

  if (stderr.toLowerCase().includes("eaddrinuse")) {
    throw new Error(`Port ${port} is already in use.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
