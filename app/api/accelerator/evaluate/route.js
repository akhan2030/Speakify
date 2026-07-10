import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { isValidTrack } from "@/lib/accelerator/tracks";
import {
  evaluateAcceleratorSpeaking,
  evaluateAcceleratorWriting,
} from "@/lib/accelerator/serverEvaluate";

export const runtime = "nodejs";
export const maxDuration = 120;

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const section = String(body.section ?? "").trim();
    const track = body.track ?? "";
    const taskType = body.taskType ?? "task2";

    if (!isValidTrack(track)) {
      return NextResponse.json({ error: "Invalid track" }, { status: 400 });
    }

    if (section === "writing") {
      const studentAnswer = body.studentAnswer ?? body.answers ?? {};
      const taskPrompt = body.taskPrompt ?? body.prompts ?? {};

      const evaluation = await evaluateAcceleratorWriting({
        studentAnswer,
        taskPrompt,
        track,
      });

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("accelerator_practice_attempts").insert({
          student_id: session.user.id,
          section: "writing",
          score: Math.round(evaluation.band * 10),
          weak_areas: evaluation.weakAreas,
          completed_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        ok: true,
        section: "writing",
        bandScore: evaluation.band,
        overallBand: evaluation.band,
        feedback: evaluation.feedback,
        weakAreas: evaluation.weakAreas,
        taskType,
        serverEvaluated: true,
      });
    }

    if (section === "speaking") {
      const evaluation = await evaluateAcceleratorSpeaking({
        studentId: session.user.id,
        sessionId: body.sessionId ?? null,
        answers: body.studentAnswer ?? body.answers ?? {},
        track,
      });

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("accelerator_practice_attempts").insert({
          student_id: session.user.id,
          section: "speaking",
          score: Math.round(evaluation.band * 10),
          weak_areas: evaluation.weakAreas,
          completed_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        ok: true,
        section: "speaking",
        bandScore: evaluation.band,
        overallBand: evaluation.band,
        feedback: evaluation.feedback,
        weakAreas: evaluation.weakAreas,
        serverEvaluated: true,
      });
    }

    return NextResponse.json({ error: "section must be writing or speaking" }, { status: 400 });
  } catch (err) {
    console.error("[accelerator/evaluate]", err);
    const message = err instanceof Error ? err.message : "Evaluation failed";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
