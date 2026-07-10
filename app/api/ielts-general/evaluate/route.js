import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { evaluateGeneralWriting } from "@/lib/ielts-general/writingEval.js";
import {
  extractGtWritingDeductions,
} from "@/lib/ielts-general/gtWritingScoringSchema";
import {
  gtAttemptInsertRow,
  gtHistoryInsertRow,
  gtWritingAttemptInsertRow,
} from "@/lib/ielts-general/attemptRows";

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

async function persistGeneralWritingAttempt({
  studentId,
  taskType,
  letterType,
  bands,
  essay,
  structuredFeedback,
}) {
  if (!studentId) return null;
  const overall = bands?.overall;
  if (overall == null || !Number.isFinite(Number(overall))) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const completedAt = new Date().toISOString();
  const detailedRow = gtWritingAttemptInsertRow({
    studentId,
    taskType,
    letterType,
    bands,
    essay,
    structuredFeedback,
    completedAt,
  });

  try {
    const { data, error } = await supabase
      .from("ielts_general_attempts")
      .insert(detailedRow)
      .select("id")
      .single();

    if (error) {
      if (
        error.message?.includes("ta_score") ||
        error.message?.includes("feedback") ||
        error.message?.includes("structured")
      ) {
        const { error: fallbackError } = await supabase
          .from("ielts_general_attempts")
          .insert(
            gtAttemptInsertRow({
              studentId,
              skill: "writing",
              bandScore: Number(overall),
              letterType: taskType === "task1" ? letterType ?? null : null,
              completedAt,
            })
          );
        if (fallbackError && !fallbackError.message?.includes("does not exist")) {
          console.warn("[ielts-general/evaluate] fallback insert:", fallbackError.message);
        }
        return `gt-writing-${completedAt}`;
      }
      if (!error.message?.includes("does not exist")) {
        console.warn("[ielts-general/evaluate] attempt insert:", error.message);
      }
      return null;
    }

    try {
      await supabase.from("ielts_general_student_history").insert(
        gtHistoryInsertRow({
          studentId,
          skill: "writing",
          bandScore: Number(overall),
          recordedAt: completedAt,
        })
      );
    } catch (historyErr) {
      console.warn(
        "[ielts-general/evaluate] history insert:",
        historyErr instanceof Error ? historyErr.message : historyErr
      );
    }

    return data?.id ?? `gt-writing-${completedAt}`;
  } catch (err) {
    console.warn(
      "[ielts-general/evaluate] attempt insert threw:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

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

    const { validateWritingSubmission } = await import("@/lib/ielts/writingCriteria");
    const wordCheck = validateWritingSubmission(essay, taskType);
    if (!wordCheck.ok) {
      return NextResponse.json({ error: wordCheck.error, success: false }, { status: 400 });
    }

    const result = await evaluateGeneralWriting({
      essay,
      taskType,
      letterType: body?.letterType,
      questionPrompt: body?.questionPrompt,
      essayType: body?.essayType,
    });

    const { structuredFeedback, evaluation, bands } = result;
    const attemptId = await persistGeneralWritingAttempt({
      studentId: session.user.id,
      taskType,
      letterType: body?.letterType,
      bands,
      essay,
      structuredFeedback,
    });

    try {
      const { syncRoadmapFromSessionScore } = await import("@/lib/growthRoadmap/syncRoadmap");
      const supabase = getSupabase();
      if (supabase) {
        const deductions = extractGtWritingDeductions(structuredFeedback);
        if (deductions.length > 0) {
          await syncRoadmapFromSessionScore({
            supabase,
            studentId: session.user.id,
            sourceSessionId: String(attemptId ?? `gt-writing-${Date.now()}`),
            skill: "writing",
            deductions,
          });
        }
      }
    } catch (roadmapErr) {
      console.warn(
        "[ielts-general/evaluate] roadmap sync:",
        roadmapErr instanceof Error ? roadmapErr.message : roadmapErr
      );
    }

    return NextResponse.json({
      success: true,
      evaluation,
      bands,
      structuredFeedback,
      examVariant: "general",
    });
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
