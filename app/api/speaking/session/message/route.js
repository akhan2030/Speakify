import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  IELTS_EXAMINER_SYSTEM_PROMPT,
  PART2_CUE_CARDS,
} from "@/lib/speaking/examinerPrompt";
import {
  buildPart3TransitionSpeech,
  extractPart2TranscriptFromSession,
  generatePart3Questions,
  normalizeExaminerCueCard,
} from "@/lib/speaking/part3Generation";
import {
  generatePracticeCoachingHint,
  lastExaminerQuestionFromHistory,
} from "@/lib/speaking/practiceCoaching";
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
  const stored = normalizeExaminerCueCard({
    id: session?.part2_cue_card?.id,
    topic: session?.part2_cue_card?.title ?? session?.part2_cue_card?.topic,
    prompt: session?.part2_cue_card?.prompt,
    bullets: session?.part2_cue_card?.bullets,
    closing: session?.part2_cue_card?.closing,
  });
  if (stored) return stored;

  const card = PART2_CUE_CARDS.find((entry) => entry.id === session?.cue_card_id);
  return card ? normalizeExaminerCueCard(card) : null;
}

function isMissingColumnError(error) {
  const message = String(error?.message || error?.details || "").toLowerCase();
  return (
    message.includes("part2_cue_card") ||
    message.includes("part2_transcript") ||
    message.includes("part3_questions") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

async function persistPart3Fields(supabase, sessionId, fields) {
  const { error } = await supabase
    .from("speaking_sessions")
    .update(fields)
    .eq("id", sessionId);

  if (!error) return;

  if (!isMissingColumnError(error)) {
    console.warn("[speaking/session/message] persist fields:", error.message);
    return;
  }

  // Fallback: only write columns that exist on older schemas.
  const safeFields = { ...fields };
  delete safeFields.part2_cue_card;
  delete safeFields.part2_transcript;
  delete safeFields.part3_questions;

  if (Object.keys(safeFields).length === 0) return;

  const { error: safeError } = await supabase
    .from("speaking_sessions")
    .update(safeFields)
    .eq("id", sessionId);

  if (safeError) {
    console.warn("[speaking/session/message] persist safe fields:", safeError.message);
  }
}

async function loadSpeakingSession(supabase, sessionId) {
  const fullSelect =
    "id, programme, cue_card_id, part2_cue_card, part2_transcript, part3_questions, transcript";
  const { data, error } = await supabase
    .from("speaking_sessions")
    .select(fullSelect)
    .eq("id", sessionId)
    .single();

  if (!error) return data;

  if (!isMissingColumnError(error)) {
    throw error;
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from("speaking_sessions")
    .select("id, programme, cue_card_id, transcript")
    .eq("id", sessionId)
    .single();

  if (fallbackError) throw fallbackError;
  return fallback;
}

/**
 * Part 3 questions are ALWAYS derived from the Part 2 cue card (+ transcript).
 * Never selected from an independent topic bank.
 */
async function ensureSessionPart3Questions(supabase, openai, session) {
  if (Array.isArray(session?.part3_questions) && session.part3_questions.length >= 3) {
    return {
      questions: session.part3_questions,
      cueCard: cueCardFromSession(session),
    };
  }

  const cueCard = cueCardFromSession(session);
  if (!cueCard) {
    return { questions: [], cueCard: null };
  }

  const part2Transcript =
    String(session?.part2_transcript || "").trim() ||
    extractPart2TranscriptFromSession(session?.transcript);

  const questions = await generatePart3Questions(
    openai,
    cueCard,
    part2Transcript,
    session?.programme
  );

  await persistPart3Fields(supabase, session.id, {
    part2_cue_card: cueCard,
    part2_transcript: part2Transcript || null,
    part3_questions: questions,
  });

  return { questions, cueCard };
}

export async function POST(req) {
  try {
    const {
      sessionId,
      studentMessage,
      currentPart,
      conversationHistory,
      words,
      speakingDurationMs,
      sessionType,
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

    const session = await loadSpeakingSession(supabase, sessionId);

    let cueCard = cueCardFromSession(session);
    let part2Transcript =
      String(session?.part2_transcript || "").trim() ||
      extractPart2TranscriptFromSession(session?.transcript);

    if (currentPart === 2) {
      part2Transcript = part2Transcript
        ? `${part2Transcript} ${studentMessage}`.trim()
        : String(studentMessage).trim();
    }

    // Generate Part 3 BEFORE the examiner speaks, so transition speech cannot invent a new topic.
    let part3Questions = Array.isArray(session?.part3_questions) ? session.part3_questions : [];
    if (currentPart === 2 || currentPart === 3 || part3Questions.length < 3) {
      const ensured = await ensureSessionPart3Questions(supabase, openai, {
        ...session,
        part2_transcript: part2Transcript,
        transcript: [
          ...(session?.transcript || []),
          ...(currentPart === 2
            ? [{ role: "student", text: studentMessage, part: 2 }]
            : []),
        ],
      });
      part3Questions = ensured.questions;
      if (ensured.cueCard) cueCard = ensured.cueCard;
    }

    const historyMessages = (conversationHistory || []).map((entry) => ({
      role: entry.role === "student" ? "user" : "assistant",
      content: entry.text,
    }));

    const partContext =
      currentPart === 1
        ? "You are conducting Part 1. Ask personal questions and follow-ups."
        : currentPart === 2
          ? `Part 2 has just finished on the cue card "${cueCard?.title ?? "the topic"}". Acknowledge briefly. If you move to Part 3, you MUST use ONLY these approved Part 3 questions (same theme): ${JSON.stringify(part3Questions)}. Do not invent a different topic.`
          : `You are conducting Part 3. The Part 2 cue card topic was "${cueCard?.title ?? "the previous topic"}". Stay on this theme only. Ask abstract discussion questions from this approved list (use them in order, adapting slightly for natural speech): ${JSON.stringify(part3Questions)}. Do not introduce unrelated topics. Never ask about technology, Vision 2030, or education unless the Part 2 cue card was about that theme.`;

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
    let coachingHint = null;
    const isPractice = sessionType === "practice";
    const lastExaminerQuestion = lastExaminerQuestionFromHistory(conversationHistory);

    try {
      const examinerPromise = openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.7,
      });

      const coachingPromise = isPractice
        ? generatePracticeCoachingHint(openai, {
            studentMessage,
            currentPart: Number(currentPart) || 1,
            lastExaminerQuestion,
            programme: session?.programme ?? "ielts",
          })
        : Promise.resolve(null);

      const [examinerResponse, coaching] = await Promise.all([
        examinerPromise,
        coachingPromise,
      ]);
      response = examinerResponse;
      coachingHint = coaching;
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

    // Hard override: Part 3 transition speech must open with the themed first question.
    if (
      (examinerResponse.action === "start_part3" || currentPart === 2) &&
      cueCard &&
      part3Questions[0]
    ) {
      const wantsPart3 =
        examinerResponse.action === "start_part3" ||
        /part\s*3|move on|discussion/i.test(String(examinerResponse.speech || ""));
      if (wantsPart3 || examinerResponse.action === "start_part3") {
        examinerResponse.action = "start_part3";
        examinerResponse.speech = buildPart3TransitionSpeech(cueCard, part3Questions[0]);
      }
    }

    // Normalize closing lines so the client always receives end_test.
    const speechText = String(examinerResponse.speech || "");
    if (
      examinerResponse.action === "end_test" ||
      /that is the end of the speaking test|end of the speaking test|have a (nice|good) day|goodbye/i.test(
        speechText
      )
    ) {
      examinerResponse.action = "end_test";
      if (!/end of the speaking test/i.test(speechText)) {
        examinerResponse.speech =
          "Thank you. That is the end of the Speaking test. Have a good day. Goodbye.";
      }
    }

    const studentWords = Array.isArray(words)
      ? words
          .map((w) => ({
            word: String(w?.word || "").trim(),
            start: Number(w?.start) || 0,
            end: Number(w?.end) || 0,
            confidence: w?.confidence != null ? Number(w.confidence) : undefined,
          }))
          .filter((w) => w.word)
      : [];

    const updatedTranscript = [
      ...(session?.transcript || []),
      {
        role: "student",
        text: studentMessage,
        part: currentPart,
        timestamp: new Date().toISOString(),
        words: studentWords,
        speakingDurationMs:
          speakingDurationMs != null ? Number(speakingDurationMs) : undefined,
      },
      {
        role: "examiner",
        text: examinerResponse.speech,
        action: examinerResponse.action,
        part: currentPart === 2 && examinerResponse.action === "start_part3" ? 3 : currentPart,
        timestamp: new Date().toISOString(),
      },
    ];

    const updatePayload = { transcript: updatedTranscript };
    if (currentPart === 2) {
      updatePayload.part2_transcript = part2Transcript;
    }
    if (part3Questions.length >= 3) {
      updatePayload.part3_questions = part3Questions;
    }
    if (cueCard) {
      updatePayload.part2_cue_card = cueCard;
    }

    await persistPart3Fields(supabase, sessionId, updatePayload);

    return NextResponse.json({
      speech: examinerResponse.speech,
      action: examinerResponse.action,
      part3Questions,
      coachingHint: coachingHint?.hint ?? null,
      coachingFocus: coachingHint?.focus ?? null,
    });
  } catch (err) {
    console.error("[speaking/session/message]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Message failed" },
      { status: 500 }
    );
  }
}
