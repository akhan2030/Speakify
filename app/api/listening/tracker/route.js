import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { LISTENING_QUESTION_TYPES } from "../../../../lib/listeningGenerator.js";

export const runtime = "nodejs";

/** Excel seed defaults when student has no tracker rows */
const EXCEL_DEFAULTS = {
  "Multiple Choice": {
    totalAttempts: 7,
    correctAnswers: 3,
    accuracy: 42.9,
    estimatedBand: 4.3,
  },
  "Form Completion": {
    totalAttempts: 10,
    correctAnswers: 4,
    accuracy: 40.0,
    estimatedBand: 4.0,
  },
  "Sentence Completion": {
    totalAttempts: 10,
    correctAnswers: 2,
    accuracy: 20.0,
    estimatedBand: 2.0,
  },
};

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

function resolveStudentId(session, bodyOrQueryId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (bodyOrQueryId && bodyOrQueryId !== sessionId) return null;
  return sessionId;
}

/**
 * @param {Array<object>|null} dbRows
 * @param {boolean} useExcelDefaults
 */
function buildTrackerRows(dbRows, useExcelDefaults) {
  const byType = new Map();
  for (const row of dbRows ?? []) {
    const key = String(row.question_type ?? "").trim();
    if (key) byType.set(key, row);
  }

  return LISTENING_QUESTION_TYPES.map((qt) => {
    const db = byType.get(qt.trackerName);
    const excel = useExcelDefaults ? EXCEL_DEFAULTS[qt.trackerName] : null;

    const totalAttempts = Number(
      db?.total_attempts ?? db?.attempts ?? excel?.totalAttempts ?? 0
    );
    const correctAnswers = Number(
      db?.correct_answers ?? excel?.correctAnswers ?? 0
    );
    let accuracy =
      db?.accuracy != null
        ? Number(db.accuracy)
        : excel?.accuracy != null
          ? Number(excel.accuracy)
          : null;
    let estimatedBand =
      db?.estimated_band != null
        ? Number(db.estimated_band)
        : excel?.estimatedBand != null
          ? Number(excel.estimatedBand)
          : null;

    if (
      accuracy === null &&
      totalAttempts > 0 &&
      Number.isFinite(correctAnswers)
    ) {
      accuracy = Math.round((correctAnswers / totalAttempts) * 1000) / 10;
    }

    const attempted = totalAttempts > 0;

    return {
      questionType: qt.trackerName,
      questionTypeId: qt.id,
      totalAttempts,
      correctAnswers,
      accuracy: attempted ? accuracy : null,
      estimatedBand: attempted ? estimatedBand : null,
      attempted,
    };
  });
}

function summarizeRows(rows) {
  const attempted = rows.filter((r) => r.attempted);
  const bands = attempted
    .map((r) => r.estimatedBand)
    .filter((b) => typeof b === "number" && Number.isFinite(b));

  const overallBand =
    bands.length > 0
      ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 2) / 2
      : null;

  return {
    hasData: attempted.length > 0,
    typesAttempted: attempted.length,
    overallBand,
    rows,
  };
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      const rows = buildTrackerRows(null, true);
      return NextResponse.json(summarizeRows(rows));
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("listening_tracker")
      .select(
        "question_type, total_attempts, correct_answers, accuracy, estimated_band, attempts"
      )
      .eq("student_id", studentId);

    if (error) {
      console.warn("[listening/tracker] read:", error.message);
      const rows = buildTrackerRows(null, true);
      return NextResponse.json(summarizeRows(rows));
    }

    const dbRows = data ?? [];
    const useExcelDefaults = dbRows.length === 0;
    const rows = buildTrackerRows(dbRows, useExcelDefaults);

    return NextResponse.json(summarizeRows(rows));
  } catch (err) {
    console.error("[listening/tracker] GET", err);
    const rows = buildTrackerRows(null, true);
    return NextResponse.json(summarizeRows(rows));
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const studentId = resolveStudentId(session, body?.studentId);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questionType = String(
      body?.questionType ?? body?.question_type ?? ""
    ).trim();
    if (!questionType) {
      return NextResponse.json(
        { error: "questionType is required" },
        { status: 400 }
      );
    }

    const totalAttempts = Math.max(
      0,
      Number(body?.totalAttempts ?? body?.total_attempts ?? 0)
    );
    const correctAnswers = Math.max(
      0,
      Number(body?.correctAnswers ?? body?.correct_answers ?? 0)
    );
    const accuracy =
      body?.accuracy != null
        ? Number(body.accuracy)
        : totalAttempts > 0
          ? Math.round((correctAnswers / totalAttempts) * 1000) / 10
          : null;
    const estimatedBand =
      body?.estimatedBand != null
        ? Number(body.estimatedBand)
        : body?.estimated_band != null
          ? Number(body.estimated_band)
          : null;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const supabase = getSupabase();
    const payload = {
      student_id: studentId,
      question_type: questionType,
      total_attempts: totalAttempts,
      correct_answers: correctAnswers,
      accuracy,
      estimated_band: estimatedBand,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("listening_tracker")
      .upsert(payload, { onConflict: "student_id,question_type" });

    if (error) {
      console.warn("[listening/tracker] upsert:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    console.error("[listening/tracker] POST", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update tracker" },
      { status: 500 }
    );
  }
}
