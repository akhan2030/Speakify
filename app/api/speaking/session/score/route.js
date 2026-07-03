import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { SCORING_PROMPT } from "@/lib/speaking/examinerPrompt";
import {
  extractStudentSpeech,
  hasValidSpeechInput,
} from "@/lib/speaking/validateSpeechInput";

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

export async function POST(req) {
  try {
    const { sessionId, studentId, speakingTimeSeconds } = await req.json();

    if (!sessionId || !studentId) {
      return NextResponse.json(
        { error: "sessionId and studentId are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
    }

    const supabase = getSupabase();

    const { data: session, error: sessionError } = await supabase
      .from("speaking_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.student_id !== studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const transcript = Array.isArray(session.transcript) ? session.transcript : [];
    const speechSeconds = Number(speakingTimeSeconds) || Number(session.speaking_time_seconds) || 0;

    const validation = hasValidSpeechInput({
      transcript,
      speakingTimeSeconds: speechSeconds,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.reason || "Insufficient speech data. Please complete the speaking session.",
          insufficientSpeech: true,
        },
        { status: 400 }
      );
    }

    const extracted = extractStudentSpeech(transcript);
    const studentTranscript = transcript
      .filter((t) => t.role === "student")
      .filter(
        (t) =>
          !["i have finished speaking about the topic on the cue card."].includes(
            String(t.text || "").trim().toLowerCase()
          )
      )
      .map((t) => `[Part ${t.part}] ${t.text}`)
      .join("\n");

    if (!studentTranscript || extracted.wordCount < 30) {
      return NextResponse.json(
        {
          error: "Not enough speech detected. Minimum 30 words required for scoring.",
          insufficientSpeech: true,
        },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SCORING_PROMPT },
        {
          role: "user",
          content: `Full student transcript:\n\n${studentTranscript}\n\nProvide band scores and detailed feedback.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const feedback = JSON.parse(raw);

    const completedAt = new Date();
    const startedAt = session.started_at ? new Date(session.started_at) : completedAt;
    const durationMinutes = Math.max(
      1,
      Math.round((completedAt.getTime() - startedAt.getTime()) / 60000)
    );

    await supabase
      .from("speaking_sessions")
      .update({
        overall_band: feedback.overallBand,
        fluency_band: feedback.criteria?.fluencyCoherence,
        lexical_band: feedback.criteria?.lexicalResource,
        grammar_band: feedback.criteria?.grammaticalRange,
        pronunciation_band: feedback.criteria?.pronunciation,
        feedback,
        duration_minutes: durationMinutes,
        speaking_time_seconds: speechSeconds,
        completed_at: completedAt.toISOString(),
      })
      .eq("id", sessionId);

    const { data: existing } = await supabase
      .from("speaking_progress")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    const bandHistory = Array.isArray(existing?.band_history)
      ? [...existing.band_history]
      : [];
    bandHistory.push({
      sessionNumber: session.session_number,
      band: feedback.overallBand,
      date: new Date().toISOString(),
    });

    await supabase.from("speaking_progress").upsert(
      {
        student_id: studentId,
        total_sessions: (existing?.total_sessions || 0) + 1,
        current_band: feedback.overallBand,
        best_band: Math.max(existing?.best_band || 0, feedback.overallBand || 0),
        band_history: bandHistory.slice(-20),
        last_session_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id" }
    );

    if (feedback.vocabularyChallenge?.length > 0) {
      const rows = feedback.vocabularyChallenge.map((word) => ({
        student_id: studentId,
        word,
        assigned_date: new Date().toISOString().split("T")[0],
      }));
      await supabase.from("speaking_vocabulary_progress").upsert(rows, {
        onConflict: "student_id,word,assigned_date",
        ignoreDuplicates: true,
      });
    }

    return NextResponse.json(feedback);
  } catch (err) {
    console.error("[speaking/session/score]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 500 }
    );
  }
}
