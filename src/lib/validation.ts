import { NextResponse } from "next/server";

export type JsonObject = Record<string, unknown>;

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

export async function readJsonObject(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as JsonObject;
}

export function validationError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function optionalString(body: JsonObject, key: string) {
  const value = body[key];

  return typeof value === "string" ? value.trim() : "";
}

export function requiredString(body: JsonObject, key: string, label = key) {
  const value = optionalString(body, key);

  if (!value) {
    return { value: "", error: `${label} is required.` };
  }

  return { value, error: null };
}

export function optionalBoolean(body: JsonObject, key: string) {
  const value = body[key];

  return typeof value === "boolean" ? value : undefined;
}

export function optionalPlainObject(body: JsonObject, key: string) {
  const value = body[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as JsonObject;
}

export function enumValue<T extends string>(value: string, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function validateImageDataUrlAttachment({
  data,
  mime,
  name,
}: {
  data: string;
  mime: string;
  name: string;
}) {
  if (!data && !mime && !name) {
    return { ok: true as const, mime: "", sizeBytes: 0 };
  }

  if (!data || !mime || !name) {
    return {
      ok: false as const,
      error: "Attachment data, name, and mime are required together.",
    };
  }

  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(data);

  if (!match) {
    return {
      ok: false as const,
      error: "Attachment data must be a base64 data URL.",
    };
  }

  const [, dataUrlMime, base64Value] = match;

  if (dataUrlMime !== mime) {
    return {
      ok: false as const,
      error: "Attachment mime must match the data URL mime.",
    };
  }

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(mime as typeof ALLOWED_ATTACHMENT_MIME_TYPES[number])) {
    return {
      ok: false as const,
      error: "Only PNG, JPEG, WebP, and GIF image attachments are supported.",
    };
  }

  const sizeBytes = Buffer.byteLength(base64Value, "base64");

  if (sizeBytes > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false as const,
      error: "Attachment must be 2 MB or smaller.",
    };
  }

  return { ok: true as const, mime, sizeBytes };
}
