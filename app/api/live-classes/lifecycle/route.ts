import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runLiveClassLifecycle } from "@/lib/live-classes/marketplace";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (secret && auth === `Bearer ${secret}`) return true;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const ua = request.headers.get("user-agent") ?? "";
  if (ua.includes("vercel-cron")) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const result = await runLiveClassLifecycle(getSupabase());
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
