import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  IELTS_EXAMINER_SYSTEM_PROMPT,
  PART2_CUE_CARDS,
} from "@/lib/speaking/examinerPrompt";
import {
  extractPart2TranscriptFromSession,
  generatePart3Questions,
  normalizeExaminerCueCard,
} from "@/lib/speaking/part3Generation";
import { isLikelyRealStudentSpeech } from "@/lib/speaking/validateSpeechInput";

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

function cueCardFromSession(session) {
  const stored = normalizeExaminerCueCard(session?.part2_cue_card ?? {});
  if (stored) return stored;

  const card = PART2_CUE_CARDS.find((entry) => entry.id === session?.cue_card_id);
  return card ? normalizeExaminerCueCard(card) : null;
}

async function ensureSessionPart3Questions(supabase, openai, session) {
  if (Array.isArray(session?.part3_questions) && session.part3_questions.length >= 3) {
    return session.part3_questions;
  }

  const cueCard = cueCardFromSession(session);
  if (!cueCard) return [];

  const part2Transcript =
    String(session?.part2_transcript || "").trim() ||
    extractPart2TranscriptFromSession(session?.transcript);

  const questions = await generatePart3Questions(openai, cueCard, part2Transcript, session?.programme);

  await supabase
    .from("speaking_sessions")
    .update({
      part2_cue_card: cueCard,
      part2_transcript: part2Transcript || null,
      part3_questions: questions,
    })
    .eq("id", session.id);

  return questions;
}

export async function POST(req) {
  try {
    const {
      sessionId,
      studentMessage,
      currentPart,
      conversationHistory,
    } = await req.json();

    if (!sessionId || !studentMessage) {
      return NextResponse.json(
        { error: "sessionId and studentMessage are required" },
        { status: 400 }
      );
    }

    const authenticity = isLikelyRealStudentSpeech(studentMessage);
    if (!authenticity.ok) {
      return NextResponse.json(
        {
          error:
            authenticity.reason ||
            "That recording was not a valid spoken answer. Use headphones and speak your own response.",
          invalidSpeech: true,
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabase = getSupabase();

    const { data: session } = await supabase
      .from("speaking_sessions")
      .select(
        "id, programme, cue_card_id, part2_cue_card, part2_transcript, part3_questions, transcript"
      )
      .eq("id", sessionId)
      .single();

    const cueCard = cueCardFromSession(session);
    const part2Transcript =
      String(session?.part2_transcript || "").trim() ||
      extractPart2TranscriptFromSession(session?.transcript);

    let part3Questions = Array.isArray(session?.part3_questions) ? session.part3_questions : [];

    if (currentPart === 3 && part3Questions.length < 3) {
      part3Questions = await ensureSessionPart3Questions(supabase, openai, {
        ...session,
        part2_transcript: part2Transcript,
      });
    }

    const historyMessages = (conversationHistory || []).map((entry) => ({
      role: entry.role === "student" ? "user" : "assistant",
      content: entry.text,
    }));

    const partContext =
      currentPart === 1
        ? "You are conducting Part 1. Ask personal questions and follow-ups."
        : currentPart === 2
          ? "Part 2 has just finished. Acknowledge briefly and prepare to transition to Part 3 on the same theme."
          : `You are conducting Part 3. The Part 2 cue card topic was "${cueCard?.title ?? "the previous topic"}". Stay on this theme only. Ask abstract discussion questions from this approved list (use them in order, adapting slightly for natural speech): ${JSON.stringify(part3Questions)}. Do not introduce unrelated topics such as generic technology unless the cue card was about technology.`;

    const messages = [
      {
        role: "system",
        content:
          IELTS_EXAMINER_SYSTEM_PROMPT + "\n\nCURRENT CONTEXT: " + partContext,
      },
      ...historyMessages,
      { role: "user", content: studentMessage },
    ];

    console.time("[speaking/session/message] LLM examiner");
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.7,
      });
    } finally {
      console.timeEnd("[speaking/session/message] LLM examiner");
    }

    const raw = response.choices[0]?.message?.content || "{}";
    let examinerResponse;
    try {
      examinerResponse = JSON.parse(raw);
    } catch {
      examinerResponse = {
        speech: "Thank you for that. Could you tell me a little more?",
        action: "follow_up",
      };
    }

    const updatedTranscript = [
      ...(session?.transcript || []),
      {
        role: "student",
        text: studentMessage,
        part: currentPart,
        timestamp: new Date().toISOString(),
      },
      {
        role: "examiner",
        text: examinerResponse.speech,
        action: examinerResponse.action,
        part: currentPart,
        timestamp: new Date().toISOString(),
      },
    ];

    const updatePayload = { transcript: updatedTranscript };

    if (currentPart === 2) {
      updatePayload.part2_transcript = part2Transcript
        ? `${part2Transcript} ${studentMessage}`.trim()
        : String(studentMessage).trim();
    }

    if (examinerResponse.action === "start_part3" || currentPart === 2) {
      const generated = await ensureSessionPart3Questions(supabase, openai, {
        ...session,
        transcript: updatedTranscript,
        part2_transcript: updatePayload.part2_transcript ?? part2Transcript,
      });
      if (generated.length >= 3) {
        updatePayload.part3_questions = generated;
      }
    }

    await supabase.from("speaking_sessions").update(updatePayload).eq("id", sessionId);

    return NextResponse.json({
      speech: examinerResponse.speech,
      action: examinerResponse.action,
      part3Questions: updatePayload.part3_questions ?? part3Questions,
    });
  } catch (err) {
    console.error("[speaking/session/message]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Message failed" },
      { status: 500 }
    );
  }
}
