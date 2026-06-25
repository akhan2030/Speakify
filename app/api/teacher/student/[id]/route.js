import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { CEFR_SUB_LEVELS } from "@/lib/course/cefrLevels";

export const runtime = "nodejs";

const DEFAULT_CEFR = "B1.1";
const VALID_CEFR_CODES = new Set(CEFR_SUB_LEVELS.map((l) => l.code));

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

function roundBand(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function average(nums) {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return null;
  return roundBand(valid.reduce((a, b) => a + b, 0) / valid.length);
}

/** @param {number[]} scores newest first */
function computeTrend(scores) {
  if (!scores.length) return "stable";
  if (scores.length < 2) return "stable";
  const recent = scores.slice(0, Math.min(3, scores.length));
  const older = scores.slice(3, 6);
  if (!older.length) return "stable";
  const recentAvg = average(recent);
  const olderAvg = average(older);
  if (recentAvg === null || olderAvg === null) return "stable";
  if (recentAvg - olderAvg >= 0.3) return "improving";
  if (olderAvg - recentAvg >= 0.3) return "declining";
  return "stable";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function maxIso(...values) {
  let best = null;
  let bestMs = 0;
  for (const v of values) {
    if (!v) continue;
    const ms = new Date(v).getTime();
    if (Number.isFinite(ms) && ms > bestMs) {
      bestMs = ms;
      best = v;
    }
  }
  return best;
}

function todayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function computeVocabStreak(supabase, studentId) {
  const { data } = await supabase
    .from("student_vocab_progress")
    .select("last_studied_at")
    .eq("student_id", studentId)
    .order("last_studied_at", { ascending: false })
    .limit(200);

  if (!data?.length) return 0;

  const days = new Set(
    data.map((r) => String(r.last_studied_at).slice(0, 10)).filter(Boolean)
  );

  let streak = 0;
  let cursor = todayDateKey();
  const addDays = (key, delta) => {
    const d = new Date(`${key}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  };

  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function noteFromRow(row) {
  if (!row) return "";
  return String(row.note ?? row.notes ?? "").trim();
}

async function saveTeacherNote(supabase, teacherId, studentId, noteText) {
  const { data: existing } = await supabase
    .from("teacher_notes")
    .select("id")
    .eq("student_id", studentId)
    .eq("teacher_id", teacherId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    student_id: studentId,
    teacher_id: teacherId,
    note: noteText,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("teacher_notes")
      .update(payload)
      .eq("id", existing.id)
      .select("note, notes, updated_at")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("teacher_notes")
    .insert(payload)
    .select("note, notes, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function requireTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "teacher") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, teacherId: session.user.id };
}

export async function GET(_request, { params }) {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    const studentId = String(params?.id ?? "").trim();
    if (!studentId) {
      return NextResponse.json({ error: "Student id required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { teacherId } = auth;

    let user = null;
    const userRes = await supabase
      .from("users")
      .select("id, name, email, role, cefr_level, created_at, phone")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle();

    if (userRes.error) {
      const fallback = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .eq("id", studentId)
        .eq("role", "student")
        .maybeSingle();
      if (fallback.error) throw fallback.error;
      user = fallback.data;
    } else {
      user = userRes.data;
    }

    if (!user) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [
      readingTracker,
      listeningTracker,
      speakingTracker,
      speakingAttempts,
      writingAttempts,
      readingAttempts,
      listeningAttempts,
      vocabProgress,
      vocabTotal,
      teacherNotes,
    ] = await Promise.all([
      supabase
        .from("reading_tracker")
        .select("question_type, accuracy, estimated_band, updated_at, attempts")
        .eq("student_id", studentId),
      supabase
        .from("listening_tracker")
        .select("question_type, accuracy, estimated_band, updated_at, total_attempts")
        .eq("student_id", studentId),
      supabase
        .from("speaking_tracker")
        .select("band_overall, updated_at, attempts")
        .eq("student_id", studentId),
      supabase
        .from("speaking_attempts")
        .select(
          "id, part, task_type, band_overall, band_fc, band_lr, band_gra, band_p, created_at"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("writing_attempts")
        .select(
          "id, task_type, essay_text, evaluation_text, band_overall, band_ta, band_cc, band_lr, band_gra, created_at"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("reading_attempts")
        .select("created_at, estimated_band")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("listening_attempts")
        .select("section, accuracy, band, completed_at")
        .eq("student_id", studentId)
        .order("completed_at", { ascending: false })
        .limit(100),
      supabase
        .from("student_vocab_progress")
        .select("word_id, last_studied_at, cefr_level")
        .eq("student_id", studentId),
      supabase
        .from("vocabulary_words")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("teacher_notes")
        .select("note, notes, updated_at")
        .eq("student_id", studentId)
        .eq("teacher_id", teacherId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const readingRows = readingTracker.data ?? [];
    const listeningRows = listeningTracker.data ?? [];
    const speakingRows = speakingTracker.data ?? [];

    const readingBand = average(
      readingRows.map((r) => Number(r.estimated_band)).filter(Number.isFinite)
    );
    const listeningBand = average(
      listeningRows.map((r) => Number(r.estimated_band)).filter(Number.isFinite)
    );
    const speakingBand = average(
      speakingRows.map((r) => Number(r.band_overall)).filter(Number.isFinite)
    );

    const writingList = writingAttempts.error ? [] : writingAttempts.data ?? [];
    const writingBand = average(
      writingList.map((w) => Number(w.band_overall)).filter(Number.isFinite)
    );

    const readingHistoryBands = (readingAttempts.data ?? [])
      .map((r) => Number(r.estimated_band))
      .filter(Number.isFinite);
    const listeningHistoryBands = (listeningAttempts.data ?? [])
      .map((r) => Number(r.band))
      .filter(Number.isFinite);
    const speakingHistoryBands = (speakingAttempts.data ?? [])
      .map((r) => Number(r.band_overall))
      .filter(Number.isFinite);
    const writingHistoryBands = writingList
      .map((w) => Number(w.band_overall))
      .filter(Number.isFinite);

    const lastActiveAt = maxIso(
      ...readingRows.map((r) => r.updated_at),
      ...listeningRows.map((r) => r.updated_at),
      ...speakingRows.map((r) => r.updated_at),
      ...(speakingAttempts.data ?? []).map((r) => r.created_at),
      ...(writingList ?? []).map((r) => r.created_at),
      ...(readingAttempts.data ?? []).map((r) => r.created_at),
      ...(listeningAttempts.data ?? []).map((r) => r.completed_at),
      ...(vocabProgress.data ?? []).map((r) => r.last_studied_at)
    );

    const readingProgress = readingRows
      .filter((r) => (r.attempts ?? 0) > 0 || r.accuracy != null)
      .map((r) => {
        let acc = Number(r.accuracy);
        if (Number.isFinite(acc) && acc <= 1) acc *= 100;
        return {
          questionType: r.question_type,
          accuracy: Number.isFinite(acc) ? Math.round(acc * 10) / 10 : 0,
          band: roundBand(Number(r.estimated_band)),
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy);

    const sectionMap = new Map();
    for (const row of listeningAttempts.data ?? []) {
      const sec = Number(row.section) || 0;
      if (sec < 1 || sec > 4) continue;
      if (!sectionMap.has(sec)) {
        sectionMap.set(sec, { total: 0, sum: 0, count: 0 });
      }
      const bucket = sectionMap.get(sec);
      let acc = Number(row.accuracy);
      if (!Number.isFinite(acc) && Number.isFinite(Number(row.band))) {
        acc = (Number(row.band) / 9) * 100;
      }
      if (Number.isFinite(acc)) {
        if (acc <= 1) acc *= 100;
        bucket.sum += acc;
        bucket.count += 1;
      }
      bucket.total += 1;
    }

    const listeningProgress = [1, 2, 3, 4].map((section) => {
      const bucket = sectionMap.get(section);
      const accuracy =
        bucket && bucket.count > 0
          ? Math.round((bucket.sum / bucket.count) * 10) / 10
          : null;
      return {
        section,
        label: `Section ${section}`,
        accuracy,
        attempts: bucket?.total ?? 0,
      };
    });

    const wordsMastered = new Set(
      (vocabProgress.data ?? []).map((r) => r.word_id).filter(Boolean)
    ).size;
    const totalWords = vocabTotal.count ?? 0;
    const vocabStreak = await computeVocabStreak(supabase, studentId).catch(
      () => 0
    );

    const cefrLevel =
      user.cefr_level ??
      (vocabProgress.data?.[0]?.cefr_level || DEFAULT_CEFR);

    const phone = user.phone ? String(user.phone).replace(/\D/g, "") : "";

    return NextResponse.json({
      student: {
        id: user.id,
        name: user.name ?? "Student",
        email: user.email ?? "",
        phone,
        cefrLevel,
        joinDate: user.created_at ?? null,
        joinDateLabel: formatDate(user.created_at),
        lastActiveAt,
        lastActiveLabel: formatDate(lastActiveAt),
      },
      bands: {
        writing: {
          current: writingBand,
          trend: computeTrend(writingHistoryBands),
        },
        speaking: {
          current: speakingBand,
          trend: computeTrend(speakingHistoryBands),
        },
        reading: {
          current: readingBand,
          trend: computeTrend(readingHistoryBands),
        },
        listening: {
          current: listeningBand,
          trend: computeTrend(listeningHistoryBands),
        },
      },
      writingHistory: writingList.map((w) => ({
        id: w.id,
        taskType: w.task_type === "task2" ? "Writing Task 2" : "Writing Task 1",
        bandOverall: roundBand(Number(w.band_overall)),
        date: w.created_at,
        dateLabel: formatDate(w.created_at),
        bandTa: roundBand(Number(w.band_ta)),
        bandCc: roundBand(Number(w.band_cc)),
        bandLr: roundBand(Number(w.band_lr)),
        bandGra: roundBand(Number(w.band_gra)),
        essayText: w.essay_text ?? "",
        evaluationText: w.evaluation_text ?? "",
      })),
      speakingHistory: (speakingAttempts.data ?? []).map((s) => ({
        id: s.id,
        part: `Part ${s.part}`,
        taskType: s.task_type,
        bandOverall: roundBand(Number(s.band_overall)),
        bandFc: roundBand(Number(s.band_fc)),
        bandLr: roundBand(Number(s.band_lr)),
        bandGra: roundBand(Number(s.band_gra)),
        bandP: roundBand(Number(s.band_p)),
        date: s.created_at,
        dateLabel: formatDate(s.created_at),
      })),
      readingProgress,
      listeningProgress,
      vocabulary: {
        cefrLevel,
        wordsMastered,
        totalWords,
        percent:
          totalWords > 0
            ? Math.min(100, Math.round((wordsMastered / totalWords) * 100))
            : 0,
        streak: vocabStreak,
      },
      teacherNotes: teacherNotes.error
        ? ""
        : noteFromRow(teacherNotes.data),
      teacherNotesUpdatedAt: teacherNotes.data?.updated_at ?? null,
      bookingUrl:
        process.env.NEXT_PUBLIC_BOOKING_URL ||
        `/dashboard/teacher/book-consultation?studentId=${studentId}`,
    });
  } catch (err) {
    console.error("[teacher/student/[id]] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load student" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    const studentId = String(params?.id ?? "").trim();
    if (!studentId) {
      return NextResponse.json({ error: "Student id required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const notes = body?.notes !== undefined ? String(body.notes) : undefined;
    const cefrLevel =
      body?.cefrLevel !== undefined ? String(body.cefrLevel).trim() : undefined;

    if (notes === undefined && cefrLevel === undefined) {
      return NextResponse.json(
        { error: "Provide notes and/or cefrLevel to update" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { teacherId } = auth;

    const { data: studentRow } = await supabase
      .from("users")
      .select("id")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle();

    if (!studentRow) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    let updatedCefrLevel = null;

    if (cefrLevel !== undefined) {
      if (!VALID_CEFR_CODES.has(cefrLevel)) {
        return NextResponse.json(
          { error: `Invalid CEFR level. Use one of: ${[...VALID_CEFR_CODES].join(", ")}` },
          { status: 400 }
        );
      }

      const { error: levelError } = await supabase
        .from("users")
        .update({ cefr_level: cefrLevel })
        .eq("id", studentId)
        .eq("role", "student");

      if (levelError) throw levelError;
      updatedCefrLevel = cefrLevel;
    }

    let notePayload = null;
    if (notes !== undefined) {
      try {
        notePayload = await saveTeacherNote(supabase, teacherId, studentId, notes);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("teacher_notes")) {
          return NextResponse.json(
            {
              error:
                "teacher_notes table missing. Run supabase/teacher_homework_tables.sql.",
            },
            { status: 503 }
          );
        }
        throw error;
      }
    }

    return NextResponse.json({
      ok: true,
      cefrLevel: updatedCefrLevel,
      notes:
        notePayload != null
          ? noteFromRow(notePayload) || notes
          : undefined,
      updatedAt: notePayload?.updated_at ?? null,
    });
  } catch (err) {
    console.error("[teacher/student/[id]] PUT", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save student profile" },
      { status: 500 }
    );
  }
}
