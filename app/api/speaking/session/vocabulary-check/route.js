import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { word, sentence } = await req.json();
    const targetWord = String(word ?? "").trim();
    const studentSentence = String(sentence ?? "").trim();

    if (!targetWord || !studentSentence) {
      return NextResponse.json(
        { error: "word and sentence are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You check IELTS vocabulary practice. Return JSON: { \"correct\": boolean, \"message\": string }. Message is one line: praise if correct, or brief correction with a model sentence if wrong.",
        },
        {
          role: "user",
          content: `The student is practicing the word "${targetWord}". They wrote: "${studentSentence}". Did they use the word correctly and naturally?`,
        },
      ],
      max_tokens: 120,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const correct = parsed.correct === true;
    const message =
      String(parsed.message ?? "").trim() ||
      (correct
        ? `Great! Natural usage of "${targetWord}".`
        : `Almost — try using "${targetWord}" in a clearer context.`);

    if (correct && process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = createClient(
        getSupabaseUrl(),
        process.env.SUPABASE_SERVICE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("speaking_vocabulary_progress")
        .update({ practiced: true })
        .eq("student_id", studentId)
        .eq("word", targetWord)
        .eq("assigned_date", today);
    }

    return NextResponse.json({ correct, message });
  } catch (err) {
    console.error("[speaking/session/vocabulary-check]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Check failed" },
      { status: 500 }
    );
  }
}
