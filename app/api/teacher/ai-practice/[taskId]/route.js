import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

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

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params?.taskId;
    if (!taskId) {
      return NextResponse.json({ error: "Task id required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const status = String(body?.status ?? "").trim().toLowerCase();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updates = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    };

    if (status === "published") {
      updates.published_at = new Date().toISOString();
    }

    if (status === "rejected") {
      updates.rejection_reason =
        String(body?.rejectionReason ?? body?.reason ?? "Rejected by teacher").trim() ||
        "Rejected by teacher";
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("daily_ai_tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) throw error;

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("[teacher/ai-practice/PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
