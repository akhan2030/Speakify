import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { getPart3Questions } from "@/lib/speakingQuestions.js";
import {
  generatePart3Questions,
  normalizeExaminerCueCard,
  normalizeLegacyCueCard,
} from "@/lib/speaking/part3Generation";

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

function normalizeCueCardInput(raw) {
  if (!raw || typeof raw !== "object") return null;
  return (
    normalizeExaminerCueCard(raw) ||
    normalizeLegacyCueCard(raw) ||
    normalizeExaminerCueCard({
      id: raw.id,
      topic: raw.title ?? raw.topic,
      prompt: raw.prompt,
      bullets: raw.bullets,
      closing: raw.closing,
    })
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    const sessionId = body.sessionId ? String(body.sessionId) : null;
    const part2Transcript = String(body.part2Transcript ?? "").trim();
    const testType = body.testType ? String(body.testType) : "ielts_academic";

    let cueCard = normalizeCueCardInput(body.cueCard);
    let resolvedTranscript = part2Transcript;

    if (sessionId && process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = getSupabase();
      const { data: speakingSession } = await supabase
        .from("speaking_sessions")
        .select("student_id, part2_cue_card, part2_transcript, part3_questions, transcript")
        .eq("id", sessionId)
        .maybeSingle();

      if (!speakingSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (studentId && speakingSession.student_id !== studentId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      if (
        Array.isArray(speakingSession.part3_questions) &&
        speakingSession.part3_questions.length >= 3 &&
        !body.regenerate
      ) {
        return NextResponse.json({ questions: speakingSession.part3_questions });
      }

      cueCard = cueCard || normalizeCueCardInput(speakingSession.part2_cue_card);
      if (!resolvedTranscript && speakingSession.part2_transcript) {
        resolvedTranscript = String(speakingSession.part2_transcript).trim();
      }
      if (!resolvedTranscript && Array.isArray(speakingSession.transcript)) {
        resolvedTranscript = speakingSession.transcript
          .filter((entry) => entry?.role === "student" && Number(entry?.part) === 2)
          .map((entry) => String(entry?.text || "").trim())
          .filter(Boolean)
          .join(" ")
          .trim();
      }
    }

    if (!cueCard?.title || !cueCard?.prompt) {
      return NextResponse.json({ error: "Part 2 cue card is required" }, { status: 400 });
    }

    const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    const staticFallback =
      cueCard?.id && /^\d+$/.test(String(cueCard.id))
        ? getPart3Questions(Number(cueCard.id))
        : [];

    const questions = await generatePart3Questions(
      openai,
      cueCard,
      resolvedTranscript,
      testType,
      staticFallback
    );

    if (sessionId && process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = getSupabase();
      await supabase
        .from("speaking_sessions")
        .update({
          part2_cue_card: cueCard,
          part2_transcript: resolvedTranscript || null,
          part3_questions: questions,
        })
        .eq("id", sessionId);
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[speaking/part3-questions]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate Part 3 questions" },
      { status: 500 }
    );
  }
}
