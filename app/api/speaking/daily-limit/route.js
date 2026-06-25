import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  buildSpeakingDailyLimitResponse,
  buildUnlimitedSpeakingDailyLimitResponse,
} from "../../../../lib/speakingDailyLimit.js";

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

function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function resolveStudentId(session, queryStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (queryStudentId && queryStudentId !== sessionId) return null;
  return sessionId;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session?.user?.role === "teacher") {
      return NextResponse.json(buildUnlimitedSpeakingDailyLimitResponse());
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(buildSpeakingDailyLimitResponse({}));
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("speaking_daily_limits")
      .select(
        "part1_sessions_taken, part2_sessions_taken, part3_sessions_taken, mock_tests_taken, tests_taken"
      )
      .eq("student_id", studentId)
      .eq("test_date", getTodayDateKey())
      .maybeSingle();

    if (error) {
      console.warn("[speaking/daily-limit] read:", error.message);
      return NextResponse.json(buildSpeakingDailyLimitResponse({}));
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", studentId)
      .maybeSingle();

    if (userRow?.role === "teacher") {
      return NextResponse.json(buildUnlimitedSpeakingDailyLimitResponse());
    }

    return NextResponse.json(buildSpeakingDailyLimitResponse(data ?? {}));
  } catch (err) {
    console.error("[speaking/daily-limit] GET", err);
    return NextResponse.json(buildSpeakingDailyLimitResponse({}));
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
