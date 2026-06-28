"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type PhaseRow = {
  phase: number;
  title: string;
  status: string;
};

type DashboardData = {
  user: { name: string };
  enrollment: {
    diagnosticDone: boolean;
    estimated_score: number;
    target_score: number;
    gap: number;
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

export default function StepStudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/step/dashboard");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        setData(json);
        if (!json.enrollment.diagnosticDone) {
          router.replace(STEP_ROUTES.diagnostic);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, [router]);

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

  if (!data) return <PageSpinner />;

  const firstName = data.user.name.split(" ")[0] ?? "there";
  const { header, todayMission, scoreMeter, sectionBreakdown, phaseProgress, recommendedFocus, mocks } = data;

  return (
    <div className="space-y-6 p-4 pb-24 md:p-8">
      {/* Header */}
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Speakify STEP Accelerator
        </p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl" style={{ color: NAVY }}>
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold" style={{ color: GOLD }}>
            {header.phaseLabel}
          </span>
          {" · "}
          Estimated <strong>{header.estimatedScore}</strong> / target{" "}
          <strong>{header.targetScore}+</strong>
          {header.gap > 0 ? (
            <span className="text-slate-500"> · {header.gap} points to go</span>
          ) : null}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Mission */}
        <section className="rounded-2xl border-2 bg-white p-6 shadow-sm" style={{ borderColor: GOLD }}>
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

        {/* Score Meter */}
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
      </div>

      {/* Section Breakdown */}
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

      {/* Phase Progress */}
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
                <span className="text-xs font-semibold text-slate-600">
                  Phase {p.phase}
                </span>
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
        {/* Recommended Focus */}
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
            Largest gap from target — {recommendedFocus.gapPoints} points behind in this
            section
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

        {/* Mock history */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>
            Mock exam history
          </h2>
          {mocks.recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No mocks yet — start your first practice mock.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {mocks.recent.map((m) => (
                <li
                  key={m.mock_number}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>
                    Mock #{m.mock_number} ·{" "}
                    {new Date(m.completed_at).toLocaleDateString()}
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
