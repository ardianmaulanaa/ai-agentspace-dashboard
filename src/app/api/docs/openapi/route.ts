import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const jsonResponse = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    error: { type: "string" },
  },
};

export async function GET() {
  return NextResponse.json({
    openapi: "3.0.3",
    info: {
      title: "AI AgentSpace Dashboard API",
      version: "0.1.0",
      description: "Backend API for the AI AgentSpace portfolio dashboard.",
    },
    servers: [{ url: "http://localhost:3000" }],
    tags: [
      { name: "Auth" },
      { name: "Dashboard" },
      { name: "Workspace" },
      { name: "Messages" },
      { name: "Forum" },
      { name: "Agents" },
      { name: "Admin" },
    ],
    paths: {
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with Supabase Auth and issue JWT access/refresh cookies",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "ardian@agentspace.com" },
                    password: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Authenticated", content: { "application/json": { schema: jsonResponse } } },
            "401": { description: "Invalid credentials" },
            "429": {
              description: "Too many login attempts",
              headers: {
                "Retry-After": {
                  description: "Seconds until the client may retry login",
                  schema: { type: "integer", example: 60 },
                },
                "X-RateLimit-Limit": {
                  description: "Maximum failed login attempts per window",
                  schema: { type: "integer", example: 5 },
                },
              },
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a Supabase Auth dashboard member and issue session cookies",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "confirmPassword"],
                  properties: {
                    email: { type: "string", example: "member@agentspace.com" },
                    displayName: { type: "string", example: "Member One" },
                    password: {
                      type: "string",
                      format: "password",
                      minLength: 8,
                      description: "Must contain letters and numbers",
                    },
                    confirmPassword: {
                      type: "string",
                      format: "password",
                      minLength: 8,
                      description: "Must match password",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Registered and authenticated" },
            "400": { description: "Validation error" },
            "409": { description: "Email already exists" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh the short-lived JWT access cookie using refresh cookie",
          responses: {
            "200": { description: "Access cookie refreshed" },
            "401": { description: "Invalid refresh token" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Clear dashboard session cookies",
          responses: { "200": { description: "Logged out" } },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get authenticated dashboard user",
          responses: {
            "200": { description: "Current user" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/dashboard/data": {
        get: {
          tags: ["Dashboard"],
          summary: "Load workspaces, categories, channels, messages, and forum data",
          responses: {
            "200": { description: "Dashboard data" },
            "401": { description: "Unauthorized" },
            "500": { description: "Supabase/config error" },
          },
        },
      },
      "/api/categories": {
        post: {
          tags: ["Workspace"],
          summary: "Create a category in a workspace",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    workspaceId: { type: "string", example: "agentspace" },
                    name: { type: "string", example: "Portfolio" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Category created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/channels": {
        post: {
          tags: ["Workspace"],
          summary: "Create text, forum, or voice channel",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    workspaceId: { type: "string", example: "agentspace" },
                    category: { type: "string", example: "Portfolio" },
                    name: { type: "string", example: "ide-project" },
                    type: { type: "string", enum: ["text", "forum", "voice"] },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Channel created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/workspace-members": {
        get: {
          tags: ["Workspace"],
          summary: "List workspace members for admin/owner RBAC management",
          parameters: [
            { name: "workspaceId", in: "query", schema: { type: "string", example: "agentspace" } },
          ],
          responses: {
            "200": { description: "Workspace members listed" },
            "403": { description: "Admin or owner role required" },
            "404": { description: "Workspace not found" },
          },
        },
        post: {
          tags: ["Workspace"],
          summary: "Add or update workspace membership",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId"],
                  properties: {
                    workspaceId: { type: "string", example: "agentspace" },
                    userId: { type: "string", description: "Supabase Auth user ID" },
                    role: { type: "string", enum: ["admin", "owner", "member"], default: "member" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Membership upserted" },
            "400": { description: "Validation error" },
            "403": { description: "Admin or owner role required" },
            "404": { description: "Workspace or user not found" },
          },
        },
        delete: {
          tags: ["Workspace"],
          summary: "Remove workspace membership",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId"],
                  properties: {
                    workspaceId: { type: "string", example: "agentspace" },
                    userId: { type: "string", description: "Supabase Auth user ID" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Membership removed" },
            "400": { description: "Validation error" },
            "403": { description: "Admin or owner role required" },
            "404": { description: "Workspace not found" },
          },
        },
      },
      "/api/messages": {
        get: {
          tags: ["Messages"],
          summary: "List messages for a channel",
          parameters: [
            { name: "workspaceId", in: "query", schema: { type: "string" } },
            { name: "channelId", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "senderType", in: "query", schema: { type: "string", enum: ["user", "agent", "system"] } },
          ],
          responses: { "200": { description: "Messages" }, "401": { description: "Unauthorized" } },
        },
        post: {
          tags: ["Messages"],
          summary: "Create user message with optional image attachment",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    workspaceId: { type: "string" },
                    channelId: { type: "string" },
                    content: { type: "string" },
                    attachmentData: {
                      type: "string",
                      description: "Base64 image data URL. Max 2 MB. Allowed MIME: image/png, image/jpeg, image/webp, image/gif.",
                    },
                    attachmentName: { type: "string" },
                    attachmentMime: {
                      type: "string",
                      enum: ["image/png", "image/jpeg", "image/webp", "image/gif"],
                      example: "image/png",
                    },
                    replyTo: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Message created" }, "400": { description: "Validation error" } },
        },
      },
      "/api/messages/{id}": {
        patch: {
          tags: ["Messages"],
          summary: "Edit, pin, or react to a message",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Message updated" }, "404": { description: "Message not found" } },
        },
        delete: {
          tags: ["Messages"],
          summary: "Delete a message",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Message deleted" } },
        },
      },
      "/api/forum-posts": {
        post: {
          tags: ["Forum"],
          summary: "Create forum post",
          responses: { "201": { description: "Forum post created" }, "400": { description: "Validation error" } },
        },
      },
      "/api/forum-posts/{id}/replies": {
        post: {
          tags: ["Forum"],
          summary: "Reply to forum post",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "201": { description: "Reply created" }, "404": { description: "Forum post not found" } },
        },
      },
      "/api/agents/invoke": {
        post: {
          tags: ["Agents"],
          summary: "Invoke an OpenClaw AI agent and persist its reply",
          responses: { "200": { description: "Agent reply" }, "502": { description: "OpenClaw invoke failed" } },
        },
      },
      "/api/admin/cleanup": {
        post: {
          tags: ["Admin"],
          summary: "Admin-only cleanup for chat/forum content",
          responses: {
            "200": { description: "Cleanup dry-run or execution result" },
            "403": { description: "Admin role required" },
          },
        },
      },
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List Supabase Auth users for admin RBAC management",
          responses: {
            "200": { description: "Users listed" },
            "403": { description: "Admin role required" },
            "500": { description: "Supabase/config error" },
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "Update a Supabase Auth user's dashboard role",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "role"],
                  properties: {
                    userId: { type: "string", description: "Supabase Auth user ID" },
                    role: { type: "string", enum: ["admin", "owner", "member"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Role updated" },
            "400": { description: "Validation error" },
            "403": { description: "Admin role required" },
            "404": { description: "User not found" },
            "409": { description: "Self-downgrade blocked" },
          },
        },
      },
    },
  });
}
