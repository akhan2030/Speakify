import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  IELTS_EXAMINER_SYSTEM_PROMPT,
  PART3_QUESTIONS,
} from "@/lib/speaking/examinerPrompt";

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

function part3KeyFromTopic(cueCardTopic) {
  const t = String(cueCardTopic || "").toLowerCase();
  if (t.includes("place") || t.includes("visit")) return "place";
  if (t.includes("person") || t.includes("influence")) return "person";
  if (t.includes("skill")) return "skill";
  if (t.includes("journey") || t.includes("travel")) return "journey";
  return "default";
}

export async function POST(req) {
  try {
    const {
      sessionId,
      studentMessage,
      currentPart,
      conversationHistory,
      cueCardTopic,
    } = await req.json();

    if (!sessionId || !studentMessage) {
      return NextResponse.json(
        { error: "sessionId and studentMessage are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabase = getSupabase();

    const historyMessages = (conversationHistory || []).map((entry) => ({
      role: entry.role === "student" ? "user" : "assistant",
      content: entry.text,
    }));

    const partContext =
      currentPart === 1
        ? "You are conducting Part 1. Ask personal questions and follow-ups."
        : currentPart === 2
          ? "Part 2 has just finished. Acknowledge and transition to Part 3."
          : `You are conducting Part 3. Ask abstract questions related to: ${cueCardTopic}. Use these Part 3 questions as reference: ${JSON.stringify(
              PART3_QUESTIONS[part3KeyFromTopic(cueCardTopic)] ||
                PART3_QUESTIONS.default
            )}`;

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

    const { data: session } = await supabase
      .from("speaking_sessions")
      .select("transcript")
      .eq("id", sessionId)
      .single();

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

    await supabase
      .from("speaking_sessions")
      .update({ transcript: updatedTranscript })
      .eq("id", sessionId);

    return NextResponse.json({
      speech: examinerResponse.speech,
      action: examinerResponse.action,
    });
  } catch (err) {
    console.error("[speaking/session/message]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Message failed" },
      { status: 500 }
    );
  }
}
