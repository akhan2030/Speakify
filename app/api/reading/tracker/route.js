import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { calculateEstimatedBand } from "../../../../lib/readingScorer.js";

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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      console.warn("[reading/tracker] Supabase not configured");
      return NextResponse.json({ rows: [] });
    }

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get("all") === "true";

    const supabase = getSupabase();

    let query = supabase
      .from("reading_tracker")
      .select(
        "question_type, attempts, correct_answers, total_questions, accuracy, estimated_band"
      )
      .eq("student_id", studentId);

    if (fetchAll) {
      query = query.order("question_type", { ascending: true });
    } else {
      query = query.gt("attempts", 0).order("attempts", { ascending: false }).limit(3);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[reading/tracker] Supabase error:", error.message);
      return NextResponse.json({ rows: [] });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch (err) {
    console.error("[reading/tracker]", err);
    return NextResponse.json({ rows: [] });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const questionType = body?.questionType;
    const score = Number(body?.score ?? 0);
    const total = Number(body?.total ?? 0);

    if (!questionType || total <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getSupabase();
    const sessionAccuracy = (score / total) * 100;

    const { data: existing } = await supabase
      .from("reading_tracker")
      .select("*")
      .eq("student_id", studentId)
      .eq("question_type", questionType)
      .maybeSingle();

    const prevAttempts = existing?.attempts ?? 0;
    const prevCorrect = existing?.correct_answers ?? 0;
    const prevTotalQuestions = existing?.total_questions ?? 0;

    const newAttempts = prevAttempts + 1;
    const newCorrect = prevCorrect + score;
    const newTotalQuestions = prevTotalQuestions + total;
    const newAccuracy =
      newTotalQuestions > 0 ? (newCorrect / newTotalQuestions) * 100 : sessionAccuracy;

    const payload = {
      student_id: studentId,
      question_type: questionType,
      attempts: newAttempts,
      correct_answers: newCorrect,
      total_questions: newTotalQuestions,
      accuracy: Math.round(newAccuracy * 10) / 10,
      estimated_band: calculateEstimatedBand(newAccuracy),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("reading_tracker")
      .upsert(payload, { onConflict: "student_id,question_type" });

    if (error) {
      const fallback = {
        student_id: studentId,
        question_type: questionType,
        attempts: newAttempts,
        accuracy: Math.round(newAccuracy * 10) / 10,
        estimated_band: calculateEstimatedBand(newAccuracy),
      };
      await supabase
        .from("reading_tracker")
        .upsert(fallback, { onConflict: "student_id,question_type" });
    }

    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    console.error("[reading/tracker] POST", err);
    return NextResponse.json({ error: "Failed to update tracker" }, { status: 500 });
  }
}
