import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const attemptId = String(params?.id ?? "").trim();

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt id required" }, { status: 400 });
    }

    if (attemptId.startsWith("local_") || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mock_test_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    return NextResponse.json({ attempt: data });
  } catch (err) {
    console.error("[mock-test/session/id] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load attempt" },
      { status: 500 }
    );
  }
}
