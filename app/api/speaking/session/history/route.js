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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ sessions: [] });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const mockOnly = searchParams.get("mockOnly") === "true";

    const supabase = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (sessionId) {
      const { data, error } = await supabase
        .from("speaking_sessions")
        .select(
          "id, session_number, session_type, overall_band, duration_minutes, speaking_time_seconds, started_at, completed_at, feedback, transcript, fluency_band, lexical_band, grammar_band, pronunciation_band"
        )
        .eq("id", sessionId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        console.error("[speaking/session/history]", error.message);
        return NextResponse.json({ error: "Could not load session" }, { status: 500 });
      }

      if (!data || !data.completed_at) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ session: data });
    }

    let query = supabase
      .from("speaking_sessions")
      .select(
        "id, session_number, session_type, overall_band, duration_minutes, speaking_time_seconds, started_at, completed_at, feedback"
      )
      .eq("student_id", studentId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(mockOnly ? 6 : 50);

    if (mockOnly) {
      query = query.eq("session_type", "mock");
    }

    const { data, error } = await query;

    if (error) {
      console.error("[speaking/session/history]", error.message);
      return NextResponse.json({ error: "Could not load history" }, { status: 500 });
    }

    const sessions = (data ?? []).map((row) => ({
      id: row.id,
      sessionNumber: row.session_number,
      sessionType: row.session_type,
      overallBand: row.overall_band,
      durationMinutes: row.duration_minutes,
      speakingTimeSeconds: row.speaking_time_seconds,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      hasFeedback: Boolean(row.feedback),
    }));

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[speaking/session/history]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
