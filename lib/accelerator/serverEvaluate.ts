import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import type { AcceleratorTrackId } from "@/lib/accelerator/tracks";
import { runStructuredWritingScoring } from "@/lib/ielts/structuredWritingScoring";
import { structuredWritingToFlatBands } from "@/lib/ielts/writingScoringSchema";
import {
  scoreObjectiveSection,
  scoreSpeakingSection,
  overallBandFromSkills,
} from "@/lib/accelerator/scoring";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function scoreWritingAnswer(input: {
  task1?: string;
  task2?: string;
  task1Prompt?: string;
  task2Prompt?: string;
}): Promise<{ band: number; feedback: Record<string, unknown>; weakAreas: string[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const bands: number[] = [];
  const feedback: Record<string, unknown> = {};
  const weakAreas: string[] = [];

  if (input.task1?.trim()) {
    const structured = await runStructuredWritingScoring({
      openai,
      essay: input.task1,
      taskType: "task1",
      questionPrompt: input.task1Prompt,
    });
    if (structured) {
      const flat = structuredWritingToFlatBands(structured);
      bands.push(flat.overall);
      feedback.task1 = structured;
      if (flat.overall < 6) weakAreas.push("Task 1 — strengthen overview and data selection");
    }
  }

  if (input.task2?.trim()) {
    const structured = await runStructuredWritingScoring({
      openai,
      essay: input.task2,
      taskType: "task2",
      questionPrompt: input.task2Prompt,
    });
    if (structured) {
      const flat = structuredWritingToFlatBands(structured);
      bands.push(flat.overall);
      feedback.task2 = structured;
      if (flat.overall < 6) weakAreas.push("Task 2 — develop position and paragraph structure");
    }
  }

  if (bands.length === 0) {
    return {
      band: 5,
      feedback: { error: "No writing content to score" },
      weakAreas: ["Submit both Task 1 and Task 2 responses"],
    };
  }

  const band = overallBandFromSkills(bands);
  if (weakAreas.length === 0) {
    weakAreas.push("Compare your response with the model answers below");
  }

  return { band, feedback, weakAreas };
}

export async function evaluateAcceleratorWriting(input: {
  studentAnswer: { task1?: string; task2?: string };
  taskPrompt?: { task1?: string; task2?: string };
  track: AcceleratorTrackId;
}) {
  return scoreWritingAnswer({
    task1: input.studentAnswer.task1,
    task2: input.studentAnswer.task2,
    task1Prompt: input.taskPrompt?.task1,
    task2Prompt: input.taskPrompt?.task2,
  });
}

export async function evaluateAcceleratorSpeaking(input: {
  studentId: string;
  sessionId?: string | null;
  answers?: Record<string, string>;
  track: AcceleratorTrackId;
}): Promise<{ band: number; feedback: Record<string, unknown>; weakAreas: string[] }> {
  if (input.sessionId) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Database not configured");
    }

    const { data: speakingSession, error } = await supabase
      .from("speaking_sessions")
      .select("overall_band, student_id")
      .eq("id", input.sessionId)
      .maybeSingle();

    if (error) throw error;
    if (!speakingSession) {
      throw new Error("Speaking session not found");
    }
    if (String(speakingSession.student_id) !== String(input.studentId)) {
      throw new Error("Forbidden");
    }

    const band = Number(speakingSession.overall_band) || 5;
    return {
      band,
      feedback: { source: "speaking_session", sessionId: input.sessionId },
      weakAreas: ["Review examiner feedback from your speaking session"],
    };
  }

  const scored = scoreSpeakingSection(input.answers ?? {}, input.track);
  return {
    band: scored.band,
    feedback: { source: "text_answers", answers: input.answers ?? {} },
    weakAreas: scored.weakAreas,
  };
}

export async function scoreAcceleratorSection(input: {
  section: string;
  answers: Record<string, unknown>;
  answerKey?: unknown;
  track: AcceleratorTrackId;
  studentId: string;
  sessionId?: string | null;
  taskPrompt?: { task1?: string; task2?: string };
}) {
  if (input.section === "writing") {
    const writingAnswers = input.answers as { task1?: string; task2?: string };
    return evaluateAcceleratorWriting({
      studentAnswer: writingAnswers,
      taskPrompt: input.taskPrompt,
      track: input.track,
    });
  }

  if (input.section === "speaking") {
    return evaluateAcceleratorSpeaking({
      studentId: input.studentId,
      sessionId: input.sessionId,
      answers: input.answers as Record<string, string>,
      track: input.track,
    });
  }

  const scored = scoreObjectiveSection(
    input.answers as Record<string, string>,
    input.answerKey
  );
  return {
    band: scored.band,
    feedback: scored,
    weakAreas: scored.weakAreas,
    score: scored.correct,
    accuracy: scored.accuracy,
    totalQuestions: scored.total,
  };
}
