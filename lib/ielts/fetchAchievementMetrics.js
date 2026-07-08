import { isMasteredRating } from "@/lib/vocabularyLevels";

async function safeCount(query) {
  try {
    const result = await query;
    if (result.error) {
      console.warn("[achievement-metrics]", result.error.message);
      return 0;
    }
    return result.count ?? 0;
  } catch {
    return 0;
  }
}

async function safeRows(query) {
  try {
    const result = await query;
    if (result.error) {
      console.warn("[achievement-metrics]", result.error.message);
      return [];
    }
    return result.data ?? [];
  } catch {
    return [];
  }
}

async function safeSingle(query) {
  try {
    const result = await query;
    if (result.error) {
      console.warn("[achievement-metrics]", result.error.message);
      return null;
    }
    return result.data ?? null;
  } catch {
    return null;
  }
}

function gtSkill(row) {
  return String(row?.skill ?? row?.task_type ?? "").toLowerCase();
}

/**
 * Pull achievement metrics from logged student activity (Academic + GT tables).
 */
export async function fetchAchievementMetrics(supabase, studentId, profile) {
  let tasksCompleted = 0;
  let mocksTaken = 0;
  let writingAttempts = 0;
  let wordsMastered = 0;
  let streak = profile.studyStreak ?? 0;
  let trackProgressPercent = profile.courseProgressPercent ?? 0;
  let skillsAttempted = 0;

  if (!supabase) {
    return {
      tasksCompleted,
      streak,
      mocksTaken,
      currentBand: profile.currentBand,
      writingAttempts,
      wordsMastered,
      skillsAttempted,
      trackProgressPercent,
    };
  }

  const [
    completionsCount,
    academicMocksCount,
    academicWritingCount,
    speakingCount,
    readingCount,
    listeningCount,
    vocabRows,
    streakRow,
    gtAttemptRows,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("daily_task_completions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
    ),
    safeCount(
      supabase
        .from("mock_test_attempts")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("status", "completed")
    ),
    safeCount(
      supabase
        .from("writing_attempts")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
    ),
    safeCount(
      supabase
        .from("speaking_attempts")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
    ),
    safeCount(
      supabase
        .from("reading_attempts")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
    ),
    safeCount(
      supabase
        .from("listening_attempts")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
    ),
    safeRows(
      supabase
        .from("student_vocab_progress")
        .select("last_rating")
        .eq("student_id", studentId)
    ),
    safeSingle(
      supabase
        .from("study_streaks")
        .select("current_streak, total_tasks_completed")
        .eq("student_id", studentId)
        .maybeSingle()
    ),
    safeRows(
      supabase
        .from("ielts_general_attempts")
        .select("skill, task_type, status")
        .eq("student_id", studentId)
        .eq("status", "completed")
    ),
  ]);

  const gtWriting = gtAttemptRows.filter((row) => gtSkill(row) === "writing").length;
  const gtMocks = gtAttemptRows.filter((row) => gtSkill(row) === "mock").length;
  const gtReading = gtAttemptRows.filter((row) => gtSkill(row) === "reading").length;
  const gtListening = gtAttemptRows.filter((row) => gtSkill(row) === "listening").length;
  const gtSpeaking = gtAttemptRows.filter((row) => gtSkill(row) === "speaking").length;

  tasksCompleted = streakRow?.total_tasks_completed ?? completionsCount;
  mocksTaken = academicMocksCount + gtMocks;
  writingAttempts = academicWritingCount + gtWriting;

  wordsMastered = (vocabRows ?? []).filter((row) =>
    isMasteredRating(row.last_rating)
  ).length;

  streak = streakRow?.current_streak ?? streak;

  const skillFlags = [
    writingAttempts > 0 || gtWriting > 0,
    speakingCount > 0 || gtSpeaking > 0,
    readingCount > 0 || gtReading > 0,
    listeningCount > 0 || gtListening > 0,
  ];
  skillsAttempted = skillFlags.filter(Boolean).length;

  return {
    tasksCompleted,
    streak,
    mocksTaken,
    currentBand: profile.currentBand,
    writingAttempts,
    wordsMastered,
    skillsAttempted,
    trackProgressPercent,
  };
}
