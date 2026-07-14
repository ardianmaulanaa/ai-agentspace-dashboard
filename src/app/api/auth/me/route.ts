import { NextResponse } from "next/server";
import { getDashboardRequestUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = getDashboardRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user,
  });
}
