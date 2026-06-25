import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "../../../../lib/auth";
import {
  MAX_DAILY_MOCK_TESTS,
  MAX_DAILY_PASSAGE_TESTS,
  MAX_DAILY_PRACTICE_TESTS,
  buildSeparateDailyLimitResponse,
  buildUnlimitedDailyLimitResponse,
  getTodayDateKey,
} from "../../../../lib/readingDailyLimit.js";

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

async function getUserRole(supabase, studentId) {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    console.warn("[reading/daily-limit] role lookup:", error.message);
    return null;
  }

  return data?.role ?? null;
}

async function getTodayRecord(supabase, studentId, testDate) {
  const { data, error } = await supabase
    .from("daily_test_limits")
    .select(
      "tests_taken, mock_tests_taken, passage_tests_taken, practice_tests_taken, last_test_at"
    )
    .eq("student_id", studentId)
    .eq("test_date", testDate)
    .maybeSingle();

  if (error) {
    console.warn("[reading/daily-limit] read:", error.message);
    return null;
  }

  return data;
}

function resolveStudentId(session, queryStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (queryStudentId && queryStudentId !== sessionId) return null;
  return sessionId;
}

const LIMIT_FIELD = {
  mock: { field: "mock_tests_taken", max: MAX_DAILY_MOCK_TESTS },
  passage: { field: "passage_tests_taken", max: MAX_DAILY_PASSAGE_TESTS },
  practice: { field: "practice_tests_taken", max: MAX_DAILY_PRACTICE_TESTS },
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session?.user?.role === "teacher") {
      return NextResponse.json(buildUnlimitedDailyLimitResponse());
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(buildSeparateDailyLimitResponse({}));
    }

    const supabase = getSupabase();
    const role = await getUserRole(supabase, studentId);
    if (role === "teacher") {
      return NextResponse.json(buildUnlimitedDailyLimitResponse());
    }

    const record = await getTodayRecord(supabase, studentId, getTodayDateKey());
    return NextResponse.json(buildSeparateDailyLimitResponse(record ?? {}));
  } catch (err) {
    console.error("[reading/daily-limit] GET", err);
    return NextResponse.json(buildSeparateDailyLimitResponse({}));
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const studentId = resolveStudentId(session, body?.studentId);
    const testType = String(body?.testType ?? "mock").toLowerCase();

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session?.user?.role === "teacher") {
      return NextResponse.json({
        ...buildUnlimitedDailyLimitResponse(),
        success: true,
      });
    }

    const limitConfig = LIMIT_FIELD[testType] ?? LIMIT_FIELD.mock;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        ...buildSeparateDailyLimitResponse({}),
        success: true,
      });
    }

    const supabase = getSupabase();
    const role = await getUserRole(supabase, studentId);
    if (role === "teacher") {
      return NextResponse.json({
        ...buildUnlimitedDailyLimitResponse(),
        success: true,
      });
    }

    const testDate = getTodayDateKey();
    const existing = await getTodayRecord(supabase, studentId, testDate);

    const mockUsed = Number(
      existing?.mock_tests_taken ?? existing?.tests_taken ?? 0
    );
    const passageUsed = Number(existing?.passage_tests_taken ?? 0);
    const practiceUsed = Number(existing?.practice_tests_taken ?? 0);

    const currentForType =
      testType === "passage"
        ? passageUsed
        : testType === "practice"
          ? practiceUsed
          : mockUsed;

    if (currentForType >= limitConfig.max) {
      const response = buildSeparateDailyLimitResponse({
        mock_tests_taken: mockUsed,
        passage_tests_taken: passageUsed,
        practice_tests_taken: practiceUsed,
      });
      return NextResponse.json({
        ...response,
        success: false,
        canTakeTest: false,
      });
    }

    const newMock =
      testType === "mock" ? mockUsed + 1 : mockUsed;
    const newPassage =
      testType === "passage" ? passageUsed + 1 : passageUsed;
    const newPractice =
      testType === "practice" ? practiceUsed + 1 : practiceUsed;

    const payload = {
      student_id: studentId,
      test_date: testDate,
      tests_taken: testType === "mock" ? newMock : mockUsed,
      mock_tests_taken: newMock,
      passage_tests_taken: newPassage,
      practice_tests_taken: newPractice,
      last_test_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("daily_test_limits")
      .upsert(payload, { onConflict: "student_id,test_date" });

    if (upsertError) {
      console.warn("[reading/daily-limit] upsert:", upsertError.message);
      const fallback = {
        student_id: studentId,
        test_date: testDate,
        tests_taken: payload.tests_taken,
        last_test_at: payload.last_test_at,
      };
      await supabase
        .from("daily_test_limits")
        .upsert(fallback, { onConflict: "student_id,test_date" });
    }

    return NextResponse.json({
      ...buildSeparateDailyLimitResponse(payload),
      success: true,
    });
  } catch (err) {
    console.error("[reading/daily-limit] POST", err);
    return NextResponse.json(
      { error: "Failed to update daily limit" },
      { status: 500 }
    );
  }
}
