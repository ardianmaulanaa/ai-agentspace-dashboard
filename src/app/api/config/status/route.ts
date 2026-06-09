import { NextResponse } from "next/server";
import { isDashboardRequestAuthenticated } from "@/lib/auth";
import { getConfigStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDashboardRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const status = getConfigStatus();

  return NextResponse.json({
    ok: true,
    ...status,
  });
}
