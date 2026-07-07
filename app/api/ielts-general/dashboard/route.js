import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeReadinessMeter } from "@/lib/course/readinessMeter";
import {
  ACCELERATOR_TRACKS,
  recommendTrack,
} from "@/lib/accelerator/tracks";
import {
  getGeneralMissionTasksForDay,
  getGeneralWeakestSkillActions,
  estimateGeneralBandImprovement,
} from "@/lib/ielts-general/missionTasks";
import { gtAttemptSkill } from "@/lib/ielts-general/attemptRows.js";
import {
  getStudyDay,
  getDaySubtitle,
  getGreeting,
  formatFullDate,
  formatShortDate,
  daysUntilExam,
  getStreakMotivation,
  buildStudyWeekCalendar,
  getTomorrowDay,
  getRecommendedMockDay,
  STUDY_DAY_FULL,
} from "@/lib/ielts/studyWeek";
import { missionTaskKey } from "@/lib/ielts/missionKeys";
import {
  buildBandTrendFromHistory,
  projectBandAtExamDate,
} from "@/lib/ielts/projectedExamBand";

export const runtime = "nodejs";

const BASE = "/dashboard/ielts-general/student";

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

function averageNumbers(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  return roundBand(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function parseTargetBand(value) {
  if (value == null) return null;
  const cleaned = String(value).replace("+", "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function safeQuery(promise) {
  try {
    const result = await promise;
    if (result.error && result.error.code !== "PGRST116") {
      console.warn("[ielts-general/dashboard]", result.error.message);
    }
    return result.data ?? null;
  } catch {
    return null;
  }
}

function buildSkillRows(bands, targetBand) {
  const skills = [
    {
      key: "writing",
      label: "Writing (Letter+Essay)",
      href: `${BASE}/writing`,
    },
    { key: "speaking", label: "Speaking", href: `${BASE}/speaking` },
    { key: "reading", label: "Reading", href: `${BASE}/reading` },
    { key: "listening", label: "Listening", href: `${BASE}/listening` },
  ];

  return skills.map(({ key, label, href }) => {
    const band = bands[key] ?? null;
    const gap =
      band != null && targetBand != null ? roundBand(targetBand - band) : null;
    const onTarget = gap != null && gap <= 0;
    const needsWork = gap != null && gap > 0;
    const percent = band != null ? Math.round((band / 9) * 100) : 0;
    return {
      key,
      label,
      href,
      band,
      target: targetBand,
      gap,
      onTarget,
      needsWork,
      percent,
      attempted: band != null,
    };
  });
}

function findWeakestSkill(skillRows) {
  const attempted = skillRows.filter((s) => s.attempted && s.gap != null && s.gap > 0);
  if (!attempted.length) {
    const unattempted = skillRows.find((s) => !s.attempted);
    if (unattempted) return { ...unattempted, gap: unattempted.target ?? 6.5 };
    return skillRows[0];
  }
  return [...attempted].sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))[0];
}

function normalizeLetterType(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (v === "formal") return "formal";
  if (v === "semi_formal" || v === "semiformal") return "semiFormal";
  if (v === "informal") return "informal";
  return null;
}

function buildLetterTypeAccuracy(attemptRows) {
  const buckets = {
    formal: [],
    semiFormal: [],
    informal: [],
  };

  for (const row of attemptRows ?? []) {
    const type = normalizeLetterType(row.letter_type ?? row.letterType);
    if (!type) continue;
    const score =
      row.accuracy != null
        ? Number(row.accuracy)
        : row.band_score != null
          ? (Number(row.band_score) / 9) * 100
          : null;
    if (Number.isFinite(score)) {
      buckets[type].push(score);
    }
  }

  return {
    formal: averageNumbers(buckets.formal),
    semiFormal: averageNumbers(buckets.semiFormal),
    informal: averageNumbers(buckets.informal),
  };
}

function buildRecommendationsList(weakestSkill, readiness, skillRows) {
  const weakestKey = weakestSkill?.key ?? "writing";
  const recs = readiness?.recommendations;

  const pool = [
    {
      title: "General Task 2 — Essay structure",
      minutes: 20,
      href: `${BASE}/writing`,
      skillKey: "writing",
      impact: 1.35,
    },
    {
      title: "Formal letter — tone & register",
      minutes: 15,
      href: `${BASE}/letter-practice`,
      skillKey: "writing",
      impact: 0.95,
    },
    {
      title: "Reading Section B — workplace texts",
      minutes: 15,
      href: `${BASE}/reading`,
      skillKey: "reading",
      impact: 1.0,
    },
    {
      title: "Speaking Part 2 — Cue card practice",
      minutes: 15,
      href: `${BASE}/speaking/part2`,
      skillKey: "speaking",
      impact: 1.15,
    },
    {
      title: "Listening Section 3 — everyday discussion",
      minutes: 15,
      href: `${BASE}/listening`,
      skillKey: "listening",
      impact: 1.05,
    },
  ];

  if (recs?.primary?.title) {
    pool[0] = {
      ...pool[0],
      title: recs.primary.title,
      minutes: recs.primary.estimatedMinutes ?? 20,
      href: recs.primary.href ?? pool[0].href,
    };
  }

  const scored = pool.map((item) => {
    const skill = skillRows.find((s) => s.key === item.skillKey);
    const gap = skill?.gap ?? 0;
    const isWeakest = item.skillKey === weakestKey;
    let estimatedBandGain = 0.1;
    if (isWeakest && gap >= 1) estimatedBandGain = 0.3;
    else if (isWeakest && gap >= 0.5) estimatedBandGain = 0.2;
    else if (isWeakest) estimatedBandGain = 0.15;
    else if (gap >= 0.5) estimatedBandGain = 0.15;

    if (item.skillKey === "writing" && isWeakest) {
      estimatedBandGain = Math.max(estimatedBandGain, 0.2);
    }

    return {
      title: item.title,
      minutes: item.minutes,
      href: item.href,
      estimatedBandGain,
      subtitle: isWeakest
        ? "Your weakest skill"
        : `${skill?.label ?? item.skillKey} practice`,
      sortScore: gap * item.impact + (isWeakest ? 0.75 : 0),
    };
  });

  return scored
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, 3)
    .map(({ sortScore, ...item }) => item);
}

