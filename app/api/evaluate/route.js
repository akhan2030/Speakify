import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { evaluateEssay } from "../../../lib/assistant.js";
import {
  combineGuidedParagraphs,
  evaluateWritingParagraph,
} from "../../../lib/ielts/writingParagraphEval.js";

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
 * Best-effort persistence of a completed Academic writing attempt.
 * Never throws — a save failure must not break the evaluation response.
 */
async function persistWritingAttempt({
  studentId,
  taskType,
  essay,
  evaluation,
  bands,
  promptId,
  structuredScore,
}) {
  if (!studentId) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const row = {
      student_id: studentId,
      task_type: taskType,
      essay_text: essay,
      evaluation_text: evaluation,
      band_overall: bands?.overall ?? null,
      band_ta: bands?.ta ?? null,
      band_cc: bands?.cc ?? null,
      band_lr: bands?.lr ?? null,
      band_gra: bands?.gra ?? null,
    };
    if (typeof promptId === "string" && promptId.trim()) {
      row.prompt_id = promptId.trim();
    }
    if (structuredScore) {
      row.structured_score = structuredScore;
    }

    const { data, error } = await supabase
      .from("writing_attempts")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      if (structuredScore && error.message?.includes("structured_score")) {
        delete row.structured_score;
        const retry = await supabase.from("writing_attempts").insert(row).select("id").single();
        if (retry.error) {
          console.warn("[/api/evaluate] writing_attempts insert failed:", retry.error.message);
          return null;
        }
        return retry.data?.id ?? null;
      }
      console.warn("[/api/evaluate] writing_attempts insert failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.warn(
      "[/api/evaluate] writing_attempts insert threw:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function syncWritingRoadmap({
  studentId,
  attemptId,
  taskType,
  evaluation,
  bands,
  structuredScore,
}) {
  if (!studentId) return;
  try {
    const { extractWritingDeductions, inferWritingDeductions } = await import(
      "@/lib/growthRoadmap/extractDeductions"
    );
    const { syncRoadmapFromSessionScore } = await import("@/lib/growthRoadmap/syncRoadmap");
    const supabase = getSupabase();
    if (!supabase) return;

    const deductions =
      extractWritingDeductions(structuredScore).length > 0
        ? extractWritingDeductions(structuredScore)
        : inferWritingDeductions({
            evaluationText: evaluation,
            bands,
            taskType,
          });

    await syncRoadmapFromSessionScore({
      supabase,
      studentId,
      sourceSessionId: String(attemptId ?? `writing-${Date.now()}`),
      skill: "writing",
      deductions,
    });
  } catch (err) {
    console.warn(
      "[/api/evaluate] roadmap sync:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const taskType = body?.taskType;
    const mode = body?.mode || "full";

    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json(
        { error: 'taskType must be "task1" or "task2"', success: false },
        { status: 400 }
      );
    }

    if (mode === "paragraph") {
      const paragraphText = body?.paragraphText;
      const stepIndex = Number(body?.stepIndex);
      const questionPrompt = body?.questionPrompt;

      if (typeof paragraphText !== "string" || !paragraphText.trim()) {
        return NextResponse.json(
          { error: "Paragraph is empty", success: false },
          { status: 400 }
        );
      }
      if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) {
        return NextResponse.json(
          { error: "stepIndex must be 0–3", success: false },
          { status: 400 }
        );
      }
      if (typeof questionPrompt !== "string" || !questionPrompt.trim()) {
        return NextResponse.json(
          { error: "questionPrompt is required", success: false },
          { status: 400 }
        );
      }

      const result = await evaluateWritingParagraph({
        taskType,
        stepIndex,
        paragraphText,
        questionPrompt,
        visualType: body?.visualType,
        essayType: body?.essayType,
        p1Text: body?.p1Text ?? "",
        p2Text: body?.p2Text ?? "",
        p3Text: body?.p3Text ?? "",
      });

      return NextResponse.json({ success: true, ...result }, { status: 200 });
    }

    if (mode === "guided-final") {
      const paragraphs = body?.paragraphs;
      if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
        return NextResponse.json(
          { error: "paragraphs array is required", success: false },
          { status: 400 }
        );
      }

      const essay = combineGuidedParagraphs(paragraphs);
      if (!essay.trim()) {
        return NextResponse.json(
          { error: "Combined essay is empty", success: false },
          { status: 400 }
        );
      }

      const { evaluation, bands, structuredScore } = await evaluateEssay(essay, taskType);

      const session = await getServerSession(authOptions);
      const promptId = typeof body?.promptId === "string" ? body.promptId : null;
      const attemptId = await persistWritingAttempt({
        studentId: session?.user?.id,
        taskType,
        essay,
        evaluation,
        bands,
        promptId,
        structuredScore,
      });
      await syncWritingRoadmap({
        studentId: session?.user?.id,
        attemptId,
        taskType,
        evaluation,
        bands,
        structuredScore,
      });

      return NextResponse.json(
        { evaluation, bands, structuredScore, success: true, guided: true },
        { status: 200 }
      );
    }

    const essay = body?.essay;
    if (typeof essay !== "string" || !essay.trim()) {
      return NextResponse.json(
        { error: "Essay is empty", success: false },
        { status: 400 }
      );
    }

    const promptId = typeof body?.promptId === "string" ? body.promptId : null;

    const { evaluation, bands, structuredScore } = await evaluateEssay(essay, taskType);

    const session = await getServerSession(authOptions);
    const attemptId = await persistWritingAttempt({
      studentId: session?.user?.id,
      taskType,
      essay,
      evaluation,
      bands,
      promptId,
      structuredScore,
    });
    await syncWritingRoadmap({
      studentId: session?.user?.id,
      attemptId,
      taskType,
      evaluation,
      bands,
      structuredScore,
    });

    return NextResponse.json({ evaluation, bands, structuredScore, success: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/evaluate] Error:", err?.message || err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Something went wrong",
        success: false,
      },
      { status: 500 }
    );
  }
}
