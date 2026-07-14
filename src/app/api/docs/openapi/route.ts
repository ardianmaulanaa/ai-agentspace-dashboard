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
          summary: "Login and issue access/refresh session cookies",
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
            "429": { description: "Too many attempts" },
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
                    password: { type: "string", format: "password", minLength: 8 },
                    confirmPassword: { type: "string", format: "password", minLength: 8 },
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
          summary: "Refresh the short-lived access cookie using refresh cookie",
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
      "/api/messages": {
        get: {
          tags: ["Messages"],
          summary: "List messages for a channel",
          parameters: [
            { name: "workspaceId", in: "query", schema: { type: "string" } },
            { name: "channelId", in: "query", schema: { type: "string" } },
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
                    attachmentData: { type: "string", description: "Image data URL" },
                    attachmentName: { type: "string" },
                    attachmentMime: { type: "string", example: "image/png" },
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
    },
  });
}
