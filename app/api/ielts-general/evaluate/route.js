import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { evaluateGeneralWriting } from "@/lib/ielts-general/writingEval.js";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Best-effort persistence of a completed GT writing attempt to
 * ielts_general_attempts (+ history). Never throws — a save failure must not
 * break the evaluation response. Task 1 stores letter_type so the GT dashboard
 * can compute letter-type accuracy.
 */
async function persistGeneralWritingAttempt({
  studentId,
  taskType,
  letterType,
  bands,
}) {
  if (!studentId) return;
  const overall = bands?.overall;
  if (overall == null || !Number.isFinite(Number(overall))) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const completedAt = new Date().toISOString();

  try {
    const { error } = await supabase.from("ielts_general_attempts").insert({
      student_id: studentId,
      skill: "writing",
      band_score: Number(overall),
      letter_type: taskType === "task1" ? letterType ?? null : null,
      completed_at: completedAt,
      status: "completed",
    });
    if (error && !error.message?.includes("does not exist")) {
      console.warn("[ielts-general/evaluate] attempt insert:", error.message);
    }
  } catch (err) {
    console.warn(
      "[ielts-general/evaluate] attempt insert threw:",
      err instanceof Error ? err.message : err
    );
  }

  try {
    const { error } = await supabase
      .from("ielts_general_student_history")
      .insert({
        student_id: studentId,
        skill: "writing",
        band_score: Number(overall),
        recorded_at: completedAt,
      });
    if (error && !error.message?.includes("does not exist")) {
      console.warn("[ielts-general/evaluate] history insert:", error.message);
    }
  } catch (err) {
    console.warn(
      "[ielts-general/evaluate] history insert threw:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const taskType = body?.taskType;

    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json(
        { error: 'taskType must be "task1" (letter) or "task2" (essay)', success: false },
        { status: 400 }
      );
    }

    const essay = body?.essay;
    if (typeof essay !== "string" || !essay.trim()) {
      return NextResponse.json(
        { error: "Response is empty", success: false },
        { status: 400 }
      );
    }

    const { evaluation, bands } = await evaluateGeneralWriting({
      essay,
      taskType,
      letterType: body?.letterType,
      questionPrompt: body?.questionPrompt,
      essayType: body?.essayType,
    });

    const session = await getServerSession(authOptions);
    await persistGeneralWritingAttempt({
      studentId: session?.user?.id,
      taskType,
      letterType: body?.letterType,
      bands,
    });

    return NextResponse.json({ evaluation, bands, success: true });
  } catch (err) {
    console.error("[ielts-general/evaluate]", err?.message || err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Evaluation failed",
        success: false,
      },
      { status: 500 }
    );
  }
}
