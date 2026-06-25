import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  buildListeningDailyLimitResponse,
  buildUnlimitedListeningDailyLimitResponse,
  isListeningUnlimitedEnabled,
  MAX_DAILY_MOCK_TESTS,
  MAX_DAILY_PRACTICE_TESTS,
  MAX_DAILY_SECTION_TESTS,
} from "../../../../lib/listeningDailyLimit.js";

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

function resolveStudentId(session, bodyOrQueryId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (bodyOrQueryId && bodyOrQueryId !== sessionId) return null;
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

    if (session?.user?.role === "teacher" || isListeningUnlimitedEnabled()) {
      return NextResponse.json(buildUnlimitedListeningDailyLimitResponse());
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(buildListeningDailyLimitResponse({}));
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("listening_daily_limits")
      .select("section_tests_taken, mock_tests_taken, practice_tests_taken")
      .eq("student_id", studentId)
      .eq("test_date", getTodayDateKey())
      .maybeSingle();

    if (error) {
      console.warn("[listening/daily-limit] read:", error.message);
      return NextResponse.json(buildListeningDailyLimitResponse({}));
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", studentId)
      .maybeSingle();

    if (userRow?.role === "teacher") {
      return NextResponse.json(buildUnlimitedListeningDailyLimitResponse());
    }

    return NextResponse.json(buildListeningDailyLimitResponse(data ?? {}));
  } catch (err) {
    console.error("[listening/daily-limit] GET", err);
    return NextResponse.json(buildListeningDailyLimitResponse({}));
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const studentId = resolveStudentId(session, body?.studentId);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session?.user?.role === "teacher" || isListeningUnlimitedEnabled()) {
      return NextResponse.json(buildUnlimitedListeningDailyLimitResponse());
    }

    const testType = String(body?.testType ?? "").toLowerCase();
    if (!["section", "mock", "practice"].includes(testType)) {
      return NextResponse.json(
        { error: "testType must be section, mock, or practice" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const supabase = getSupabase();
    const testDate = getTodayDateKey();

    const { data: existing } = await supabase
      .from("listening_daily_limits")
      .select("section_tests_taken, mock_tests_taken, practice_tests_taken")
      .eq("student_id", studentId)
      .eq("test_date", testDate)
      .maybeSingle();

    let sectionUsed = Number(existing?.section_tests_taken ?? 0);
    let mockUsed = Number(existing?.mock_tests_taken ?? 0);
    let practiceUsed = Number(existing?.practice_tests_taken ?? 0);

    if (testType === "section") {
      if (sectionUsed >= MAX_DAILY_SECTION_TESTS) {
        return NextResponse.json(
          { error: "Daily section limit reached", ...buildListeningDailyLimitResponse(existing ?? {}) },
          { status: 429 }
        );
      }
      sectionUsed += 1;
    } else if (testType === "mock") {
      if (mockUsed >= MAX_DAILY_MOCK_TESTS) {
        return NextResponse.json(
          { error: "Daily mock limit reached", ...buildListeningDailyLimitResponse(existing ?? {}) },
          { status: 429 }
        );
      }
      mockUsed += 1;
    } else if (practiceUsed >= MAX_DAILY_PRACTICE_TESTS) {
      return NextResponse.json(
        { error: "Daily practice limit reached", ...buildListeningDailyLimitResponse(existing ?? {}) },
        { status: 429 }
      );
    } else {
      practiceUsed += 1;
    }

    const payload = {
      student_id: studentId,
      test_date: testDate,
      section_tests_taken: sectionUsed,
      mock_tests_taken: mockUsed,
      practice_tests_taken: practiceUsed,
      last_test_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("listening_daily_limits")
      .upsert(payload, { onConflict: "student_id,test_date" });

    if (error) {
      console.warn("[listening/daily-limit] upsert:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(buildListeningDailyLimitResponse(payload));
  } catch (err) {
    console.error("[listening/daily-limit] POST", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update limit" },
      { status: 500 }
    );
  }
}
