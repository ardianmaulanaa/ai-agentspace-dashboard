import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
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

export function getDashboardAccessToken() {
  return process.env.DASHBOARD_ACCESS_TOKEN?.trim() || "";
}

export function getDashboardRefreshToken() {
  return process.env.DASHBOARD_REFRESH_TOKEN?.trim() || "";
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

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
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

export function setDashboardSessionCookies(response: NextResponse, user: DashboardUser) {
  response.cookies.set(DASHBOARD_ACCESS_COOKIE, getDashboardAccessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });

  response.cookies.set(DASHBOARD_REFRESH_COOKIE, getDashboardRefreshToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set(DASHBOARD_USER_COOKIE, user.username, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set(DASHBOARD_DISPLAY_COOKIE, user.displayName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set(DASHBOARD_ROLE_COOKIE, user.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function isDashboardAccessToken(token: string | undefined) {
  return safeEqualString(token, getDashboardAccessToken());
}

export function isDashboardRefreshToken(token: string | undefined) {
  return safeEqualString(token, getDashboardRefreshToken());
}

export function isDashboardSessionToken(token: string | undefined) {
  return isDashboardAccessToken(token);
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getDashboardRequestRole(request: Request) {
  return getDashboardRequestUser(request)?.role || null;
}

export function getDashboardRequestUser(request: Request): DashboardUser | null {
  const cookieHeader = request.headers.get("cookie");
  const accessToken =
    getCookieValue(cookieHeader, DASHBOARD_ACCESS_COOKIE) ||
    getCookieValue(cookieHeader, DASHBOARD_SESSION_COOKIE);
  const username = getCookieValue(cookieHeader, DASHBOARD_USER_COOKIE);
  const displayName = getCookieValue(cookieHeader, DASHBOARD_DISPLAY_COOKIE);
  const role = getCookieValue(cookieHeader, DASHBOARD_ROLE_COOKIE);

  if (!isDashboardAccessToken(accessToken)) {
    return null;
  }

  if (username && displayName && (role === "admin" || role === "owner" || role === "member")) {
    return {
      username: decodeURIComponent(username),
      displayName: decodeURIComponent(displayName),
      role,
    };
  }

  return getDashboardUser();
}

export function isDashboardRequestAuthenticated(request: Request) {
  return Boolean(getDashboardRequestRole(request));
}

export function isDashboardRequestAuthorized(request: Request, allowedRoles: DashboardRole[]) {
  const role = getDashboardRequestRole(request);

  return Boolean(role && allowedRoles.includes(role));
}
