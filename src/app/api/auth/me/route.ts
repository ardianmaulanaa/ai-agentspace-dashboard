import { NextResponse } from "next/server";
import { getDashboardUser, isDashboardRequestAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDashboardRequestAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: getDashboardUser(),
  });
}
