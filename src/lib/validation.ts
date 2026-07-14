import { NextResponse } from "next/server";

export type JsonObject = Record<string, unknown>;

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
