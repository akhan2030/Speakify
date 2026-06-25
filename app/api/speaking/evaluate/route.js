import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { evaluateSpeakingResponse } from "../../../../lib/speakingEvaluator.js";
import { MAX_DAILY_PART_SESSIONS, MAX_DAILY_MOCK_TESTS } from "../../../../lib/speakingDailyLimit.js";

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

function resolveStudentId(session, bodyStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (bodyStudentId && bodyStudentId !== sessionId) return null;
  return sessionId;
}

async function saveAttempt(supabase, studentId, payload, evaluation) {
  const row = {
    student_id: studentId,
    part: String(payload.part ?? "1"),
    task_type: payload.taskType ?? "part1-question",
    question_text: payload.questionText ?? "",
    transcript: payload.transcript ?? "",
    duration_seconds: Number(payload.duration ?? 0),
    band_fc: evaluation.bandFC,
    band_lr: evaluation.bandLR,
    band_gra: evaluation.bandGRA,
    band_p: evaluation.bandP,
    band_overall: evaluation.bandOverall,
    feedback: evaluation.feedback ?? {},
    topic: payload.topic ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("speaking_attempts").insert(row);
  if (error) {
    console.warn("[speaking/evaluate] attempt insert:", error.message);
  }
}

async function updateTracker(supabase, studentId, evaluation) {
  const partKey = "part1_overall";
  const { data: existing } = await supabase
    .from("speaking_tracker")
    .select("*")
    .eq("student_id", studentId)
    .eq("tracker_key", partKey)
    .maybeSingle();

  const prevAttempts = existing?.attempts ?? 0;
  const n = prevAttempts + 1;

  const avg = (prev, newVal) => {
    if (prev === null || prev === undefined) return newVal;
    return Math.round(((prev * prevAttempts + newVal) / n) * 2) / 2;
  };

  const payload = {
    student_id: studentId,
    tracker_key: partKey,
    attempts: n,
    band_fc: avg(existing?.band_fc, evaluation.bandFC),
    band_lr: avg(existing?.band_lr, evaluation.bandLR),
    band_gra: avg(existing?.band_gra, evaluation.bandGRA),
    band_p: avg(existing?.band_p, evaluation.bandP),
    band_overall: avg(existing?.band_overall, evaluation.bandOverall),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("speaking_tracker")
    .upsert(payload, { onConflict: "student_id,tracker_key" });

  if (error) {
    console.warn("[speaking/evaluate] tracker upsert:", error.message);
  }
}

async function incrementPartSessionLimit(supabase, studentId, partField) {
  const testDate = getTodayDateKey();
  const { data: existing } = await supabase
    .from("speaking_daily_limits")
    .select("part1_sessions_taken, part2_sessions_taken, part3_sessions_taken, mock_tests_taken")
    .eq("student_id", studentId)
    .eq("test_date", testDate)
    .maybeSingle();

  const part1Used = Number(existing?.part1_sessions_taken ?? 0);
  const part2Used = Number(existing?.part2_sessions_taken ?? 0);
  const part3Used = Number(existing?.part3_sessions_taken ?? 0);

  const usedByField = {
    part1_sessions_taken: part1Used,
    part2_sessions_taken: part2Used,
    part3_sessions_taken: part3Used,
  };
  const currentUsed = usedByField[partField] ?? 0;
  if (currentUsed >= MAX_DAILY_PART_SESSIONS) return;

  const payload = {
    student_id: studentId,
    test_date: testDate,
    part1_sessions_taken: partField === "part1_sessions_taken" ? part1Used + 1 : part1Used,
    part2_sessions_taken: partField === "part2_sessions_taken" ? part2Used + 1 : part2Used,
    part3_sessions_taken: partField === "part3_sessions_taken" ? part3Used + 1 : part3Used,
    mock_tests_taken: Number(existing?.mock_tests_taken ?? 0),
    last_test_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("speaking_daily_limits")
    .upsert(payload, { onConflict: "student_id,test_date" });

  if (error) {
    console.warn("[speaking/evaluate] daily limit:", error.message);
  }
}

async function incrementMockSessionLimit(supabase, studentId) {
  const testDate = getTodayDateKey();
  const { data: existing } = await supabase
    .from("speaking_daily_limits")
    .select("part1_sessions_taken, part2_sessions_taken, part3_sessions_taken, mock_tests_taken")
    .eq("student_id", studentId)
    .eq("test_date", testDate)
    .maybeSingle();

  const mockUsed = Number(existing?.mock_tests_taken ?? 0);
  if (mockUsed >= MAX_DAILY_MOCK_TESTS) return;

  const payload = {
    student_id: studentId,
    test_date: testDate,
    part1_sessions_taken: Number(existing?.part1_sessions_taken ?? 0),
    part2_sessions_taken: Number(existing?.part2_sessions_taken ?? 0),
    part3_sessions_taken: Number(existing?.part3_sessions_taken ?? 0),
    mock_tests_taken: mockUsed + 1,
    last_test_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("speaking_daily_limits")
    .upsert(payload, { onConflict: "student_id,test_date" });

  if (error) {
    console.warn("[speaking/evaluate] mock daily limit:", error.message);
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

    const transcript = String(body?.transcript ?? "").trim();
    const questionText = String(body?.questionText ?? "");
    const part = body?.part ?? 1;
    const taskType = body?.taskType ?? "part1-question";
    const expectedDuration = Number(body?.expectedDuration ?? 45);
    const isFirstQuestion = Boolean(body?.isFirstQuestion);
    const isMockSession = Boolean(body?.isMockSession);
    const incrementMockLimit = Boolean(body?.incrementMockLimit);

    const evaluation = await evaluateSpeakingResponse({
      transcript,
      questionText,
      part,
      taskType,
      expectedDuration,
    });

    if (!evaluation.success) {
      return NextResponse.json(
        { success: false, error: evaluation.error ?? "Evaluation failed" },
        { status: 400 }
      );
    }

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = getSupabase();
      await saveAttempt(supabase, studentId, { ...body, transcript }, evaluation);
      await updateTracker(supabase, studentId, evaluation);
      if (isFirstQuestion && !isMockSession && session?.user?.role !== "teacher") {
        const partNum = Number(part);
        if (partNum === 2) {
          await incrementPartSessionLimit(supabase, studentId, "part2_sessions_taken");
        } else if (partNum === 3) {
          await incrementPartSessionLimit(supabase, studentId, "part3_sessions_taken");
        } else {
          await incrementPartSessionLimit(supabase, studentId, "part1_sessions_taken");
        }
      }
      if (incrementMockLimit && session?.user?.role !== "teacher") {
        await incrementMockSessionLimit(supabase, studentId);
      }
    }

    return NextResponse.json({
      ...evaluation,
      success: true,
    });
  } catch (err) {
    console.error("[speaking/evaluate]", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Evaluation failed" },
      { status: 500 }
    );
  }
}
