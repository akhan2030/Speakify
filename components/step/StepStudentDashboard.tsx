"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import { getPhaseDefinition } from "@/lib/step/phases";
import { STEP_ROUTES } from "@/lib/step/paths";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type PhaseRow = {
  phase: number;
  title: string;
  status: string;
};

type ExitTestStatus = {
  phase: number;
  phaseTitle: string;
  ready: boolean;
  cooldownDays: number;
  week: number;
  weeksInPhase: number;
  previousAttempts: Array<{
    passed: boolean;
    date: string;
  }>;
};

type DashboardData = {
  user: { name: string };
  enrollment: {
    diagnosticDone: boolean;
    diagnostic_score?: number | null;
    estimated_score: number;
    target_score: number;
    gap: number;
    current_phase?: number;
  };
  header: {
    phaseLabel: string;
    estimatedScore: number;
    targetScore: number;
    gap: number;
  };
  todayMission: {
    day: string;
    title: string;
    description: string;
    minutes: number;
    href: string;
  };
  scoreMeter: {
    estimated: number;
    target: number;
    gap: number;
    progressPercent: number;
    trend: "on_track" | "needs_attention";
    trendLabel: string;
  };
  sectionBreakdown: Array<{
    id: string;
    label: string;
    maxPoints: number;
    estimatedPoints: number;
    targetPoints: number;
    status: "green" | "amber" | "red";
    href: string;
  }>;
  phaseProgress: {
    phases: PhaseRow[];
    currentPhase: number;
    weekLabel: string;
    overallCompletion: number;
  };
  recommendedFocus: {
    sectionLabel: string;
    gapPoints: number;
    actions: Array<{ title: string; href: string }>;
    estimatedGain: string;
  };
  mocks: {
    recent: Array<{
      mock_number: number;
      total_score: number;
      completed_at: string;
    }>;
    nextRecommended: string;
  };
};

const STATUS_COLORS = {
  green: { bar: "#059669", text: "text-emerald-700", bg: "bg-emerald-500" },
  amber: { bar: "#c9972c", text: "text-amber-700", bg: "bg-amber-500" },
  red: { bar: "#dc2626", text: "text-red-700", bg: "bg-red-500" },
};

function PhaseIcon({ status }: { status: string }) {
  if (status === "completed") return <span className="text-lg">✅</span>;
  if (status === "active") return <span className="text-lg">🔵</span>;
  return <span className="text-lg">🔒</span>;
}

function isWithinLastDays(iso: string, days: number): boolean {
  const d = new Date(iso);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return d.getTime() >= cutoff;
}

function deriveTodayMission(
  data: DashboardData,
  exitStatus: ExitTestStatus | null,
  questionsAnswered: number
) {
  const lastAttempt = exitStatus?.previousAttempts?.[0];
  if (lastAttempt?.passed && isWithinLastDays(lastAttempt.date, 7)) {
    const nextPhase = (exitStatus?.phase ?? 1) + 1;
    const nextTitle = getPhaseDefinition(nextPhase)?.title ?? "next phase";
    return {
      day: data.todayMission.day,
      title: `🎉 Phase ${exitStatus?.phase} complete — begin Phase ${nextPhase} content`,
      description: `You passed your exit test. Start ${nextTitle} practice sessions this week.`,
      minutes: 30,
      href: STEP_ROUTES.home,
      highlight: true,
    };
  }

  if (exitStatus?.ready) {
    return {
      day: data.todayMission.day,
      title: `🎯 Phase ${exitStatus.phase} Exit Test is ready — take it today`,
      description: `You are in the final week of ${exitStatus.phaseTitle}. Pass threshold unlocks the next phase.`,
      minutes: 45,
      href: STEP_ROUTES.exitTest,
      highlight: true,
    };
  }

  if (questionsAnswered < 5) {
    const diag = data.enrollment.diagnostic_score ?? 0;
    if (diag < 50) {
      return {
        day: data.todayMission.day,
        title: "Start Phase 1 — Foundation basics",
        description: "Build grammar accuracy and reading pace with short Structure and Reading sessions.",
        minutes: 25,
        href: "/dashboard/step/student/structure",
        highlight: false,
      };
    }
    if (diag <= 72) {
      return {
        day: data.todayMission.day,
        title: "Start Phase 2 — Development sessions",
        description: "Strengthen Reading comprehension and timed Structure practice.",
        minutes: 30,
        href: "/dashboard/step/student/reading",
        highlight: false,
      };
    }
    return {
      day: data.todayMission.day,
      title: "Start Phase 3 — Advancement practice",
      description: "Train Listening and Compositional analysis — the sections that surprise most students.",
      minutes: 30,
      href: "/dashboard/step/student/listening",
      highlight: false,
    };
  }

  return { ...data.todayMission, highlight: false };
}

