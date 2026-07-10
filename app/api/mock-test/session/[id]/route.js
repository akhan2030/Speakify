import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { verifyMockAttemptOwnership } from "@/lib/mock-test/ownership";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attemptId = String(params?.id ?? "").trim();

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt id required" }, { status: 400 });
    }

    if (attemptId.startsWith("local_") || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const supabase = getSupabase();
    const ownership = await verifyMockAttemptOwnership(
      supabase,
      attemptId,
      session.user.id,
      "*"
    );
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    return NextResponse.json({ attempt: ownership.attempt });
  } catch (err) {
    console.error("[mock-test/session/id] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load attempt" },
      { status: 500 }
    );
  }
}
