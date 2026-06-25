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

function normalizeTask(row) {
  return {
    ...row,
    cefr_level: row.cefr_level,
    cefrLevel: row.cefr_level,
    estimated_minutes: row.estimated_minutes,
    estimatedMinutes: row.estimated_minutes,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ tasks: [] });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ tasks: [] });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("daily_ai_tasks")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("[teacher/ai-practice] GET", error.message);
      return NextResponse.json({ tasks: [] });
    }

    return NextResponse.json({
      tasks: (data ?? []).map(normalizeTask),
    });
  } catch (err) {
    console.error("[teacher/ai-practice] GET", err);
    return NextResponse.json({ tasks: [] });
  }
}