function formatExamDateLabel(dateStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function mergeGeneralBandData(supabase, studentId, profileBands) {
  const bands = { ...profileBands };
  let historyRows = [];
  let letterAttempts = [];

  if (!supabase || !studentId) {
    return { bands, historyRows, letterAttempts };
  }

  const [historyRes, attemptsRes, letterRes] = await Promise.all([
    supabase
      .from("ielts_general_student_history")
      .select("skill, task_type, band_score, recorded_at, overall_band, completed_at")
      .eq("student_id", studentId)
      .in("skill", ["writing", "speaking", "reading", "listening", "overall"])
      .order("recorded_at", { ascending: true })
      .limit(50),
    supabase
      .from("ielts_general_attempts")
      .select("skill, task_type, band_score, completed_at, letter_type, accuracy")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: false })
      .limit(40),
    supabase
      .from("ielts_general_attempts")
      .select("letter_type, accuracy, band_score, completed_at")
      .eq("student_id", studentId)
      .not("letter_type", "is", null)
      .order("completed_at", { ascending: false })
      .limit(30),
  ]);

  if (historyRes.error && !historyRes.error.message?.includes("does not exist")) {
    console.warn("[ielts-general/dashboard]", historyRes.error.message);
  }
  if (attemptsRes.error && !attemptsRes.error.message?.includes("does not exist")) {
    console.warn("[ielts-general/dashboard]", attemptsRes.error.message);
  }

  historyRows = historyRes.data ?? [];

  if (historyRows.length) {
    const latest = new Map();
    for (const row of historyRows) {
      const skill = gtAttemptSkill(row);
      const band = row.band_score ?? row.overall_band;
      if (skill && Number.isFinite(Number(band))) {
        latest.set(skill, Number(band));
      }
    }
    for (const skill of ["writing", "speaking", "reading", "listening"]) {
      if (latest.has(skill) && Number.isFinite(latest.get(skill))) {
        bands[skill] = latest.get(skill);
      }
    }
  }

  const attempts = attemptsRes.data ?? [];
  if (attempts.length) {
    const latestBySkill = new Map();
    for (const row of attempts) {
      const skill = gtAttemptSkill(row);
      if (!skill) continue;
      if (!latestBySkill.has(skill) && Number.isFinite(Number(row.band_score))) {
        latestBySkill.set(skill, Number(row.band_score));
      }
    }
    for (const skill of ["writing", "speaking", "reading", "listening"]) {
      if (bands[skill] == null && latestBySkill.has(skill)) {
        bands[skill] = latestBySkill.get(skill);
      }
    }
  }

  letterAttempts = letterRes.data ?? attempts.filter((r) => r.letter_type);

  return { bands, historyRows, letterAttempts };
}