export default function StepStudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [exitStatus, setExitStatus] = useState<ExitTestStatus | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, exitRes, progressRes] = await Promise.all([
          fetch("/api/step/dashboard"),
          fetch("/api/step/exit-test/status"),
          fetch("/api/step/progress/summary"),
        ]);
        const json = await dashRes.json();
        if (!dashRes.ok) throw new Error(json.error ?? "Failed to load");
        setData(json);
        if (!json.enrollment.diagnosticDone) {
          router.replace(STEP_ROUTES.diagnostic);
          return;
        }
        const exitJson = await exitRes.json();
        if (!exitJson.error) setExitStatus(exitJson);
        const progressJson = await progressRes.json();
        if (!progressJson.error) {
          setQuestionsAnswered(progressJson.studyHabits?.questions?.total ?? 0);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, [router]);

  const todayMission = useMemo(
    () => (data ? deriveTodayMission(data, exitStatus, questionsAnswered) : null),
    [data, exitStatus, questionsAnswered]
  );

  const showOnboarding = useMemo(() => {
    if (!data) return false;
    return questionsAnswered < 5 && data.mocks.recent.length === 0;
  }, [data, questionsAnswered]);

  const phaseDisplay = useMemo(() => {
    if (!data) return "";
    const phase = data.phaseProgress.currentPhase;
    const title = getPhaseDefinition(phase)?.title ?? "Foundation";
    return `Phase ${phase} · ${title}`;
  }, [data]);

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
        <p className="mt-2 text-sm text-slate-500">
          Run supabase/step_accelerator_setup.sql in Supabase first.
        </p>
      </div>
    );
  }

  if (!data || !todayMission) return <PageSpinner />;

  const firstName = data.user.name.split(" ")[0] ?? "there";
  const { header, scoreMeter, sectionBreakdown, phaseProgress, recommendedFocus, mocks } = data;
  const hasMeasuredScore = questionsAnswered >= 5;
  const estimatedDisplay = hasMeasuredScore ? header.estimatedScore : "—";

  return (
    <div className="space-y-6 p-4 pb-24 md:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Speakify STEP Accelerator
        </p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl" style={{ color: NAVY }}>
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold" style={{ color: GOLD }}>
            {phaseDisplay}
          </span>
          {" · "}
          {hasMeasuredScore ? (
            <>
              Estimated <strong>{estimatedDisplay}</strong> / target{" "}
              <strong>{header.targetScore}+</strong>
              {header.gap > 0 ? (
                <span className="text-slate-500"> · {header.gap} points to go</span>
              ) : null}
            </>
          ) : (
            <span className="text-slate-500">Not yet assessed — complete practice to see your score</span>
          )}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className={`rounded-2xl border-2 bg-white p-6 shadow-sm ${
            todayMission.highlight ? "ring-2 ring-teal-200" : ""
          }`}
          style={{ borderColor: todayMission.highlight ? TEAL : GOLD }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Today&apos;s Mission · {todayMission.day}
          </p>
          <h2 className="mt-2 text-lg font-bold" style={{ color: NAVY }}>
            {todayMission.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{todayMission.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">{todayMission.minutes} min</span>
            <Link
              href={todayMission.href}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#0d1b35]"
              style={{ backgroundColor: GOLD }}
            >
              Start mission →
            </Link>
          </div>
        </section>

        {showOnboarding ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold" style={{ color: NAVY }}>
              Welcome to STEP Accelerator
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Your diagnostic is complete — you are in{" "}
              <strong>
                Phase {phaseProgress.currentPhase} ·{" "}
                {getPhaseDefinition(phaseProgress.currentPhase)?.title}
              </strong>
              .
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-700">Here is how to get started:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Complete your first Reading practice (15 min)</li>
              <li>Complete your first Structure session (10 min)</li>
              <li>Your estimated score will update after each session</li>
            </ol>
            <Link
              href="/dashboard/step/student/reading"
              className="mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-[#0d1b35]"
              style={{ backgroundColor: GOLD }}
            >
              Start today&apos;s practice →
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Score meter
            </p>
            <div className="mt-3 flex items-end gap-4">
              <p className="text-5xl font-extrabold tabular-nums" style={{ color: NAVY }}>
                {scoreMeter.estimated}
              </p>
              <div className="mb-2 text-sm text-slate-600">
                <p>
                  Target: <strong>{scoreMeter.target}+</strong>
                </p>
                <p>
                  Gap: <strong>{scoreMeter.gap}</strong> points
                </p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${scoreMeter.progressPercent}%`,
                  backgroundColor: scoreMeter.trend === "on_track" ? "#059669" : GOLD,
                }}
              />
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  scoreMeter.trend === "on_track" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span
                className={
                  scoreMeter.trend === "on_track" ? "text-emerald-700" : "text-amber-700"
                }
              >
                {scoreMeter.trendLabel}
              </span>
            </p>
          </section>
        )}
      </div>

      {exitStatus?.ready && (
        <section
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 p-5"
          style={{ borderColor: TEAL, background: "rgba(13, 148, 136, 0.06)" }}
        >
          <div>
            <p className="font-bold" style={{ color: NAVY }}>
              Phase {exitStatus.phase} Exit Test
            </p>
            <p className="text-sm text-slate-600">
              Week {exitStatus.week} of {exitStatus.weeksInPhase} — your exit test is ready
            </p>
          </div>
          <Link
            href={STEP_ROUTES.exitTest}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#0d1b35]"
            style={{ backgroundColor: GOLD }}
          >
            Take Exit Test →
          </Link>
        </section>
      )}

      {!exitStatus?.ready && exitStatus && exitStatus.cooldownDays > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-semibold" style={{ color: NAVY }}>
            Phase {exitStatus.phase} Exit Test
          </p>
          <p className="text-sm text-slate-600">
            Available in {exitStatus.cooldownDays} day{exitStatus.cooldownDays === 1 ? "" : "s"}
          </p>
        </section>
      )}

      {!exitStatus?.ready && exitStatus && exitStatus.cooldownDays === 0 && !exitStatus.ready && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-semibold" style={{ color: NAVY }}>
            Phase {exitStatus.phase} Exit Test
          </p>
          <p className="text-sm text-slate-600">
            You are in Week {exitStatus.week} of {exitStatus.weeksInPhase} — exit test unlocks in{" "}
            {Math.max(0, exitStatus.weeksInPhase - exitStatus.week)} week
            {exitStatus.weeksInPhase - exitStatus.week === 1 ? "" : "s"}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(exitStatus.week / exitStatus.weeksInPhase) * 100}%`,
                background: GOLD,
              }}
            />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
          Section breakdown
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectionBreakdown.map((s) => {
            const colors = STATUS_COLORS[s.status];
            const pct = s.maxPoints > 0 ? (s.estimatedPoints / s.maxPoints) * 100 : 0;
            return (
              <Link
                key={s.id}
                href={s.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-bold uppercase text-slate-400">{s.label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: NAVY }}>
                  {s.estimatedPoints}
                  <span className="text-base font-normal text-slate-400">/{s.maxPoints}</span>
                </p>
                <p className="text-xs text-slate-500">est. · target {s.targetPoints}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${colors.bg}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>
            Phase progress
          </h2>
          <p className="text-sm text-slate-500">
            {phaseProgress.weekLabel} · {phaseProgress.overallCompletion}% complete
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-4">
          {phaseProgress.phases.map((p, i) => (
            <div key={p.phase} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <PhaseIcon status={p.status} />
                <span className="text-xs font-semibold text-slate-600">Phase {p.phase}</span>
                <span className="hidden text-[10px] text-slate-400 sm:block">{p.title}</span>
              </div>
              {i < phaseProgress.phases.length - 1 ? (
                <span className="text-slate-300">→</span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full"
            style={{
              width: `${phaseProgress.overallCompletion}%`,
              backgroundColor: GOLD,
            }}
          />
        </div>
        <Link
          href={STEP_ROUTES.myJourney}
          className="mt-4 inline-block text-sm font-semibold hover:underline"
          style={{ color: GOLD }}
        >
          View full phase journey →
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-2xl border-2 bg-white p-6 shadow-sm"
          style={{ borderColor: TEAL }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
            Recommended focus
          </p>
          <h2 className="mt-2 text-lg font-bold" style={{ color: NAVY }}>
            {recommendedFocus.sectionLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Largest gap from target — {recommendedFocus.gapPoints} points behind in this section
          </p>
          <ul className="mt-4 space-y-2">
            {recommendedFocus.actions.map((action) => (
              <li key={action.title}>
                <Link
                  href={action.href}
                  className="flex items-center gap-2 text-sm font-medium text-teal-800 hover:underline"
                >
                  <span className="text-teal-600">→</span>
                  {action.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-teal-700">
            Estimated score gain this week: {recommendedFocus.estimatedGain}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>
            Mock exam history
          </h2>
          {mocks.recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No mocks yet — start your first practice mock.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {mocks.recent.map((m) => (
                <li
                  key={m.mock_number}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>
                    Mock #{m.mock_number} · {new Date(m.completed_at).toLocaleDateString()}
                  </span>
                  <strong style={{ color: NAVY }}>{m.total_score}/100</strong>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-slate-600">
            Next recommended mock: <strong>{mocks.nextRecommended}</strong>
          </p>
          <Link
            href={STEP_ROUTES.mockExam}
            className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-[#0d1b35]"
            style={{ backgroundColor: GOLD }}
          >
            Start Full Mock →
          </Link>
        </section>
      </div>
    </div>
  );
}
