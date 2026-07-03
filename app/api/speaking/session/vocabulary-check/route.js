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

function nextReviewDate(reviewCount, correct) {
  const days = correct ? [1, 3, 7, 14, 30][Math.min(reviewCount, 4)] : 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, word, sentence } = await req.json();
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

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = createClient(
        getSupabaseUrl(),
        process.env.SUPABASE_SERVICE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const today = new Date().toISOString().split("T")[0];
      const lookup = id
        ? supabase
            .from("vocabulary_bank")
            .select("id, review_count, correct_count, incorrect_count")
            .eq("id", id)
            .eq("student_id", studentId)
            .maybeSingle()
        : supabase
            .from("vocabulary_bank")
            .select("id, review_count, correct_count, incorrect_count")
            .eq("student_id", studentId)
            .eq("word", targetWord.toLowerCase())
            .maybeSingle();

      const { data: bankRow, error: lookupError } = await lookup;
      if (!lookupError && bankRow?.id) {
        const currentReviewCount = Number(bankRow.review_count ?? 0);
        const updatedReviewCount = correct ? currentReviewCount + 1 : currentReviewCount;
        await supabase
          .from("vocabulary_bank")
          .update({
            review_count: updatedReviewCount,
            correct_count: Number(bankRow.correct_count ?? 0) + (correct ? 1 : 0),
            incorrect_count: Number(bankRow.incorrect_count ?? 0) + (correct ? 0 : 1),
            next_review_date: nextReviewDate(updatedReviewCount, correct),
            last_practiced_at: new Date().toISOString(),
            last_sentence: studentSentence,
            last_feedback: message,
            status: correct && updatedReviewCount >= 4 ? "mastered" : "due",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bankRow.id)
          .eq("student_id", studentId);
      } else if (correct) {
        await supabase
          .from("speaking_vocabulary_progress")
          .update({ practiced: true })
          .eq("student_id", studentId)
          .eq("word", targetWord)
          .eq("assigned_date", today);
      }
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
