import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

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

function emptyStats() {
  return {
    passagesCompleted: 0,
    questionsAnswered: 0,
    averageAccuracy: null,
    readingBand: null,
    typesPracticed: 0,
    lastPracticedType: null,
    lastPracticedAt: null,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      console.warn("[reading/stats] Supabase not configured");
      return NextResponse.json(emptyStats());
    }

    const supabase = getSupabase();

    const [attemptsResult, trackerResult] = await Promise.all([
      supabase
        .from("reading_attempts")
        .select("passage_id, total, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reading_tracker")
        .select(
          "question_type, attempts, total_questions, accuracy, estimated_band, updated_at"
        )
        .eq("student_id", studentId)
        .gt("attempts", 0),
    ]);

    if (attemptsResult.error) {
      console.warn("[reading/stats] attempts:", attemptsResult.error.message);
    }
    if (trackerResult.error) {
      console.warn("[reading/stats] tracker:", trackerResult.error.message);
    }

    const attempts = attemptsResult.data ?? [];
    const trackerRows = trackerResult.data ?? [];

    const passagesCompleted = new Set(
      attempts.map((row) => row.passage_id).filter(Boolean)
    ).size;

    const questionsFromAttempts = attempts.reduce(
      (sum, row) => sum + (Number(row.total) || 0),
      0
    );
    const questionsFromTracker = trackerRows.reduce(
      (sum, row) => sum + (Number(row.total_questions) || 0),
      0
    );
    const questionsAnswered = Math.max(
      questionsFromAttempts,
      questionsFromTracker
    );

    const practicedRows = trackerRows.filter((row) => (row.attempts ?? 0) > 0);
    const typesPracticed = practicedRows.length;

    const accuracies = practicedRows
      .map((row) => {
        const acc = Number(row.accuracy);
        return Number.isFinite(acc) ? (acc <= 1 ? acc * 100 : acc) : null;
      })
      .filter((v) => v !== null);

    const averageAccuracy =
      accuracies.length > 0
        ? Math.round(
            (accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 10
          ) / 10
        : null;

    const bands = practicedRows
      .map((row) => Number(row.estimated_band))
      .filter((v) => Number.isFinite(v));

    const readingBand =
      bands.length > 0
        ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) /
          10
        : null;

    let lastPracticedType = null;
    let lastPracticedAt = null;

    if (practicedRows.length > 0) {
      const sorted = [...practicedRows].sort((a, b) => {
        const ta = new Date(a.updated_at ?? 0).getTime();
        const tb = new Date(b.updated_at ?? 0).getTime();
        return tb - ta;
      });
      lastPracticedType = sorted[0]?.question_type ?? null;
      lastPracticedAt = sorted[0]?.updated_at ?? null;
    } else if (attempts.length > 0) {
      lastPracticedAt = attempts[0]?.created_at ?? null;
    }

    return NextResponse.json({
      passagesCompleted,
      questionsAnswered,
      averageAccuracy,
      readingBand,
      typesPracticed,
      lastPracticedType,
      lastPracticedAt,
    });
  } catch (err) {
    console.error("[reading/stats]", err);
    return NextResponse.json(emptyStats());
  }
}
