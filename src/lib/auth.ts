export const DASHBOARD_SESSION_COOKIE = "agentspace_session";

export type DashboardUser = {
  username: string;
  displayName: string;
};

export function getDashboardUser(): DashboardUser {
  return {
    username: process.env.DASHBOARD_USERNAME?.trim() || "ardian",
    displayName: process.env.DASHBOARD_DISPLAY_NAME?.trim() || "Ardian",
  };
}

export function getDashboardPassword() {
  return process.env.DASHBOARD_PASSWORD?.trim() || "";
}

export function getDashboardSessionToken() {
  return process.env.DASHBOARD_SESSION_TOKEN?.trim() || "";
}

export function isDashboardSessionToken(token: string | undefined) {
  const expectedToken = getDashboardSessionToken();

  return Boolean(expectedToken && token && token === expectedToken);
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function isDashboardRequestAuthenticated(request: Request) {
  const sessionToken = getCookieValue(
    request.headers.get("cookie"),
    DASHBOARD_SESSION_COOKIE,
  );

  return isDashboardSessionToken(sessionToken);
}
