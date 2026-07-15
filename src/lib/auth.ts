import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { NextResponse } from "next/server";

export const DASHBOARD_ACCESS_COOKIE = "agentspace_access";
export const DASHBOARD_REFRESH_COOKIE = "agentspace_refresh";
export const DASHBOARD_SESSION_COOKIE = "agentspace_session";
export const DASHBOARD_USER_COOKIE = "agentspace_user";
export const DASHBOARD_DISPLAY_COOKIE = "agentspace_display";
export const DASHBOARD_ROLE_COOKIE = "agentspace_role";

export type DashboardRole = "admin" | "owner" | "member";

export type DashboardUser = {
  username: string;
  displayName: string;
  role: DashboardRole;
};

type DashboardJwtPayload = DashboardUser & {
  typ: "access" | "refresh";
  iat: number;
  exp: number;
};

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export function getDashboardUser(): DashboardUser {
  return {
    username: process.env.DASHBOARD_USERNAME?.trim() || "ardian",
    displayName: process.env.DASHBOARD_DISPLAY_NAME?.trim() || "Ardian",
    role: getDashboardRole(),
  };
}

export function getDashboardPassword() {
  return process.env.DASHBOARD_PASSWORD?.trim() || "";
}

export function getDashboardPasswordHash() {
  return process.env.DASHBOARD_PASSWORD_HASH?.trim() || "";
}

export function getDashboardJwtSecret() {
  return process.env.DASHBOARD_JWT_SECRET?.trim() || "";
}

export function getDashboardRole(): DashboardRole {
  const role = process.env.DASHBOARD_ROLE?.trim().toLowerCase();

  if (role === "admin" || role === "owner" || role === "member") {
    return role;
  }

  return "admin";
}

function safeEqualString(actual: string | undefined, expected: string) {
  if (!actual || !expected) {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function signJwt(unsignedToken: string) {
  return base64UrlEncode(
    createHmac("sha256", getDashboardJwtSecret())
      .update(unsignedToken)
      .digest(),
  );
}

function createDashboardJwt(
  user: DashboardUser,
  type: DashboardJwtPayload["typ"],
  ttlSeconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      typ: type,
      iat: now,
      exp: now + ttlSeconds,
    } satisfies DashboardJwtPayload),
  );
  const unsignedToken = `${header}.${payload}`;

  return `${unsignedToken}.${signJwt(unsignedToken)}`;
}

export function verifyDashboardJwt(
  token: string | undefined,
  expectedType: DashboardJwtPayload["typ"],
) {
  if (!token || !getDashboardJwtSecret()) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = signJwt(unsignedToken);

  if (!safeEqualString(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as DashboardJwtPayload;
    const now = Math.floor(Date.now() / 1000);

    if (parsed.typ !== expectedType || parsed.exp <= now) {
      return null;
    }

    if (
      parsed.role !== "admin" &&
      parsed.role !== "owner" &&
      parsed.role !== "member"
    ) {
      return null;
    }

    return {
      username: parsed.username,
      displayName: parsed.displayName,
      role: parsed.role,
    } satisfies DashboardUser;
  } catch {
    return null;
  }
}

function verifyScryptPassword(password: string, hashValue: string) {
  const [scheme, salt, expectedHex] = hashValue.split("$");

  if (scheme !== "scrypt" || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export function hashDashboardPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

export function verifyPasswordHash(password: string, hashValue: string) {
  return verifyScryptPassword(password, hashValue);
}

export function verifyDashboardPassword(password: string) {
  const passwordHash = getDashboardPasswordHash();

  if (passwordHash) {
    return verifyScryptPassword(password, passwordHash);
  }

  return safeEqualString(password, getDashboardPassword());
}

export function setDashboardSessionCookies(
  response: NextResponse,
  user: DashboardUser,
) {
  response.cookies.set(
    DASHBOARD_ACCESS_COOKIE,
    createDashboardJwt(user, "access", ACCESS_TOKEN_TTL_SECONDS),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    },
  );

  response.cookies.set(
    DASHBOARD_REFRESH_COOKIE,
    createDashboardJwt(user, "refresh", REFRESH_TOKEN_TTL_SECONDS),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    },
  );
}

export function isDashboardAccessToken(token: string | undefined) {
  return Boolean(verifyDashboardJwt(token, "access"));
}

export function isDashboardRefreshToken(token: string | undefined) {
  return Boolean(verifyDashboardJwt(token, "refresh"));
}

export function isDashboardSessionToken(token: string | undefined) {
  return isDashboardAccessToken(token);
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getDashboardRequestRole(request: Request) {
  return getDashboardRequestUser(request)?.role || null;
}

export function getDashboardRequestUser(
  request: Request,
): DashboardUser | null {
  const cookieHeader = request.headers.get("cookie");
  const accessToken =
    getCookieValue(cookieHeader, DASHBOARD_ACCESS_COOKIE) ||
    getCookieValue(cookieHeader, DASHBOARD_SESSION_COOKIE);
  const jwtUser = verifyDashboardJwt(accessToken, "access");

  if (jwtUser) {
    return jwtUser;
  }

  return null;
}

export function isDashboardRequestAuthenticated(request: Request) {
  return Boolean(getDashboardRequestRole(request));
}

export function isDashboardRequestAuthorized(
  request: Request,
  allowedRoles: DashboardRole[],
) {
  const role = getDashboardRequestRole(request);

  return Boolean(role && allowedRoles.includes(role));
}
