"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type ProgressData = {
  enrollment: {
    current_phase: number;
    estimated_score: number;
    target_score: number;
    diagnostic_score: number | null;
  };
  scoreOverview: {
    current: number | null;
    target: number;
    gap: number;
    targetReached: boolean;
    gapLabel: string;
    performance: { label: string; color: string };
  };
  sectionBreakdown: Array<{
    key: string;
    label: string;
    icon: string;
    weight: string;
    max: number;
    path: string;
    score: number | null;
    pct: number | null;
    color: string;
    bestScore: number | null;
    hasData: boolean;
  }>;
  scoreTrend: Array<{ date: string; score: number; type: string; scaled: number }>;
  mockHistory: Array<{
    mockLabel: string;
    dateFormatted: string;
    reading: number;
    structure: number;
    listening: number;
    compositional: number;
    total: number;
    totalColor: string;
    phaseLabel: string;
    improvementLabel: string;
    improvement: number | null;
  }>;
  miniMockHistory: Array<{
    mockLabel: string;
    dateFormatted: string;
    reading: number;
    structure: number;
    listening: number;
    compositional: number;
    total: number;
    totalColor: string;
    improvementLabel: string;
    estimatedStep: number;
  }>;
  phaseProgress: Array<{
    phase: number;
    title: string;
    status: string;
    weekCount: number;
    exitScore: number | null;
    completedDate: string | null;
    currentWeek: number | null;
    unlockRequirement: string | null;
    borderColor: string;
  }>;
  studyStats: {
    streak: {
      current: number;
      calendar: Array<{ label: string; status: string }>;
      totalDays: number;
      totalHours: number;
    };
    questions: {
      total: number;
      accuracyRate: number;
      bestSection: string;
      bestSectionAccuracy: number;
      bySection: Array<{ label: string; count: number }>;
    };
    pace: {
      weeklyGain: number | null;
      weeksToTarget: number | null;
      atTarget: boolean;
    };
  };
};

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function ScoreBar({ current }: { current: number | null }) {
  const pos = current != null ? Math.min(100, Math.max(0, current)) : 0;
  const markers = [
    { value: 50, label: "Passing", color: "#94a3b8" },
    { value: 65, label: "University ready", color: GOLD },
    { value: 80, label: "Excellence", color: TEAL },
  ];

  return (
    <div className="mt-8">
      <div className="relative h-3 rounded-full bg-white/20">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#c9972c]"
          style={{ width: `${pos}%` }}
        />
        {markers.map((m) => (
          <div
            key={m.value}
            className="absolute top-0 h-full w-0.5 bg-white/40"
            style={{ left: `${m.value}%` }}
          />
        ))}
        {current != null && (
          <div
            className="absolute -top-2 flex flex-col items-center"
            style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          >
            <span className="mb-1 text-xs font-bold text-[#c9972c]">{current}</span>
            <div className="h-5 w-5 rounded-full border-2 border-white bg-[#c9972c]" />
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-between text-[10px] text-white/60">
        <span>0</span>
        {markers.map((m) => (
          <span key={m.value} style={{ color: m.color === "#94a3b8" ? "#cbd5e1" : m.color }}>
            {m.value} {m.label}
          </span>
        ))}
        <span>100</span>
      </div>
      {current != null && (
        <p className="mt-2 text-center text-xs text-white/70">↑ You</p>
      )}
    </div>
  );
}

export default function StepProgressFull({ data }: { data: ProgressData }) {
  const { scoreOverview, sectionBreakdown, scoreTrend, mockHistory, miniMockHistory, phaseProgress, studyStats } =
    data;
  const calColors: Record<string, string> = {
    studied: TEAL,
    today: GOLD,
    missed: "#e2e8f0",
    future: "#f8fafc",
  };

  const chartData = scoreTrend.map((p) => ({
    date: formatShortDate(p.date),
    score: p.scaled,
    type: p.type,
    fullDate: p.date,
  }));

  return (
    <div className="space-y-8 p-4 pb-24 md:p-8">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: NAVY }}>
          My STEP Progress
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your score growth and section performance
        </p>
      </header>

      {/* Section 1 — Score Overview */}
      <section className="rounded-2xl p-6 text-white shadow-lg md:p-8" style={{ background: NAVY }}>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/60">Current Estimate</p>
            <p className="mt-2 text-5xl font-bold tabular-nums" style={{ color: GOLD }}>
              {scoreOverview.current ?? "—"}
            </p>
          </div>
          <div className="flex items-center justify-center text-center">
            <p
              className={`text-lg font-semibold ${
                scoreOverview.targetReached ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {scoreOverview.gapLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/60">Target Score</p>
            <p className="mt-2 text-5xl font-bold tabular-nums" style={{ color: TEAL }}>
              {scoreOverview.target}
            </p>
          </div>
        </div>
        <ScoreBar current={scoreOverview.current} />
        <p
          className="mt-6 text-center text-sm font-medium"
          style={{ color: scoreOverview.performance.color }}
        >
          {scoreOverview.current != null ? scoreOverview.performance.label : "Complete practice to see your band"}
        </p>
      </section>

      {/* Section 2 — Section Breakdown */}
      <section>
        <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
          Section Breakdown
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectionBreakdown.map((s) => (
            <div key={s.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-lg">{s.icon}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {s.weight}
                </span>
              </div>
              <p className="mt-2 font-semibold" style={{ color: NAVY }}>
                {s.label}
              </p>
              {s.hasData ? (
                <>
                  <p className="mt-2 text-2xl font-bold">
                    {s.score}/{s.max}{" "}
                    <span className="text-base" style={{ color: s.color }}>
                      {s.pct}%
                    </span>
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${s.pct ?? 0}%`, background: s.color }}
                    />
                  </div>
                  {s.bestScore != null && (
                    <p className="mt-2 text-xs text-slate-500">Best score: {s.bestScore}</p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  —<br />
                  Start practising to see your score
                </p>
              )}
              <Link href={s.path} className="mt-3 inline-block text-sm font-medium" style={{ color: GOLD }}>
                Practice →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Score Trend */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
          Your Score Journey
        </h2>
        {chartData.length < 2 ? (
          <div className="rounded-xl bg-slate-50 py-12 text-center">
            <p className="text-slate-600">
              Complete at least 2 practice sessions to see your score trend
            </p>
            <Link
              href="/dashboard/step/student/mini-mock"
              className="mt-4 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-[#0d1b35]"
              style={{ background: GOLD }}
            >
              Start Mini Mock →
            </Link>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, _n, props) => {
                    const v = typeof value === "number" ? value : 0;
                    const t = (props as { payload?: { type?: string } })?.payload?.type ?? "";
                    return [`${v} (${t})`, "Score"];
                  }}
                />
                <ReferenceLine y={80} stroke={TEAL} strokeDasharray="6 4" />
                <ReferenceLine y={65} stroke={GOLD} strokeDasharray="6 4" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={GOLD}
                  strokeWidth={2}
                  dot={{ r: 4, fill: GOLD }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Section 4 — Full Mock History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
          Full Mock Exam Results
        </h2>
        {mockHistory.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-600">No full mock exams yet</p>
            <Link
              href="/dashboard/step/student/mock-test"
              className="mt-4 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-[#0d1b35]"
              style={{ background: GOLD }}
            >
              Start Full Mock Exam →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2 pr-3">Mock #</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Reading</th>
                  <th className="py-2 pr-3">Structure</th>
                  <th className="py-2 pr-3">Listening</th>
                  <th className="py-2 pr-3">Comp</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Phase</th>
                  <th className="py-2">vs Previous</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map((m) => (
                  <tr key={m.mockLabel} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-medium">{m.mockLabel}</td>
                    <td className="py-3 pr-3">{m.dateFormatted}</td>
                    <td className="py-3 pr-3">{m.reading}/40</td>
                    <td className="py-3 pr-3">{m.structure}/30</td>
                    <td className="py-3 pr-3">{m.listening}/20</td>
                    <td className="py-3 pr-3">{m.compositional}/10</td>
                    <td className="py-3 pr-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                        style={{ background: m.totalColor }}
                      >
                        {m.total}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs">{m.phaseLabel}</td>
                    <td className="py-3">
                      <span
                        className={
                          m.improvement == null
                            ? "text-slate-400"
                            : m.improvement >= 0
                              ? "text-green-600"
                              : "text-red-600"
                        }
                      >
                        {m.improvementLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 5 — Mini Mock History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
          Practice Test Results
        </h2>
        {miniMockHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No practice tests yet — try a mini mock.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Reading</th>
                  <th className="py-2 pr-3">Structure</th>
                  <th className="py-2 pr-3">Listening</th>
                  <th className="py-2 pr-3">Comp</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Est. STEP</th>
                  <th className="py-2">vs Prev</th>
                </tr>
              </thead>
              <tbody>
                {miniMockHistory.map((m) => (
                  <tr key={m.mockLabel} className="border-b border-slate-100">
                    <td className="py-3 pr-3">{m.mockLabel}</td>
                    <td className="py-3 pr-3">{m.dateFormatted}</td>
                    <td className="py-3 pr-3">{m.reading}/5</td>
                    <td className="py-3 pr-3">{m.structure}/5</td>
                    <td className="py-3 pr-3">{m.listening}/5</td>
                    <td className="py-3 pr-3">{m.compositional}/5</td>
                    <td className="py-3 pr-3 font-bold">{m.total}/20</td>
                    <td className="py-3 pr-3">~{m.estimatedStep}</td>
                    <td className="py-3">{m.improvementLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 6 — Phase Journey */}
      <section>
        <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
          Your Phase Progress
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phaseProgress.map((p) => (
            <div
              key={p.phase}
              className="rounded-xl border-2 bg-white p-4"
              style={{ borderColor: p.borderColor }}
            >
              <p className="font-bold" style={{ color: NAVY }}>
                Phase {p.phase}
              </p>
              <p className="text-sm text-slate-600">{p.title}</p>
              <p className="mt-2 text-lg">
                {p.status === "completed" ? "✅" : p.status === "active" ? "🔵" : "🔒"}{" "}
                <span className="text-xs capitalize text-slate-500">{p.status}</span>
              </p>
              {p.status === "completed" && p.exitScore != null && (
                <p className="mt-1 text-sm text-green-700">Exit: {p.exitScore}/100</p>
              )}
              {p.status === "active" && p.currentWeek != null && (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    Week {p.currentWeek}/{p.weekCount}
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(p.currentWeek / p.weekCount) * 100}%`,
                        background: GOLD,
                      }}
                    />
                  </div>
                </>
              )}
              {p.status === "locked" && p.unlockRequirement && (
                <p className="mt-1 text-xs text-slate-500">{p.unlockRequirement}</p>
              )}
              {p.completedDate && (
                <p className="mt-1 text-xs text-slate-400">{p.completedDate}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">{p.weekCount} weeks</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 7 — Study Stats */}
      <section>
        <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
          Study Stats
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Study Streak</p>
            <p className="mt-1 text-4xl font-bold">🔥 {studyStats.streak.current}</p>
            <div className="mt-4 flex justify-between gap-1">
              {studyStats.streak.calendar.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{d.label}</span>
                  <div
                    className="h-8 w-8 rounded-md border border-slate-200"
                    style={{ background: calColors[d.status] ?? "#e2e8f0" }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600">
              {studyStats.streak.totalDays} days · {studyStats.streak.totalHours.toFixed(1)}h
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Questions Answered</p>
            <p className="mt-1 text-4xl font-bold" style={{ color: NAVY }}>
              {studyStats.questions.total}
            </p>
            <p className="mt-3 text-xs text-slate-600">
              {studyStats.questions.bySection.map((s) => `${s.label} ${s.count}`).join(" · ")}
            </p>
            <p className="mt-2 text-sm">Accuracy: {studyStats.questions.accuracyRate}%</p>
            {studyStats.questions.bestSection !== "—" && (
              <p className="text-sm" style={{ color: TEAL }}>
                Best: {studyStats.questions.bestSection} ({studyStats.questions.bestSectionAccuracy}%)
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Pace Analysis</p>
            {studyStats.pace.atTarget ? (
              <p className="mt-4 text-lg font-semibold" style={{ color: TEAL }}>
                🏆 Excellence target reached
              </p>
            ) : studyStats.pace.weeklyGain != null && studyStats.pace.weeksToTarget != null ? (
              <>
                <p className="mt-3 text-sm text-slate-600">
                  Avg improvement: <strong>+{studyStats.pace.weeklyGain}</strong> pts/week
                </p>
                <p className="mt-3 text-sm font-medium" style={{ color: TEAL }}>
                  At this pace you will reach 80 in approximately {studyStats.pace.weeksToTarget}{" "}
                  weeks
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Complete more sessions to see your pace
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
