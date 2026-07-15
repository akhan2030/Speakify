"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import NorthStarCard from "@/components/ielts/dashboard/NorthStarCard";
import ExamCountdownCard from "@/components/ielts/dashboard/ExamCountdownCard";
import StreakCard from "@/components/ielts/dashboard/StreakCard";
import RecommendedFocusCard from "@/components/ielts/dashboard/RecommendedFocusCard";
import BandTrendChart from "@/components/ielts/dashboard/BandTrendChart";
import ProjectedBandCard from "@/components/ielts/dashboard/ProjectedBandCard";

type DashboardData = {
  user: {
    name: string;
    examDate: string | null;
    studyDaysPerWeek: number;
  };
  greeting: string;
  todayDate: string;
  today: {
    dayName: string;
    subtitle: string;
    tasks: Array<{
      id: string;
      title: string;
      minutes: number;
      href: string;
      completed: boolean;
      taskType?: string;
    }>;
    completedCount: number;
    totalCount: number;
    remainingMinutes: number;
    allComplete: boolean;
    tomorrowDay: string;
  };
  streak: {
    current: number;
    longest: number;
    motivation: string;
    calendar: Array<{ label: string; status: string }>;
    totalHours: number;
    tasksDone: number;
    mocksTaken: number;
  };
  bands: {
    current: number | null;
    target: number;
    targetLabel?: string;
    gap: number | null;
    skills: Array<{
      key: string;
      label: string;
      href: string;
      band: number | null;
      target: number;
      gap: number | null;
      onTarget: boolean;
      needsWork: boolean;
      percent: number;
      attempted: boolean;
    }>;
  };
  bandTrend: Array<{ date: string; label: string; band: number }>;
  projection: {
    projectedBand: number | null;
    weeklyBandGain: number;
    onTrack: boolean;
    message: string;
  };
  weakestSkill: {
    key: string;
    label: string;
    band: number | null;
    target: number;
    gap: number | null;
    showAlert: boolean;
    actions: Array<{ title: string; minutes: number; href: string }>;
    estimatedImprovement: string;
    href: string;
  };
  recommendations: {
    items: Array<{
      title: string;
      minutes: number;
      href: string;
      estimatedBandGain: number;
      subtitle: string;
    }>;
    totalMinutes: number;
  };
  exam: {
    daysRemaining: number | null;
    examDateLabel: string | null;
    achievable: boolean;
    onTrackLabel: string;
    paceMessage: string;
    needsMoreEffort: boolean;
  };
  mock: {
    nextNumber: number;
    recommendedDay: string;
    duration: string;
    previous: {
      number: number;
      overallBand: number;
      dateLabel: string;
    } | null;
  };
  track: {
    name: string;
    currentWeek: number;
    weekCount: number;
    progressPercent: number;
    weeks: Array<{ week: number; status: string }>;
    currentWeekDays: Array<{ label: string; status: string }>;
    paceMessage: string;
  };
};

