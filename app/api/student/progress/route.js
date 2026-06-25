import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { addDaysToDateKey, todayDateKey } from "@/lib/vocabulary";
import { computeStreak } from "@/lib/vocabularySupabase";

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

function roundBand(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function averageBand(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  return roundBand(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function formatDateLabel(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseTargetBand(value) {
  if (!value) return null;
  const cleaned = String(value).replace("+", "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function buildLast7Days(studyDates) {
  const today = todayDateKey();
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDaysToDateKey(today, -i);
    const d = new Date(`${date}T12:00:00.000Z`);
    days.push({
      date,
      dayLabel: d.toLocaleDateString("en-GB", { weekday: "short" }),
      studied: studyDates.has(date),
    });
  }
  return days;
}

function collectStudyDates(rows) {
  const dates = new Set();
  for (const iso of rows) {
    if (!iso) continue;
    const key = String(iso).slice(0, 10);
    if (key) dates.add(key);
  }
  return dates;
}

function pushActivity(list, item) {
  if (!item?.date) return;
  list.push(item);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        targetBand: null,
        overallBand: null,
        writing: null,
        speaking: null,
        reading: null,
        listening: null,
        vocabulary: null,
        recentActivity: [],
        studyStreak: 0,
        last7Days: buildLast7Days(new Set()),
      });
    }

    const supabase = getSupabase();

    const [
      userRes,
      writingRes,
      speakingAttemptsRes,
      speakingTrackerRes,
      readingTrackerRes,
      readingAttemptsRes,
      listeningTrackerRes,
      listeningAttemptsRes,
      vocabProgressRes,
      vocabWordsCountRes,
      vocabStreakRes,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("cefr_level, target_band, name")
        .eq("id", studentId)
        .maybeSingle(),
      supabase
        .from("writing_attempts")
        .select(
          "id, task_type, band_overall, band_ta, band_cc, band_lr, band_gra, created_at"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("speaking_attempts")
        .select(
          "id, part, task_type, band_overall, band_fc, band_lr, band_gra, band_p, created_at"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("speaking_tracker")
        .select("band_fc, band_lr, band_gra, band_p, band_overall, attempts")
        .eq("student_id", studentId),
      supabase
        .from("reading_tracker")
        .select("question_type, attempts, accuracy, estimated_band, updated_at")
        .eq("student_id", studentId)
        .gt("attempts", 0),
      supabase
        .from("reading_attempts")
        .select("id, total, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("listening_tracker")
        .select("question_type, accuracy, estimated_band, total_attempts, attempts")
        .eq("student_id", studentId),
      supabase
        .from("listening_attempts")
        .select("id, section, accuracy, band, completed_at")
        .eq("student_id", studentId)
        .order("completed_at", { ascending: false })
        .limit(30),
      supabase
        .from("student_vocab_progress")
        .select("last_studied_at")
        .eq("student_id", studentId),
      supabase
        .from("vocabulary_words")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("vocab_streaks")
        .select("current_streak, longest_streak, last_study_date")
        .eq("student_id", studentId)
        .maybeSingle(),
    ]);

    const targetBand = parseTargetBand(userRes.data?.target_band);
    const cefrLevel = userRes.data?.cefr_level ?? "B1.1";

    const writingRows = writingRes.data ?? [];
    const latestWriting = writingRows[0] ?? null;
    const writingBands = writingRows
      .map((r) => Number(r.band_overall))
      .filter(Number.isFinite);
    const writingBand = averageBand(writingBands);

    const writing = {
      band: writingBand,
      lastEssayDate: latestWriting?.created_at ?? null,
      lastEssayDateLabel: formatDateLabel(latestWriting?.created_at),
      breakdown: {
        ta: roundBand(Number(latestWriting?.band_ta)),
        cc: roundBand(Number(latestWriting?.band_cc)),
        lr: roundBand(Number(latestWriting?.band_lr)),
        gra: roundBand(Number(latestWriting?.band_gra)),
      },
      attemptCount: writingRows.length,
    };

    const speakingRows = speakingAttemptsRes.data ?? [];
    const latestSpeaking = speakingRows[0] ?? null;
    const speakingTracker = (speakingTrackerRes.data ?? []).filter(
      (r) => (r.attempts ?? 0) > 0
    );
    const speakingBand =
      averageBand(speakingRows.map((r) => Number(r.band_overall))) ??
      averageBand(speakingTracker.map((r) => Number(r.band_overall)));

    const speaking = {
      band: speakingBand,
      lastAttemptDate: latestSpeaking?.created_at ?? null,
      lastAttemptDateLabel: formatDateLabel(latestSpeaking?.created_at),
      breakdown: {
        fc: roundBand(
          Number(latestSpeaking?.band_fc) ||
            averageBand(speakingTracker.map((r) => Number(r.band_fc)))
        ),
        lr: roundBand(
          Number(latestSpeaking?.band_lr) ||
            averageBand(speakingTracker.map((r) => Number(r.band_lr)))
        ),
        gra: roundBand(
          Number(latestSpeaking?.band_gra) ||
            averageBand(speakingTracker.map((r) => Number(r.band_gra)))
        ),
        p: roundBand(
          Number(latestSpeaking?.band_p) ||
            averageBand(speakingTracker.map((r) => Number(r.band_p)))
        ),
      },
      attemptCount: speakingRows.length,
    };

    const readingTrackerRows = readingTrackerRes.data ?? [];
    const readingBands = readingTrackerRows
      .map((r) => Number(r.estimated_band))
      .filter(Number.isFinite);
    const accuracies = readingTrackerRows
      .map((r) => {
        const acc = Number(r.accuracy);
        if (!Number.isFinite(acc)) return null;
        return acc <= 1 ? acc * 100 : acc;
      })
      .filter((v) => v !== null);

    const reading = {
      band: averageBand(readingBands),
      accuracyPercent:
        accuracies.length > 0
          ? Math.round(
              (accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 10
            ) / 10
          : null,
      typesMastered: readingTrackerRows.length,
      typesTotal: 12,
    };

    const listeningTrackerRows = (listeningTrackerRes.data ?? []).filter(
      (r) => (Number(r.total_attempts) || Number(r.attempts) || 0) > 0
    );
    const listeningAttemptRows = listeningAttemptsRes.data ?? [];
    const listeningBands = [
      ...listeningTrackerRows
        .map((r) => Number(r.estimated_band))
        .filter(Number.isFinite),
      ...listeningAttemptRows.map((r) => Number(r.band)).filter(Number.isFinite),
    ];
    const listeningAccuracies = [
      ...listeningTrackerRows
        .map((r) => Number(r.accuracy))
        .filter(Number.isFinite),
      ...listeningAttemptRows
        .map((r) => Number(r.accuracy))
        .filter(Number.isFinite),
    ];
    const sectionsCompleted = new Set(
      listeningAttemptRows.map((r) => r.section).filter((s) => s != null)
    ).size;

    const listening = {
      band: averageBand(listeningBands),
      sectionsCompleted,
      sectionsTotal: 4,
      accuracyPercent:
        listeningAccuracies.length > 0
          ? Math.round(
              (listeningAccuracies.reduce((a, b) => a + b, 0) /
                listeningAccuracies.length) *
                10
            ) / 10
          : null,
    };

    const wordsMastered = vocabProgressRes.data?.length ?? 0;
    const totalWords = vocabWordsCountRes.count ?? 0;
    const vocabPercent =
      totalWords > 0
        ? Math.min(100, Math.round((wordsMastered / totalWords) * 100))
        : 0;

    let studyStreak = vocabStreakRes.data?.current_streak ?? 0;
    if (!studyStreak) {
      studyStreak = await computeStreak(supabase, studentId).catch(() => 0);
    }

    const vocabulary = {
      cefrLevel,
      wordsMastered,
      totalWords,
      percentComplete: vocabPercent,
      streak: studyStreak,
    };

    const overallBand = averageBand(
      [writing.band, speaking.band, reading.band, listening.band].filter(
        (b) => b !== null
      )
    );

    const progressToTarget =
      overallBand !== null && targetBand !== null && targetBand > 0
        ? Math.min(100, Math.round((overallBand / targetBand) * 100))
        : null;

    const activityTimestamps = [];
    const recentActivity = [];

    for (const row of writingRows.slice(0, 5)) {
      activityTimestamps.push(row.created_at);
      pushActivity(recentActivity, {
        module: "Writing",
        label: row.task_type === "task2" ? "Writing Task 2" : "Writing Task 1",
        score: roundBand(Number(row.band_overall)),
        date: row.created_at,
        dateLabel: formatDateLabel(row.created_at),
      });
    }
    for (const row of speakingRows.slice(0, 5)) {
      activityTimestamps.push(row.created_at);
      pushActivity(recentActivity, {
        module: "Speaking",
        label: `Speaking Part ${row.part}`,
        score: roundBand(Number(row.band_overall)),
        date: row.created_at,
        dateLabel: formatDateLabel(row.created_at),
      });
    }
    for (const row of readingAttemptsRes.data ?? []) {
      activityTimestamps.push(row.created_at);
      pushActivity(recentActivity, {
        module: "Reading",
        label: "Reading practice",
        score: null,
        date: row.created_at,
        dateLabel: formatDateLabel(row.created_at),
      });
    }
    for (const row of listeningAttemptRows.slice(0, 5)) {
      activityTimestamps.push(row.completed_at);
      pushActivity(recentActivity, {
        module: "Listening",
        label: row.section
          ? `Listening Section ${row.section}`
          : "Listening practice",
        score: roundBand(Number(row.band)),
        date: row.completed_at,
        dateLabel: formatDateLabel(row.completed_at),
      });
    }
    for (const row of vocabProgressRes.data ?? []) {
      activityTimestamps.push(row.last_studied_at);
      pushActivity(recentActivity, {
        module: "Vocabulary",
        label: "Vocabulary study",
        score: null,
        date: row.last_studied_at,
        dateLabel: formatDateLabel(row.last_studied_at),
      });
    }

    recentActivity.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const studyDates = collectStudyDates(activityTimestamps);
    const last7Days = buildLast7Days(studyDates);

    return NextResponse.json({
      targetBand,
      overallBand,
      progressToTarget,
      writing,
      speaking,
      reading,
      listening,
      vocabulary,
      recentActivity: recentActivity.slice(0, 5),
      studyStreak,
      last7Days,
    });
  } catch (err) {
    console.error("[student/progress]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load progress" },
      { status: 500 }
    );
  }
}
