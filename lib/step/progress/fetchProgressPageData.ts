import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStudyWeekCalendar } from "@/lib/ielts/studyWeek";
import { passThresholdForPhase } from "../exitTest/constants";
import {
  STEP_DEFAULT_TARGET,
  STEP_PHASES,
  getPhaseDefinition,
  type StepPhaseDefinition,
} from "../phases";
import { estimatedFromMiniRawTotal } from "../miniMock/grading";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

const SECTION_META = [
  {
    key: "reading",
    label: "Reading",
    icon: "📖",
    weight: "40%",
    max: 40,
    miniMax: 5,
    path: "/dashboard/step/student/reading",
  },
  {
    key: "structure",
    label: "Structure",
    icon: "✏️",
    weight: "30%",
    max: 30,
    miniMax: 5,
    path: "/dashboard/step/student/structure",
  },
  {
    key: "listening",
    label: "Listening",
    icon: "🎧",
    weight: "20%",
    max: 20,
    miniMax: 5,
    path: "/dashboard/step/student/listening",
  },
  {
    key: "compositional_analysis",
    label: "Compositional",
    icon: "📋",
    weight: "10%",
    max: 10,
    miniMax: 5,
    path: "/dashboard/step/student/compositional",
  },
] as const;

function performanceMeta(score: number) {
  if (score >= 80) {
    return { label: "🏆 Excellence — Top Performance", color: TEAL };
  }
  if (score >= 65) {
    return { label: "✅ Competitive — University Ready", color: GOLD };
  }
  if (score >= 50) {
    return { label: "📈 Developing — Good Progress", color: "#d97706" };
  }
  return { label: "📚 Foundation — Keep Studying", color: "#dc2626" };
}

function pctColor(pct: number) {
  if (pct >= 75) return "#059669";
  if (pct >= 60) return GOLD;
  return "#dc2626";
}

function totalBadgeColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 65) return GOLD;
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function formatDisplayDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function daysBetween(a: Date, b: Date) {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function fetchProgressPageData(
  supabase: SupabaseClient,
  studentId: string
) {
  const [
    enrollmentRes,
    sectionRes,
    mockRes,
    miniMockRes,
    phaseRes,
    exitRes,
    streakRes,
    historyRes,
  ] = await Promise.all([
    supabase.from("step_enrollments").select("*").eq("student_id", studentId).maybeSingle(),
    supabase
      .from("step_section_scores")
      .select("*")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("step_mock_results")
      .select("*")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: true }),
    supabase
      .from("step_mini_mock_results")
      .select("*")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: true }),
    supabase
      .from("step_phase_progress")
      .select("*")
      .eq("student_id", studentId)
      .order("phase", { ascending: true }),
    supabase
      .from("step_exit_tests")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false }),
    supabase.from("study_streaks").select("*").eq("student_id", studentId).maybeSingle(),
    supabase
      .from("step_progress_history")
      .select("*")
      .eq("student_id", studentId)
      .order("recorded_at", { ascending: true }),
  ]);

  const enrollment = enrollmentRes.data;
  const sectionRows = sectionRes.data ?? [];
  const mocks = mockRes.data ?? [];
  const miniMocks = miniMockRes.data ?? [];
  const phaseRows = phaseRes.data ?? [];
  const exitTests = exitRes.data ?? [];

  const estimated = enrollment?.estimated_score ?? 0;
  const diagnostic = enrollment?.diagnostic_score ?? null;
  const target = enrollment?.target_score ?? STEP_DEFAULT_TARGET;
  const displayEstimate = estimated > 0 ? estimated : null;
  const gap =
    displayEstimate != null ? Math.max(0, target - displayEstimate) : target;
  const targetReached = displayEstimate != null && displayEstimate >= target;

  const latestBySection: Record<string, number> = {};
  for (const row of sectionRows) {
    if (latestBySection[row.section] == null) {
      latestBySection[row.section] = row.estimated_score ?? 0;
    }
  }

  const bestMockBySection: Record<string, number> = {};
  for (const m of mocks) {
    const pairs: [string, number][] = [
      ["reading", m.reading_score ?? 0],
      ["structure", m.structure_score ?? 0],
      ["listening", m.listening_score ?? 0],
      ["compositional_analysis", m.compositional_score ?? 0],
    ];
    for (const [key, val] of pairs) {
      bestMockBySection[key] = Math.max(bestMockBySection[key] ?? 0, val);
    }
  }

  const sectionScores: Record<string, number> = {};
  for (const s of SECTION_META) {
    sectionScores[s.key] = latestBySection[s.key] ?? 0;
  }

  const sectionBreakdown = SECTION_META.map((s) => {
    const score = latestBySection[s.key] ?? 0;
    const hasData = score > 0 || bestMockBySection[s.key] > 0;
    const pct = hasData ? Math.round((score / s.max) * 100) : 0;
    return {
      ...s,
      score: hasData ? score : null,
      pct: hasData ? pct : null,
      color: hasData ? pctColor(pct) : "#94a3b8",
      bestScore: bestMockBySection[s.key] ?? null,
      hasData,
    };
  });

  const trendPoints = [
    ...mocks.map((m) => ({
      date: m.completed_at as string,
      score:
        m.total_score ??
        estimatedFromMiniRawTotal(0),
      type: "Full Mock" as const,
      scaled: m.total_score ?? 0,
    })),
    ...miniMocks.map((m) => ({
      date: m.completed_at as string,
      score:
        m.estimated_step_score ??
        estimatedFromMiniRawTotal(m.total_score ?? 0),
      type: "Mini Mock" as const,
      scaled:
        m.estimated_step_score ?? estimatedFromMiniRawTotal(m.total_score ?? 0),
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const mockHistory = mocks.map((m, i) => {
    const prev = i > 0 ? mocks[i - 1] : null;
    const total = m.total_score ?? 0;
    const improvement = prev == null ? null : total - (prev.total_score ?? 0);
    const phaseDef = getPhaseDefinition(m.phase ?? 1);
    return {
      mockNumber: m.mock_number,
      mockLabel: `#${String(m.mock_number).padStart(2, "0")}`,
      date: m.completed_at,
      dateFormatted: formatDisplayDate(m.completed_at),
      reading: m.reading_score,
      structure: m.structure_score,
      listening: m.listening_score,
      compositional: m.compositional_score,
      total,
      totalColor: totalBadgeColor(total),
      phase: m.phase,
      phaseLabel: `Phase ${m.phase} — ${phaseDef?.title ?? "Foundation"}`,
      improvement,
      improvementLabel:
        improvement == null
          ? "First mock"
          : improvement >= 0
            ? `+${improvement} ↑`
            : `${improvement} ↓`,
    };
  });

  const miniMockHistory = miniMocks.map((m, i) => {
    const prev = i > 0 ? miniMocks[i - 1] : null;
    const total = m.total_score ?? 0;
    const improvement = prev == null ? null : total - (prev.total_score ?? 0);
    return {
      mockNumber: m.mock_number,
      mockLabel: `#${String(m.mock_number).padStart(2, "0")}`,
      date: m.completed_at,
      dateFormatted: formatDisplayDate(m.completed_at),
      reading: m.reading_score,
      structure: m.structure_score,
      listening: m.listening_score,
      compositional: m.compositional_score,
      total,
      totalColor: totalBadgeColor(
        m.estimated_step_score ?? estimatedFromMiniRawTotal(total)
      ),
      phase: m.phase,
      improvement,
      improvementLabel:
        improvement == null
          ? "First"
          : improvement >= 0
            ? `+${improvement} ↑`
            : `${improvement} ↓`,
      estimatedStep: m.estimated_step_score ?? estimatedFromMiniRawTotal(total),
    };
  });

  const phaseMap = new Map(phaseRows.map((p) => [p.phase, p]));
  const currentPhase = enrollment?.current_phase ?? 1;
  const currentWeek = enrollment?.current_week ?? 1;

  const phaseProgress = STEP_PHASES.map((def: StepPhaseDefinition) => {
    const row = phaseMap.get(def.phase);
    let status =
      row?.status ??
      (def.phase < currentPhase
        ? "completed"
        : def.phase === currentPhase
          ? "active"
          : "locked");
    const threshold = passThresholdForPhase(def.phase);
    return {
      phase: def.phase,
      title: def.title,
      status,
      weekCount: def.weekCount,
      exitScore: row?.exit_score ?? null,
      completedAt: row?.completed_at ?? null,
      completedDate: row?.completed_at
        ? formatDisplayDate(row.completed_at)
        : null,
      currentWeek: status === "active" ? currentWeek : null,
      unlockRequirement:
        status === "locked" ? `Requires ${threshold}+` : null,
      borderColor:
        status === "completed"
          ? "#059669"
          : status === "active"
            ? GOLD
            : "#94a3b8",
    };
  });

  let totalAttempted = 0;
  let totalCorrect = 0;
  const sectionStats: Record<string, { attempted: number; correct: number }> = {};
  for (const row of sectionRows) {
    const key = row.section as string;
    if (!sectionStats[key]) sectionStats[key] = { attempted: 0, correct: 0 };
    sectionStats[key].attempted += row.questions_attempted ?? 0;
    sectionStats[key].correct += row.questions_correct ?? 0;
    totalAttempted += row.questions_attempted ?? 0;
    totalCorrect += row.questions_correct ?? 0;
  }

  totalAttempted += mocks.length * 100 + miniMocks.length * 20;

  const accuracyRate =
    totalCorrect > 0 && totalAttempted > 0
      ? Math.round((totalCorrect / Math.max(totalAttempted, totalCorrect)) * 100)
      : totalAttempted > 0
        ? Math.round(
            ((mocks.reduce((s, m) => s + (m.total_score ?? 0), 0) +
              miniMocks.reduce((s, m) => s + (m.total_score ?? 0), 0)) /
              Math.max(1, mocks.length * 100 + miniMocks.length * 20)) *
              100
          )
        : 0;

  let bestSection = "—";
  let bestAcc = 0;
  for (const s of SECTION_META) {
    const st = sectionStats[s.key];
    if (st && st.attempted > 0) {
      const acc = Math.round((st.correct / st.attempted) * 100);
      if (acc >= bestAcc) {
        bestAcc = acc;
        bestSection = s.label;
      }
    }
  }

  const studiedDates = new Set(
    [
      ...sectionRows.map((r) => r.session_date as string),
      ...mocks.map((m) => m.completed_at?.slice(0, 10)),
      ...miniMocks.map((m) => m.completed_at?.slice(0, 10)),
    ].filter(Boolean)
  );
  const weekCalendar = buildStudyWeekCalendar(studiedDates);
  const streak = streakRes.data;
  const totalHours = Number(streak?.total_hours ?? 0);

  let weeklyGain: number | null = null;
  let weeksToTarget: number | null = null;
  if (trendPoints.length >= 2) {
    const first = trendPoints[0];
    const last = trendPoints[trendPoints.length - 1];
    const weeks = Math.max(1, daysBetween(new Date(first.date), new Date(last.date)) / 7);
    weeklyGain = Math.round(((last.scaled - first.scaled) / weeks) * 10) / 10;
    if (displayEstimate != null && gap > 0 && weeklyGain > 0) {
      weeksToTarget = Math.ceil(gap / weeklyGain);
    }
  }

  const perf = performanceMeta(displayEstimate ?? 0);

  return {
    colors: { navy: NAVY, gold: GOLD, teal: TEAL },
    enrollment: {
      current_phase: currentPhase,
      estimated_score: estimated,
      target_score: target,
      diagnostic_score: diagnostic,
    },
    sectionScores,
    mockHistory,
    miniMockHistory,
    phaseProgress,
    exitTestHistory: exitTests.map((e) => ({
      phase: e.phase,
      total_score: e.total_score,
      passed: e.passed,
      submitted_at: e.submitted_at,
    })),
    streak: {
      current: streak?.current_streak ?? 0,
      longest: streak?.longest_streak ?? 0,
      totalDays: streak?.total_study_days ?? studiedDates.size,
      totalHours,
      calendar: weekCalendar,
    },
    scoreOverview: {
      current: displayEstimate,
      target,
      gap,
      targetReached,
      gapLabel: targetReached
        ? "Target reached ✅"
        : displayEstimate != null
          ? `+${gap} to reach target`
          : "Complete practice to measure",
      performance: perf,
    },
    sectionBreakdown,
    scoreTrend: trendPoints,
    studyStats: {
      streak: {
        current: streak?.current_streak ?? 0,
        calendar: weekCalendar,
        totalDays: streak?.total_study_days ?? studiedDates.size,
        totalHours,
      },
      questions: {
        total: totalAttempted,
        accuracyRate,
        bestSection,
        bestSectionAccuracy: bestAcc,
        bySection: SECTION_META.map((s) => ({
          label: s.label,
          count: sectionStats[s.key]?.attempted ?? 0,
        })),
      },
      pace: {
        weeklyGain,
        weeksToTarget,
        atTarget: displayEstimate != null && displayEstimate >= target,
      },
    },
  };
}
