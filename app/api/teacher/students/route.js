import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeProgramType } from "@/lib/programType";

export const runtime = "nodejs";

const DEFAULT_CEFR = "B1.1";
const INACTIVE_DAYS = 3;

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

function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayBounds() {
  const today = getTodayDateKey();
  return {
    today,
    start: `${today}T00:00:00.000Z`,
    end: `${today}T23:59:59.999Z`,
  };
}

function getWeekStartIso() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

function roundBand(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function averageBand(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  return roundBand(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function maxTimestamp(map, studentId, iso) {
  if (!studentId || !iso) return;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return;
  const prev = map.get(studentId);
  if (prev === undefined || t > prev) map.set(studentId, t);
}

function daysSince(ms) {
  if (!Number.isFinite(ms)) return null;
  const diff = Date.now() - ms;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDate(isoMs) {
  if (!Number.isFinite(isoMs)) return "Never";
  return new Date(isoMs).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function studentReadingBand(rows) {
  const bands = rows
    .map((r) => Number(r.estimated_band))
    .filter((v) => Number.isFinite(v));
  return averageBand(bands);
}

function studentListeningBand(rows) {
  const bands = rows
    .map((r) => Number(r.estimated_band))
    .filter((v) => Number.isFinite(v));
  return averageBand(bands);
}

function studentSpeakingBand(rows) {
  const bands = rows
    .map((r) => Number(r.band_overall))
    .filter((v) => Number.isFinite(v));
  return averageBand(bands);
}

function compositeBand(reading, listening, speaking, writing) {
  return averageBand(
    [reading, listening, speaking, writing].filter((v) => v !== null)
  );
}

function emptyPayload() {
  return {
    summary: {
      totalActiveStudents: 0,
      testsCompletedToday: 0,
      averageBandScore: null,
      needsAttentionCount: 0,
    },
    students: [],
  };
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const programFilter = normalizeProgramType(
      new URL(request.url).searchParams.get("program")
    );
    const filterByProgram = new URL(request.url).searchParams.has("program");

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      console.warn("[teacher/students] Supabase not configured");
      return NextResponse.json(emptyPayload());
    }

    const supabase = getSupabase();
    const { start, end, today } = getTodayBounds();

    let students = [];
    const usersResult = await supabase
      .from("users")
      .select("id, name, email, role, cefr_level, program_type")
      .eq("role", "student")
      .order("name", { ascending: true });

    if (usersResult.error) {
      const fallback = await supabase
        .from("users")
        .select("id, name, email, role, cefr_level")
        .eq("role", "student")
        .order("name", { ascending: true });
      if (fallback.error) throw fallback.error;
      students = fallback.data ?? [];
    } else {
      students = usersResult.data ?? [];
    }

    if (filterByProgram) {
      students = students.filter(
        (user) => normalizeProgramType(user.program_type) === programFilter
      );
    }
    const studentIds = students.map((s) => s.id).filter(Boolean);

    if (!studentIds.length) {
      return NextResponse.json(emptyPayload());
    }

    const [
      readingTrackers,
      listeningTrackers,
      speakingTrackers,
      vocabProgress,
      vocabTotal,
      readingToday,
      listeningToday,
      speakingToday,
      dailyLimitsToday,
      readingRecent,
      listeningRecent,
      speakingRecent,
      vocabRecent,
      dailyLimitsAll,
      lessonCompletionsWeek,
    ] = await Promise.all([
      supabase
        .from("reading_tracker")
        .select("student_id, estimated_band, updated_at")
        .in("student_id", studentIds),
      supabase
        .from("listening_tracker")
        .select("student_id, estimated_band, updated_at")
        .in("student_id", studentIds),
      supabase
        .from("speaking_tracker")
        .select("student_id, band_overall, updated_at")
        .in("student_id", studentIds),
      supabase
        .from("student_vocab_progress")
        .select("student_id, word_id, last_studied_at")
        .in("student_id", studentIds),
      supabase
        .from("vocabulary_words")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("reading_attempts")
        .select("student_id")
        .in("student_id", studentIds)
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("listening_attempts")
        .select("student_id")
        .in("student_id", studentIds)
        .gte("completed_at", start)
        .lte("completed_at", end),
      supabase
        .from("speaking_attempts")
        .select("student_id")
        .in("student_id", studentIds)
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("daily_test_limits")
        .select(
          "student_id, tests_taken, mock_tests_taken, passage_tests_taken, practice_tests_taken, last_test_at"
        )
        .in("student_id", studentIds)
        .eq("test_date", today),
      supabase
        .from("reading_attempts")
        .select("student_id, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("listening_attempts")
        .select("student_id, completed_at")
        .in("student_id", studentIds)
        .order("completed_at", { ascending: false })
        .limit(500),
      supabase
        .from("speaking_attempts")
        .select("student_id, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("student_vocab_progress")
        .select("student_id, last_studied_at")
        .in("student_id", studentIds)
        .order("last_studied_at", { ascending: false })
        .limit(500),
      supabase
        .from("daily_test_limits")
        .select("student_id, last_test_at")
        .in("student_id", studentIds)
        .order("last_test_at", { ascending: false })
        .limit(500),
      supabase
        .from("lesson_completions")
        .select("student_id, completed_at")
        .in("student_id", studentIds)
        .gte("completed_at", getWeekStartIso()),
    ]);

    const totalVocabWords = vocabTotal.count ?? 0;

    const readingByStudent = new Map();
    for (const row of readingTrackers.data ?? []) {
      const id = row.student_id;
      if (!readingByStudent.has(id)) readingByStudent.set(id, []);
      readingByStudent.get(id).push(row);
    }

    const listeningByStudent = new Map();
    for (const row of listeningTrackers.data ?? []) {
      const id = row.student_id;
      if (!listeningByStudent.has(id)) listeningByStudent.set(id, []);
      listeningByStudent.get(id).push(row);
    }

    const speakingByStudent = new Map();
    for (const row of speakingTrackers.data ?? []) {
      const id = row.student_id;
      if (!speakingByStudent.has(id)) speakingByStudent.set(id, []);
      speakingByStudent.get(id).push(row);
    }

    const vocabCountByStudent = new Map();
    for (const row of vocabProgress.data ?? []) {
      const id = row.student_id;
      vocabCountByStudent.set(id, (vocabCountByStudent.get(id) ?? 0) + 1);
    }

    const testsTodayByStudent = new Map();
    const bumpTests = (rows) => {
      for (const row of rows ?? []) {
        const id = row.student_id;
        testsTodayByStudent.set(id, (testsTodayByStudent.get(id) ?? 0) + 1);
      }
    };
    bumpTests(readingToday.data);
    bumpTests(listeningToday.data);
    bumpTests(speakingToday.data);

    for (const row of dailyLimitsToday.data ?? []) {
      const id = row.student_id;
      const n =
        (Number(row.tests_taken) || 0) +
        (Number(row.mock_tests_taken) || 0) +
        (Number(row.passage_tests_taken) || 0) +
        (Number(row.practice_tests_taken) || 0);
      if (n > 0) {
        testsTodayByStudent.set(id, (testsTodayByStudent.get(id) ?? 0) + n);
      }
    }

    const lastActiveMs = new Map();
    const touch = (id, iso) => maxTimestamp(lastActiveMs, id, iso);

    for (const [id, rows] of readingByStudent) {
      for (const r of rows) touch(id, r.updated_at);
    }
    for (const [id, rows] of listeningByStudent) {
      for (const r of rows) touch(id, r.updated_at);
    }
    for (const [id, rows] of speakingByStudent) {
      for (const r of rows) touch(id, r.updated_at);
    }
    for (const row of readingRecent.data ?? []) touch(row.student_id, row.created_at);
    for (const row of listeningRecent.data ?? []) {
      touch(row.student_id, row.completed_at);
    }
    for (const row of speakingRecent.data ?? []) touch(row.student_id, row.created_at);
    for (const row of vocabRecent.data ?? []) touch(row.student_id, row.last_studied_at);
    for (const row of dailyLimitsAll.data ?? []) touch(row.student_id, row.last_test_at);

    let testsCompletedToday = 0;
    for (const count of testsTodayByStudent.values()) {
      testsCompletedToday += count;
    }

    const lessonCompletionsByStudent = new Map();
    for (const row of lessonCompletionsWeek.data ?? []) {
      const id = row.student_id;
      lessonCompletionsByStudent.set(id, (lessonCompletionsByStudent.get(id) ?? 0) + 1);
    }

    const roster = students.map((user) => {
      const id = user.id;
      const readingBand = studentReadingBand(readingByStudent.get(id) ?? []);
      const listeningBand = studentListeningBand(listeningByStudent.get(id) ?? []);
      const speakingBand = studentSpeakingBand(speakingByStudent.get(id) ?? []);
      const writingBand = null;
      const lastMs = lastActiveMs.get(id);
      const inactiveDays = daysSince(lastMs);
      const needsAttention =
        lastMs === undefined || (inactiveDays !== null && inactiveDays >= INACTIVE_DAYS);
      const activeToday =
        lastMs !== undefined &&
        new Date(lastMs).toDateString() === new Date().toDateString();
      const learned = vocabCountByStudent.get(id) ?? 0;
      const vocabularyPercent =
        totalVocabWords > 0
          ? Math.min(100, Math.round((learned / totalVocabWords) * 100))
          : 0;

      const composite = compositeBand(
        readingBand,
        listeningBand,
        speakingBand,
        writingBand
      );

      return {
        id,
        name: user.name ?? "Student",
        email: user.email ?? "",
        programType: normalizeProgramType(user.program_type),
        cefrLevel: user.cefr_level ?? DEFAULT_CEFR,
        writingBand,
        speakingBand,
        readingBand,
        listeningBand,
        vocabularyPercent,
        lastActiveAt: lastMs ? new Date(lastMs).toISOString() : null,
        lastActiveLabel: formatDate(lastMs),
        needsAttention,
        activeToday,
        testsToday: testsTodayByStudent.get(id) ?? 0,
        lessonsCompletedThisWeek: lessonCompletionsByStudent.get(id) ?? 0,
        readinessPercent:
          composite != null
            ? Math.min(100, Math.round((composite / 9) * 100))
            : null,
        compositeBand: composite,
      };
    });

    const compositeBands = roster
      .map((s) => s.compositeBand)
      .filter((v) => v !== null);
    const needsAttentionCount = roster.filter((s) => s.needsAttention).length;

    return NextResponse.json({
      summary: {
        totalActiveStudents: roster.length,
        testsCompletedToday,
        averageBandScore: averageBand(compositeBands),
        needsAttentionCount,
      },
      students: roster,
    });
  } catch (err) {
    console.error("[teacher/students]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load students" },
      { status: 500 }
    );
  }
}
