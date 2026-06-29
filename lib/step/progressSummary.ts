import type { SupabaseClient } from "@supabase/supabase-js";
import { STEP_PHASES, getPhaseDefinition, STEP_DEFAULT_TARGET } from "./phases";
import type { StepPhaseDefinition } from "./phases";
import { buildStudyWeekCalendar } from "@/lib/ielts/studyWeek";

const SECTION_META = [
  { key: "reading", label: "Reading", weight: "40%", max: 40, path: "/dashboard/step/student/reading" },
  { key: "structure", label: "Structure", weight: "30%", max: 30, path: "/dashboard/step/student/structure" },
  { key: "listening", label: "Listening", weight: "20%", max: 20, path: "/dashboard/step/student/listening" },
  {
    key: "compositional_analysis",
    label: "Compositional",
    weight: "10%",
    max: 10,
    path: "/dashboard/step/student/compositional",
  },
] as const;

function performanceLabel(score: number): string {
  if (score >= 80) return "🏆 Excellence — Top Performance";
  if (score >= 65) return "✅ Competitive — University Ready";
  if (score >= 50) return "📈 Developing — Good Progress";
  return "📚 Foundation — Keep Studying";
}

function pctColor(pct: number): string {
  if (pct >= 75) return "#059669";
  if (pct >= 60) return "#c9972c";
  return "#dc2626";
}

function totalScoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 65) return "#c9972c";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function fetchProgressSummary(supabase: SupabaseClient, studentId: string) {
  const [
    enrollmentRes,
    sectionRes,
    mockRes,
    phaseRes,
    historyRes,
    streakRes,
    exitRes,
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
      .from("step_phase_progress")
      .select("*")
      .eq("student_id", studentId)
      .order("phase", { ascending: true }),
    supabase
      .from("step_progress_history")
      .select("*")
      .eq("student_id", studentId)
      .gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: true }),
    supabase.from("study_streaks").select("*").eq("student_id", studentId).maybeSingle(),
    supabase
      .from("step_exit_tests")
      .select("total_score, submitted_at, phase")
      .eq("student_id", studentId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true }),
  ]);

  const enrollment = enrollmentRes.data;
  const sectionRows = sectionRes.data ?? [];
  const mocks = mockRes.data ?? [];
  const phaseRows = phaseRes.data ?? [];
  let scoreHistory = (historyRes.data ?? []).map((row) => ({
    date: row.recorded_at,
    score: row.score,
    source: row.source as string,
    phase: row.phase,
  }));

  if (scoreHistory.length === 0) {
    const synthesized: typeof scoreHistory = [];
    for (const m of mocks) {
      synthesized.push({
        date: m.completed_at,
        score: m.total_score ?? 0,
        source: "mock",
        phase: m.phase,
      });
    }
    const byDate = new Map<string, number>();
    for (const row of sectionRows) {
      const key = row.session_date as string;
      if (!byDate.has(key)) {
        const dayRows = sectionRows.filter((r) => r.session_date === key);
        const total = dayRows.reduce((sum, r) => sum + (r.estimated_score ?? 0), 0);
        byDate.set(key, total);
      }
    }
    for (const [date, score] of byDate) {
      synthesized.push({
        date: `${date}T12:00:00.000Z`,
        score,
        source: "practice",
        phase: enrollment?.current_phase ?? 1,
      });
    }
    synthesized.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    scoreHistory = synthesized.filter((p) => {
      const d = new Date(p.date);
      return d >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    });
  }

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

  const latestMock = mocks.length > 0 ? mocks[mocks.length - 1] : null;
  const currentScore =
    latestMock?.total_score ??
    enrollment?.estimated_score ??
    scoreHistory[scoreHistory.length - 1]?.score ??
    0;
  const targetScore = enrollment?.target_score ?? STEP_DEFAULT_TARGET;
  const gap = Math.max(0, targetScore - currentScore);

  const sectionBreakdown = SECTION_META.map((s) => {
    const score = latestBySection[s.key] ?? 0;
    const pct = Math.round((score / s.max) * 100);
    return {
      ...s,
      score,
      pct,
      color: pctColor(pct),
      bestMock: bestMockBySection[s.key] ?? null,
    };
  });

  const mockHistory = mocks.map((m, i) => {
    const prev = i > 0 ? mocks[i - 1] : null;
    const improvement =
      prev == null ? null : (m.total_score ?? 0) - (prev.total_score ?? 0);
    return {
      mockNumber: m.mock_number,
      mockLabel: `#${String(m.mock_number).padStart(2, "0")}`,
      date: m.completed_at,
      reading: m.reading_score,
      structure: m.structure_score,
      listening: m.listening_score,
      compositional: m.compositional_score,
      total: m.total_score,
      totalColor: totalScoreColor(m.total_score ?? 0),
      phase: m.phase,
      improvement,
    };
  });

  const phaseMap = new Map(phaseRows.map((p) => [p.phase, p]));
  const currentPhase = enrollment?.current_phase ?? 1;
  const currentWeek = enrollment?.current_week ?? 1;
  const currentDef = getPhaseDefinition(currentPhase);

  const phaseProgress = STEP_PHASES.map((def: StepPhaseDefinition) => {
    const row = phaseMap.get(def.phase);
    const status = row?.status ?? (def.phase < currentPhase ? "completed" : def.phase === currentPhase ? "active" : "locked");
    const durationWeeks =
      row?.started_at && row?.completed_at
        ? Math.max(
            1,
            Math.ceil(
              daysBetween(new Date(row.started_at), new Date(row.completed_at)) / 7
            )
          )
        : def.phase === currentPhase
          ? currentWeek
          : null;

    let detail = "";
    if (status === "completed") {
      detail = `Exit test passed — score: ${row?.exit_score ?? "—"}`;
    } else if (status === "active") {
      const weeksLeft = Math.max(0, def.weekCount - currentWeek);
      detail = `Week ${currentWeek} of ${def.weekCount} — Exit test in ${weeksLeft} week${weeksLeft === 1 ? "" : "s"}`;
    } else {
      const unlockAfter = def.phase - 1;
      detail = `Unlocks after Phase ${unlockAfter} exit test`;
    }

    return {
      phase: def.phase,
      title: def.title,
      status,
      entryScore: row?.entry_score ?? null,
      exitScore: row?.exit_score ?? null,
      durationWeeks,
      completedAt: row?.completed_at ?? null,
      detail,
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

  const accuracyRate =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  let bestSection = "Structure";
  let bestAcc = 0;
  for (const s of SECTION_META) {
    const st = sectionStats[s.key];
    if (st && st.attempted > 0) {
      const acc = Math.round((st.correct / st.attempted) * 100);
      if (acc > bestAcc) {
        bestAcc = acc;
        bestSection = s.label;
      }
    }
  }

  const studiedDates = new Set(
    sectionRows.map((r) => r.session_date as string).filter(Boolean)
  );
  const weekCalendar = buildStudyWeekCalendar(studiedDates);

  const streak = streakRes.data;
  const totalHours = Number(streak?.total_hours ?? 0);
  const sessionDays = studiedDates.size || streak?.total_study_days || 0;
  const avgSessionMinutes =
    sessionDays > 0 ? Math.round((totalHours * 60) / sessionDays) : 0;

  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of studiedDates) {
    const dow = new Date(d).getDay();
    dayCounts[dow]++;
  }
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mostActiveDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))] ?? "Monday";

  let weeksToTarget: number | null = null;
  if (scoreHistory.length >= 2 && gap > 0) {
    const first = scoreHistory[0];
    const last = scoreHistory[scoreHistory.length - 1];
    const weeks = Math.max(1, daysBetween(new Date(first.date), new Date(last.date)) / 7);
    const gain = (last.score - first.score) / weeks;
    if (gain > 0) weeksToTarget = Math.ceil(gap / gain);
  }

  return {
    enrollment: {
      currentPhase,
      currentWeek,
      estimatedScore: currentScore,
      targetScore,
      phaseTitle: currentDef?.title ?? "Foundation",
    },
    scoreOverview: {
      current: currentScore,
      target: targetScore,
      gap,
      performanceLabel: performanceLabel(currentScore),
    },
    sectionBreakdown,
    scoreHistory,
    mockHistory,
    phaseProgress,
    studyHabits: {
      streak: {
        current: streak?.current_streak ?? 0,
        longest: streak?.longest_streak ?? 0,
        totalDays: streak?.total_study_days ?? sessionDays,
        totalHours,
        calendar: weekCalendar,
      },
      questions: {
        total: totalAttempted,
        correct: totalCorrect,
        accuracyRate,
        bestSection,
        bestSectionAccuracy: bestAcc,
        bySection: SECTION_META.map((s) => ({
          label: s.label,
          attempted: sectionStats[s.key]?.attempted ?? 0,
        })),
      },
      time: {
        totalHours,
        avgSessionMinutes,
        mostActiveDay,
        weeksToTarget,
      },
    },
  };
}