function ProgressBar({
  percent,
  className = "bg-[#c9972c]",
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${className}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function BandScale({
  current,
  target,
}: {
  current: number | null;
  target: number;
}) {
  const currentPct = current != null ? (current / 9) * 100 : 0;
  const targetPct = (target / 9) * 100;
  return (
    <div className="relative mt-4 h-3 w-full rounded-full bg-slate-100">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-[#c9972c]"
        style={{ width: `${currentPct}%` }}
      />
      <div
        className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 bg-[#0d1b35]"
        style={{ left: `${targetPct}%` }}
        title={`Target: ${target}`}
      />
    </div>
  );
}

export default function IeltsStudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [examDateInput, setExamDateInput] = useState("");
  const [savingExam, setSavingExam] = useState(false);
  const [examEditMode, setExamEditMode] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/ielts-dashboard");
      const json = await res.json();
      if (!json.error) {
        setData(json);
        if (json.user?.examDate) setExamDateInput(json.user.examDate);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveExamDate() {
    if (!examDateInput) return;
    setSavingExam(true);
    try {
      await fetch("/api/student/ielts-dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ielts_exam_date: examDateInput }),
      });
      await load();
      setExamEditMode(false);
    } finally {
      setSavingExam(false);
    }
  }

  async function toggleMissionTask(task: DashboardData["today"]["tasks"][0]) {
    if (!data) return;
    setTogglingId(task.id);
    try {
      const res = await fetch("/api/student/ielts-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action: task.completed ? "uncomplete" : "complete",
          timeSpentMinutes: task.minutes,
        }),
      });
      const json = await res.json();
      if (json.error) return;

      setData((prev) =>
        prev
          ? {
              ...prev,
              today: {
                ...prev.today,
                tasks: prev.today.tasks.map((t) =>
                  t.id === task.id ? { ...t, completed: !t.completed } : t
                ),
                completedCount: json.completedCount,
                totalCount: json.totalCount,
                remainingMinutes: json.remainingMinutes,
                allComplete: json.allComplete,
              },
              streak: {
                ...prev.streak,
                current: json.streak?.currentStreak ?? prev.streak.current,
              },
            }
          : prev
      );
    } finally {
      setTogglingId(null);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <PageSpinner />
      </div>
    );
  }

  const firstName = data.user.name.split(" ")[0];
  const missionProgress =
    data.today.totalCount > 0
      ? Math.round((data.today.completedCount / data.today.totalCount) * 100)
      : 0;

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      {/* SECTION 1 — Top status bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        <div>
          <span className="font-semibold text-[#0d1b35]">
            {data.greeting}, {firstName}
          </span>
          <span className="ml-2 text-slate-500">{data.todayDate}</span>
        </div>
        <div className="font-semibold text-[#c9972c]">
          🔥 {data.streak.current}-day streak
        </div>
        <div>
          {data.exam.daysRemaining != null ? (
            <span className="font-semibold text-amber-600">
              IELTS exam in {data.exam.daysRemaining} days
            </span>
          ) : (
            <Link
              href="/dashboard/ielts/student/settings"
              className="font-semibold text-[#0d9488] hover:underline"
            >
              Set exam date →
            </Link>
          )}
        </div>
      </div>

      {/* Feature 1 + 2 — North Star & exam countdown */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NorthStarCard bands={data.bands} />
        </div>
        <div className="lg:col-span-1">
          <ExamCountdownCard
            exam={data.exam}
            examDateInput={examDateInput}
            savingExam={savingExam}
            showEditForm={examEditMode || data.exam.daysRemaining == null}
            onDateChange={setExamDateInput}
            onSave={saveExamDate}
            onEditDate={() => setExamEditMode(true)}
          />
        </div>
      </div>

      {/* SECTION 2 — Today's Mission */}
      <section
        className={`mb-6 rounded-xl border bg-white p-5 shadow-sm md:p-6 ${
          data.today.allComplete
            ? "border-green-400 border-l-4 border-l-green-500"
            : "border-l-4 border-l-[#c9972c] border-slate-200"
        }`}
      >
        {data.today.allComplete ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-green-700">
              Today&apos;s mission complete! 🎉
            </h2>
            <p className="mt-2 text-slate-600">
              Come back tomorrow for {data.today.tomorrowDay}&apos;s tasks
            </p>
            <Link
              href="/dashboard/ielts/student/today"
              className="mt-4 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
            >
              Start tomorrow&apos;s tasks early →
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-[#0d1b35] md:text-xl">
              Today&apos;s Mission — {data.todayDate}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{data.today.subtitle}</p>

            <ul className="mt-5 space-y-2">
              {data.today.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    disabled={togglingId === task.id}
                    onClick={() => toggleMissionTask(task)}
                    className={`shrink-0 text-lg leading-none ${
                      task.completed ? "text-green-600" : "text-slate-400 hover:text-[#C8923E]"
                    } disabled:opacity-50`}
                    aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {task.completed ? "☑" : "☐"}
                  </button>
                  <Link
                    href={task.href}
                    className={`flex-1 ${task.completed ? "text-slate-400 line-through" : "text-[#0d1b35] hover:text-[#c9972c]"}`}
                  >
                    {task.title}
                  </Link>
                  <span className="text-xs text-slate-500">({task.minutes} min)</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>
                  {data.today.completedCount}/{data.today.totalCount} tasks completed today
                </span>
                <span className="text-slate-300" aria-hidden>
                  ·
                </span>
                <span>~{data.today.remainingMinutes} minutes left today</span>
              </div>
              <ProgressBar percent={missionProgress} />
            </div>

            <Link
              href="/dashboard/ielts/student/today"
              className="mt-5 inline-block w-full rounded-xl bg-[#c9972c] px-6 py-3 text-center text-sm font-bold text-[#0d1b35] hover:opacity-95 sm:w-auto"
            >
              Continue Today&apos;s Study →
            </Link>
          </>
        )}
      </section>

      {/* SECTION 3 — Two column layout */}
      <div className="mb-6 grid gap-6 lg:grid-cols-5">
        {/* LEFT 60% */}
        <div className="space-y-6 lg:col-span-3">
          {/* Band Score Overview */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="font-bold text-[#0d1b35]">Your Band Estimate vs Target</h3>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <p className="text-xs text-slate-500">Current</p>
                <p className="text-3xl font-bold text-[#c9972c]">
                  {data.bands.current?.toFixed(1) ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Target</p>
                <p className="text-3xl font-bold text-[#0d1b35]">
                  {data.bands.target.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gap</p>
                <p className="text-3xl font-bold text-amber-600">
                  {data.bands.gap?.toFixed(1) ?? "—"}
                </p>
              </div>
            </div>
            <BandScale current={data.bands.current} target={data.bands.target} />

            <div className="mt-6 space-y-4">
              {data.bands.skills.map((skill) => (
                <div key={skill.key} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="w-20 font-medium text-[#0d1b35]">{skill.label}</span>
                  <div className="min-w-[120px] flex-1">
                    <ProgressBar
                      percent={skill.percent}
                      className={skill.onTarget ? "bg-green-500" : "bg-[#c9972c]"}
                    />
                  </div>
                  {!skill.attempted ? (
                    <span className="text-xs text-amber-600">
                      Not attempted —{" "}
                      <Link href={skill.href} className="font-semibold hover:underline">
                        Start →
                      </Link>
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-[#0d1b35]">
                        {skill.band?.toFixed(1)} → {skill.target.toFixed(1)}
                      </span>
                      <span
                        className={`text-xs ${skill.onTarget ? "text-green-600" : "text-amber-600"}`}
                      >
                        {skill.onTarget
                          ? "✅ On target"
                          : `↑ needs +${skill.gap?.toFixed(1)}`}
                      </span>
                      <Link
                        href={skill.href}
                        className="text-xs font-semibold text-[#0d9488] hover:underline"
                      >
                        Practice →
                      </Link>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link
                href="/dashboard/ielts/student/progress?tab=readiness"
                className="font-semibold text-[#0d9488] hover:underline"
              >
                My Progress →
              </Link>
              <Link
                href="/dashboard/ielts/student/progress?tab=history"
                className="font-semibold text-slate-500 hover:text-[#0d9488] hover:underline"
              >
                Study history
              </Link>
              <Link
                href="/dashboard/ielts/student/progress?tab=achievements"
                className="font-semibold text-slate-500 hover:text-[#0d9488] hover:underline"
              >
                Achievements
              </Link>
            </div>
          </div>

          {/* Band trend chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="font-bold text-[#0d1b35]">Band score trend</h3>
            <p className="mt-1 text-xs text-slate-500">Progress over time vs your target</p>
            <div className="mt-4">
              <BandTrendChart
                points={data.bandTrend ?? []}
                target={data.bands.target}
                emptyCtaHref="/dashboard/ielts/student/today"
              />
            </div>
            {!data.bandTrend?.length ? (
              <Link
                href="/dashboard/ielts/student/progress?tab=history"
                className="mt-3 inline-block text-xs font-semibold text-[#0d9488] hover:underline"
              >
                Open study history →
              </Link>
            ) : null}
          </div>

          {/* Weakest Skill Alert */}
          {data.weakestSkill.showAlert ? (
            <div className="rounded-xl border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50/50 p-5 shadow-sm">
              <h3 className="font-bold text-[#0d1b35]">⚠ Priority this week</h3>
              <p className="mt-2 text-sm text-slate-700">
                {data.weakestSkill.label} — currently{" "}
                {data.weakestSkill.band?.toFixed(1) ?? "—"}, target{" "}
                {data.weakestSkill.target.toFixed(1)}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {data.weakestSkill.actions.map((action) => (
                  <li key={action.title}>
                    →{" "}
                    <Link href={action.href} className="hover:text-[#c9972c]">
                      {action.title} ({action.minutes} min)
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Estimated band improvement: {data.weakestSkill.estimatedImprovement} if
                completed this week
              </p>
              <Link
                href={data.weakestSkill.href}
                className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
              >
                Start priority tasks →
              </Link>
            </div>
          ) : null}

          {/* AI Recommendation — band gain focus */}
          <RecommendedFocusCard
            items={data.recommendations.items}
            totalMinutes={data.recommendations.totalMinutes}
          />
        </div>

        {/* RIGHT 40% */}
        <div className="space-y-6 lg:col-span-2">
          {/* Projected band at exam */}
          {data.projection ? (
            <ProjectedBandCard
              projection={data.projection}
              target={data.bands.target}
              daysRemaining={data.exam.daysRemaining}
            />
          ) : null}

          {/* Study streak — enhanced */}
          <StreakCard streak={data.streak} />

          {/* Next mock */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-[#0d1b35]">Next recommended mock</h3>
            <p className="mt-2 text-lg font-semibold text-[#c9972c]">
              Mock Exam #{data.mock.nextNumber}
            </p>
            <p className="text-sm text-slate-600">Recommended day: {data.mock.recommendedDay}</p>
            <p className="text-sm text-slate-600">Duration: {data.mock.duration}</p>
            {data.mock.previous ? (
              <p className="mt-3 text-sm text-slate-500">
                Mock #{data.mock.previous.number} — Overall{" "}
                {data.mock.previous.overallBand?.toFixed?.(1) ??
                  data.mock.previous.overallBand}{" "}
                — {data.mock.previous.dateLabel}
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No mocks completed yet</p>
            )}
            <Link
              href="/dashboard/ielts/student/mock-exam"
              className="mt-4 block rounded-lg bg-[#0d1b35] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#152a4d]"
            >
              Schedule Mock #{data.mock.nextNumber} →
            </Link>
            <Link
              href="/dashboard/ielts/student/mock-exam"
              className="mt-2 block text-center text-xs font-semibold text-[#0d9488] hover:underline"
            >
              Start now instead →
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 4 — Track roadmap */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <h3 className="font-bold text-[#0d1b35]">
          Your {data.track.name} track — Week {data.track.currentWeek} of{" "}
          {data.track.weekCount}
        </h3>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 overflow-x-auto">
          {data.track.weeks.map((w, i) => (
            <div key={w.week} className="flex items-center gap-2">
              <div
                className={`flex flex-col items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                  w.status === "current"
                    ? "bg-[#0d1b35] text-white"
                    : w.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                <span>
                  Week {w.week}{" "}
                  {w.status === "completed" ? "✅" : w.status === "current" ? "🔵" : "🔒"}
                </span>
              </div>
              {i < data.track.weeks.length - 1 ? (
                <span className="text-slate-300">→</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {data.track.currentWeekDays.map((d) => (
            <div
              key={d.label}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                d.status === "today"
                  ? "bg-[#c9972c]/20 text-[#0d1b35]"
                  : d.status === "completed"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-50 text-slate-500"
              }`}
            >
              {d.label}{" "}
              {d.status === "completed"
                ? "✅"
                : d.status === "today"
                  ? "🔵 today"
                  : "⬜"}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Overall track progress: {data.track.progressPercent}%</span>
            <span>{data.track.paceMessage}</span>
          </div>
          <ProgressBar percent={data.track.progressPercent} className="bg-[#0d9488]" />
        </div>

        <Link
          href="/dashboard/ielts/student/progress?tab=programme"
          className="mt-4 inline-block text-sm font-semibold text-[#c9972c] hover:underline"
        >
          Open programme roadmap →
        </Link>
      </section>
    </main>
  );
}
