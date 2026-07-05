import { createClient } from "@supabase/supabase-js";
import { buildStudentProfile } from "@/lib/course/studentProfile";
import { countCourseProgress } from "@/lib/course/enrollment";
import {
  resolveTargetBandForStudent,
} from "@/lib/accelerator/tracks";

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

function countWeeklyStudyDays(timestamps) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const days = new Set();
  for (const iso of timestamps) {
    if (!iso) continue;
    const t = new Date(iso).getTime();
    if (t >= cutoff) days.add(String(iso).slice(0, 10));
  }
  return days.size;
}

export async function fetchStudentProfile(studentId) {
  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
    return buildStudentProfile({
      studentId,
      skillBands: {
        writing: null,
        speaking: null,
        reading: null,
        listening: null,
        vocabulary: null,
        grammar: null,
      },
      targetBand: 7,
    });
  }

  const supabase = getSupabase();

  const [
    userRes,
    writingRes,
    speakingRes,
    readingTrackerRes,
    listeningTrackerRes,
    readingRes,
    listeningRes,
    vocabRes,
    grammarRes,
    streakRes,
    enrollmentRes,
    placementRes,
    courseProgressRes,
    pathwayProgressRes,
  ] = await Promise.all([
    supabase.from("users").select("target_band, cefr_level, accelerator_track").eq("id", studentId).maybeSingle(),
    supabase
      .from("writing_attempts")
      .select("overall_band, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("speaking_attempts")
      .select("overall_band, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("reading_tracker")
      .select("estimated_band, updated_at")
      .eq("student_id", studentId)
      .gt("attempts", 0),
    supabase
      .from("listening_tracker")
      .select("estimated_band, updated_at")
      .eq("student_id", studentId)
      .gt("attempts", 0),
    supabase
      .from("reading_attempts")
      .select("band_score, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("listening_attempts")
      .select("band_score, completed_at")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("student_vocab_progress")
      .select("mastery_score, last_studied_at")
      .eq("student_id", studentId)
      .limit(20),
    supabase
      .from("grammar_progress")
      .select("practice_score, updated_at")
      .eq("student_id", studentId),
    supabase
      .from("vocab_streaks")
      .select("current_streak")
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("course_enrollments")
      .select("level_id, target_band, levels(name, slug, track_type)")
      .eq("student_id", studentId)
      .eq("status", "active")
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("placement_attempts")
      .select("overall_band, target_band_score, skill_bands, completed_at")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("student_progress")
      .select("completed_at, updated_at")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20),
    supabase
      .from("student_level_progress")
      .select("weekly_scores")
      .eq("student_id", studentId),
  ]);

  const writing = averageBand((writingRes.data ?? []).map((r) => Number(r.overall_band)));
  const speaking = averageBand((speakingRes.data ?? []).map((r) => Number(r.overall_band)));

  const readingFromTracker = averageBand(
    (readingTrackerRes.data ?? []).map((r) => Number(r.estimated_band))
  );
  const readingFromAttempts = averageBand(
    (readingRes.data ?? []).map((r) => Number(r.band_score))
  );
  const reading = readingFromTracker ?? readingFromAttempts;

  const listeningFromTracker = averageBand(
    (listeningTrackerRes.data ?? []).map((r) => Number(r.estimated_band))
  );
  const listeningFromAttempts = averageBand(
    (listeningRes.data ?? []).map((r) => Number(r.band_score))
  );
  const listening = listeningFromTracker ?? listeningFromAttempts;

  const vocabScores = (vocabRes.data ?? [])
    .map((r) => Number(r.mastery_score))
    .filter(Number.isFinite);
  const vocabulary = vocabScores.length
    ? roundBand(4 + (vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length) * 0.05)
    : null;

  const grammarScores = (grammarRes.data ?? [])
    .map((r) => Number(r.practice_score))
    .filter(Number.isFinite);
  const grammar = grammarScores.length
    ? roundBand(4 + (grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length) * 0.05)
    : null;

  const placementBand = placementRes.data?.overall_band
    ? Number(placementRes.data.overall_band)
    : null;

  const storedTargetBand =
    Number(enrollmentRes.data?.target_band) ||
    Number(userRes.data?.target_band) ||
    Number(placementRes.data?.target_band_score) ||
    null;

  const acceleratorTrack = userRes.data?.accelerator_track ?? null;
  const enrolledTrackSlug = enrollmentRes.data?.levels?.slug ?? null;

  const { targetBand } = resolveTargetBandForStudent({
    acceleratorTrack,
    enrolledTrackSlug,
    placementBand,
    storedTargetBand: Number.isFinite(storedTargetBand) ? storedTargetBand : null,
  });

  let lessonsCompleted = 0;
  let totalLessons = 0;
  const enrolledLevel = enrollmentRes.data?.levels;

  if (enrollmentRes.data?.level_id) {
    const progress = await countCourseProgress(studentId, enrollmentRes.data.level_id);
    lessonsCompleted = progress.completed;
    totalLessons = progress.total;
  }

  for (const row of pathwayProgressRes.data ?? []) {
    const scores = row.weekly_scores ?? {};
    lessonsCompleted += Object.values(scores).filter(
      (s) => s && typeof s === "object" && s.completed
    ).length;
  }

  const activityTimestamps = [
    ...(writingRes.data ?? []).map((r) => r.created_at),
    ...(speakingRes.data ?? []).map((r) => r.created_at),
    ...(readingRes.data ?? []).map((r) => r.created_at),
    ...(listeningRes.data ?? []).map((r) => r.completed_at),
    ...(vocabRes.data ?? []).map((r) => r.last_studied_at),
    ...(grammarRes.data ?? []).map((r) => r.updated_at),
    ...(courseProgressRes.data ?? []).map((r) => r.completed_at ?? r.updated_at),
  ].filter(Boolean);

  const weeklyStudyDays = countWeeklyStudyDays(activityTimestamps);
  const lastActivityDate = activityTimestamps[0] ?? null;

  return buildStudentProfile({
    studentId,
    skillBands: { writing, speaking, reading, listening, vocabulary, grammar },
    targetBand,
    placementBand,
    acceleratorTrack,
    enrolledTrackSlug: enrolledLevel?.slug ?? null,
    enrolledTrackName: enrolledLevel?.name ?? null,
    lessonsCompleted,
    totalLessons,
    studyStreak: streakRes.data?.current_streak ?? 0,
    weeklyStudyDays,
    recentActivityCount: activityTimestamps.length,
    lastActivityDate,
  });
}