function computeTrackProgress(completionsCount, weekCount) {
  const totalDays = weekCount * 7;
  const completed = Math.min(completionsCount, totalDays);
  const currentWeek = Math.min(weekCount, Math.max(1, Math.ceil(completed / 7) || 1));
  const progressPercent = Math.min(100, Math.round((completed / totalDays) * 100));
  return { currentWeek, progressPercent, completedDays: completed };
}

function buildTrackWeeks(weekCount, currentWeek) {
  return Array.from({ length: weekCount }, (_, i) => {
    const week = i + 1;
    let status = "locked";
    if (week < currentWeek) status = "completed";
    else if (week === currentWeek) status = "current";
    return { week, status };
  });
}

function buildCurrentWeekDays(studiedDates, todayKey) {
  const today = new Date(`${todayKey}T12:00:00`);
  const dayIndex = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayIndex);

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return days.map((day, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    let status = "upcoming";
    if (dateKey === todayKey) status = "today";
    else if (d < today && studiedDates.has(dateKey)) status = "completed";
    else if (d < today) status = "missed";
    return { day, label: labels[i], status };
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchStudentProfile(studentId);
    const recommendations = buildRecommendations(profile);
    const readiness = computeReadinessMeter(profile, recommendations);

    const placementBand =
      profile.placementBand ?? profile.currentBand ?? profile.skillBands?.reading ?? null;
    const recommendedTrack = recommendTrack(placementBand);
    const trackMeta = ACCELERATOR_TRACKS[recommendedTrack];

    const todayKey = todayDateKey();
    const studyDay = getStudyDay();
    const missionTasks = getGeneralMissionTasksForDay(studyDay);

    const bands = {
      writing: profile.skillBands.writing,
      speaking: profile.skillBands.speaking,
      reading: profile.skillBands.reading,
      listening: profile.skillBands.listening,
    };

    let supabase = null;
    let bandHistoryRows = [];
    let letterAttempts = [];

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      supabase = getSupabase();
      const merged = await mergeGeneralBandData(supabase, studentId, bands);
      bands.writing = merged.bands.writing;
      bands.speaking = merged.bands.speaking;
      bands.reading = merged.bands.reading;
      bands.listening = merged.bands.listening;
      bandHistoryRows = merged.historyRows;
      letterAttempts = merged.letterAttempts;
    }

    const targetBand = profile.targetBand ?? parseTargetBand(readiness.targetBand) ?? 6.5;
    const mergedSkillBands = [bands.writing, bands.speaking, bands.reading, bands.listening];
    const currentBand =
      averageBand(mergedSkillBands) ??
      profile.currentBand ??
      readiness.currentBand;
    const gap = roundBand(Math.max(0, (targetBand ?? 0) - (currentBand ?? 0)));

    const skillRows = buildSkillRows(bands, targetBand);
    const weakestSkill = findWeakestSkill(skillRows);
    const weakestActions = getGeneralWeakestSkillActions(
      weakestSkill?.key ?? "writing",
      weakestSkill?.gap ?? 0.5
    );
    const letterTypeAccuracy = buildLetterTypeAccuracy(letterAttempts);

    let userRow = null;
    let streakRow = null;
    let completionsToday = [];
    let allCompletions = [];
    let achievements = [];
    let mockAttempts = [];
    let lastMock = null;

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      if (!supabase) supabase = getSupabase();
      const [
        userRes,
        streakRes,
        completionsTodayRes,
        allCompletionsRes,
        achievementsRes,
        mockRes,
      ] = await Promise.all([
        supabase
          .from("users")
          .select(
            "name, ielts_exam_date, study_days_per_week, preferred_study_time, target_band, onboarding_completed"
          )
          .eq("id", studentId)
          .maybeSingle(),
        safeQuery(
          supabase
            .from("study_streaks")
            .select("*")
            .eq("student_id", studentId)
            .maybeSingle()
        ),
        safeQuery(
          supabase
            .from("daily_task_completions")
            .select("task_id")
            .eq("student_id", studentId)
            .gte("completed_at", `${todayKey}T00:00:00`)
        ),
        safeQuery(
          supabase
            .from("daily_task_completions")
            .select("completed_at")
            .eq("student_id", studentId)
        ),
        safeQuery(
          supabase
            .from("student_achievements")
            .select("achievement_id, earned_at")
            .eq("student_id", studentId)
            .order("earned_at", { ascending: false })
        ),
        safeQuery(
          supabase
            .from("ielts_general_attempts")
            .select("id, band_score, completed_at, mock_number, skill, task_type, status")
            .eq("student_id", studentId)
            .order("completed_at", { ascending: false })
            .limit(30)
        ),
      ]);

      userRow = userRes.data;
      streakRow = streakRes;
      completionsToday = completionsTodayRes ?? [];
      allCompletions = allCompletionsRes ?? [];
      achievements = achievementsRes ?? [];
      mockAttempts = (mockRes ?? []).filter(
        (row) => gtAttemptSkill(row) === "mock"
      );
      lastMock = mockAttempts[0] ?? null;
    }

    const completedTaskIds = new Set(
      (completionsToday ?? []).map((r) => r.task_id)
    );

    const tasksWithStatus = missionTasks.map((task) => ({
      ...task,
      completed:
        completedTaskIds.has(missionTaskKey(todayKey, task.id)) ||
        completedTaskIds.has(task.id),
    }));

    const completedCount = tasksWithStatus.filter((t) => t.completed).length;
    const totalCount = tasksWithStatus.length;
    const remainingMinutes = tasksWithStatus
      .filter((t) => !t.completed)
      .reduce((sum, t) => sum + t.minutes, 0);

    const studyStreak =
      streakRow?.current_streak ?? profile.studyStreak ?? readiness.studyStreak ?? 0;
    const longestStreak = streakRow?.longest_streak ?? studyStreak;
    const studyDaysPerWeek =
      userRow?.study_days_per_week ?? profile.weeklyStudyDays ?? readiness.weeklyStudyDays ?? 3;
    const examDate = userRow?.ielts_exam_date ?? null;
    const daysToExam = daysUntilExam(examDate);

    const studiedDates = new Set(
      (allCompletions ?? []).map((r) => String(r.completed_at).slice(0, 10))
    );
    for (const row of profile.recentActivity ?? []) {
      if (row?.date) studiedDates.add(String(row.date).slice(0, 10));
    }

    const weekCalendar = buildStudyWeekCalendar(studiedDates);
    const trackProgress = computeTrackProgress(
      allCompletions?.length ?? Math.max(studyStreak, 1) * 3,
      trackMeta.weekCount
    );

    const completedMocks = mockAttempts?.length ?? 0;
    const nextMockNumber = completedMocks + 1;

    const achievable =
      daysToExam != null && gap != null
        ? daysToExam >= gap * 14
        : studyDaysPerWeek >= 4;

    const aiRecommendations = buildRecommendationsList(weakestSkill, readiness, skillRows);
    const totalRecMinutes = aiRecommendations.reduce((s, r) => s + r.minutes, 0);

    const tasksDone =
      streakRow?.total_tasks_completed ??
      streakRow?.total_study_days ??
      allCompletions?.length ??
      profile.recentActivityCount ??
      0;
    const totalHours = roundBand(Number(streakRow?.total_hours ?? readiness.hoursStudied ?? 0));

    const weeksRemaining = Math.max(0, trackMeta.weekCount - trackProgress.currentWeek + 1);

    const recentTasks = (allCompletions ?? []).filter((r) => {
      const d = String(r.completed_at).slice(0, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      return d >= cutoff.toISOString().slice(0, 10);
    }).length;

    const bandTrend = buildBandTrendFromHistory(bandHistoryRows, currentBand);
    const projection = projectBandAtExamDate(
      currentBand,
      targetBand,
      daysToExam,
      studyDaysPerWeek,
      studyStreak,
      recentTasks
    );

    return NextResponse.json({
      programLabel: "IELTS General Training",
      onboardingCompleted: Boolean(userRow?.onboarding_completed),
      user: {
        name: userRow?.name ?? session.user?.name ?? "Student",
        examDate,
        studyDaysPerWeek,
        preferredStudyTime: userRow?.preferred_study_time ?? "evening",
      },
      greeting: getGreeting(),
      todayDate: formatFullDate(),
      todayShortDate: formatShortDate(),
      today: {
        day: studyDay,
        dayName: STUDY_DAY_FULL[studyDay],
        subtitle: getDaySubtitle(studyDay),
        tasks: tasksWithStatus,
        completedCount,
        totalCount,
        remainingMinutes,
        allComplete: completedCount === totalCount && totalCount > 0,
        tomorrowDay: STUDY_DAY_FULL[getTomorrowDay(studyDay)],
      },
      streak: {
        current: studyStreak,
        longest: longestStreak,
        motivation: getStreakMotivation(studyStreak),
        calendar: weekCalendar,
        totalHours,
        tasksDone,
        mocksTaken: completedMocks,
      },
      bands: {
        current: currentBand,
        target: targetBand,
        gap,
        skills: skillRows,
      },
      letterTypeAccuracy,
      bandTrend,
      projection,
      weakestSkill: {
        key: weakestSkill?.key ?? "writing",
        label: weakestSkill?.label ?? "Writing (Letter+Essay)",
        band: weakestSkill?.band,
        target: targetBand,
        gap: weakestSkill?.gap ?? gap,
        showAlert: (weakestSkill?.gap ?? 0) > 0.5,
        actions: weakestActions,
        estimatedImprovement: estimateGeneralBandImprovement(weakestSkill?.gap ?? 0.5),
        href: weakestSkill?.href ?? `${BASE}/writing`,
      },
      recommendations: {
        items: aiRecommendations,
        totalMinutes: totalRecMinutes,
      },
      exam: {
        daysRemaining: daysToExam,
        examDateLabel: formatExamDateLabel(examDate),
        achievable,
        onTrackLabel: achievable
          ? `✓ On track for Band ${targetBand.toFixed(1)}`
          : `⚠ More study needed for Band ${targetBand.toFixed(1)}`,
        paceMessage: `You are studying ${studyDaysPerWeek} days/week. Target: 5 days/week`,
        needsMoreEffort: !achievable,
      },
      mock: {
        nextNumber: nextMockNumber,
        recommendedDay: getRecommendedMockDay(studyDay),
        duration: "2 hours 45 minutes",
        previous: lastMock
          ? {
              number: lastMock.mock_number ?? completedMocks,
              overallBand: lastMock.band_score,
              date: lastMock.completed_at,
              dateLabel: formatShortDate(new Date(lastMock.completed_at)),
            }
          : null,
      },
      track: {
        id: recommendedTrack,
        name: trackMeta.name,
        currentWeek: trackProgress.currentWeek,
        weekCount: trackMeta.weekCount,
        progressPercent: trackProgress.progressPercent,
        weeks: buildTrackWeeks(trackMeta.weekCount, trackProgress.currentWeek),
        currentWeekDays: buildCurrentWeekDays(studiedDates, todayKey),
        paceMessage: `At current pace — completing in ${weeksRemaining} weeks`,
        weekTitle: trackMeta.weekTitles[trackProgress.currentWeek - 1] ?? "",
      },
      readinessPercent: readiness.readinessPercent,
      achievementsCount: achievements?.length ?? 0,
      todayMissionIncomplete: completedCount < totalCount,
      sidebar: {
        trackBadge: `Week ${trackProgress.currentWeek}/${trackMeta.weekCount}`,
        skillBands: {
          writing: bands.writing,
          speaking: bands.speaking,
          reading: bands.reading,
          listening: bands.listening,
        },
        mockReady: `#${nextMockNumber} ready`,
        readinessPercent: readiness.readinessPercent,
        newAchievements: Math.min(achievements?.length ?? 0, 3),
      },
    });
  } catch (err) {
    console.error("[ielts-general/dashboard]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load dashboard" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const body = await request.json();
    const supabase = getSupabase();
    const updates = {};

    if (body.ielts_exam_date !== undefined) {
      updates.ielts_exam_date = body.ielts_exam_date || null;
    }
    if (body.study_days_per_week !== undefined) {
      updates.study_days_per_week = Number(body.study_days_per_week) || 5;
    }
    if (body.preferred_study_time !== undefined) {
      updates.preferred_study_time = body.preferred_study_time;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { error } = await supabase.from("users").update(updates).eq("id", studentId);

    if (error) {
      if (error.message?.includes("ielts_exam_date")) {
        return NextResponse.json(
          { error: "Run supabase/ielts_self_study_setup.sql first" },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true, ...updates });
  } catch (err) {
    console.error("[ielts-general/dashboard PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update" },
      { status: 500 }
    );
  }
}
