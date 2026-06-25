import { NextResponse } from "next/server";
import { getDashboardPathForEmail } from "@/lib/auth";

export const runtime = "nodejs";

/** Fallback redirect path when session cookie is not yet visible to /api/auth/me */
export async function GET(request) {
  const email = new URL(request.url).searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const dashboardPath = await getDashboardPathForEmail(email);
  if (!dashboardPath) {
    return NextResponse.json({ error: "No role for this account" }, { status: 404 });
  }

  return NextResponse.json({ dashboardPath });
}
