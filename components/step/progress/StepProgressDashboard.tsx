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
const AMBER = "#d97706";

type Summary = {
  enrollment: {
    currentPhase: number;
    currentWeek: number;
    estimatedScore: number;
    targetScore: number;
    phaseTitle: string;
  };
  scoreOverview: {
    current: number;
    target: number;
    gap: number;
    performanceLabel: string;
  };
  sectionBreakdown: Array<{
    key: string;
    label: string;
    weight: string;
    max: number;
    path: string;
    score: number;
    pct: number;
    color: string;
    bestMock: number | null;
  }>;
  scoreHistory: Array<{ date: string; score: number; source: string }>;
  mockHistory: Array<{
    mockNumber: number;
    mockLabel: string;
    date: string;
    reading: number;
    structure: number;
    listening: number;
    compositional: number;
    total: number;
    totalColor: string;
    phase: number;
    improvement: number | null;
  }>;
  phaseProgress: Array<{
    phase: number;
    title: string;
    status: string;
    entryScore: number | null;
    exitScore: number | null;
    durationWeeks: number | null;
    completedAt: string | null;
    detail: string;
  }>;
  studyHabits: {
    streak: {
      current: number;
      totalDays: number;
      totalHours: number;
      calendar: Array<{ label: string; status: string }>;
    };
    questions: {
      total: number;
      accuracyRate: number;
      bestSection: string;
      bestSectionAccuracy: number;
      bySection: Array<{ label: string; attempted: number }>;
    };
    time: {
      totalHours: number;
      avgSessionMinutes: number;
      mostActiveDay: string;
      weeksToTarget: number | null;
    };
  };
};

function formatDate(iso: string) {
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

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function PhaseIcon({ status }: { status: string }) {
  if (status === "completed") return <span>✅</span>;
  if (status === "active") return <span>🔵</span>;
  return <span>🔒</span>;
}

function ScoreOverview({ data }: { data: Summary["scoreOverview"] }) {
  const current = Math.min(100, Math.max(0, data.current));
  const markers = [
    { value: 50, label: "Passing", color: "#94a3b8" },
    { value: 65, label: "University ready", color: "#94a3b8" },
    { value: 80, label: "Excellence", color: TEAL },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-500">Current estimated score</p>
          <p className="text-5xl font-bold" style={{ color: GOLD }}>
            {data.current}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500">Target score</p>
          <p className="text-5xl font-bold" style={{ color: TEAL }}>
            {data.target}
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-sm text-slate-500">Gap remaining</p>
          <p className="text-5xl font-bold" style={{ color: AMBER }}>
            {data.gap}
          </p>
        </div>
      </div>

      <div className="relative mt-8 h-4 rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${current}%`, background: GOLD }}
        />
        {markers.map((m) => (
          <div
            key={m.value}
            className="absolute top-0 h-full w-0.5"
            style={{ left: `${m.value}%`, background: m.color }}
            title={m.label}
          />
        ))}
        <div
          className="absolute -top-1 h-6 w-1 rounded"
          style={{ left: `${current}%`, background: GOLD, transform: "translateX(-50%)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
        <span>0</span>
        {markers.map((m) => (
          <span key={m.value}>
            {m.value} — {m.label}
          </span>
        ))}
        <span>100</span>
      </div>
      <p className="mt-4 text-center text-sm font-medium" style={{ color: NAVY }}>
        {data.performanceLabel}
      </p>
    </section>
  );
}

function SectionCards({ sections }: { sections: Summary["sectionBreakdown"] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        Section Breakdown
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <div key={s.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold" style={{ color: NAVY }}>
                  {s.label}
                </p>
                <p className="text-xs text-slate-500">{s.weight}</p>
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {s.score}/{s.max}{" "}
              <span className="text-base font-semibold" style={{ color: s.color }}>
                {s.pct}%
              </span>
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full"
                style={{ width: `${s.pct}%`, background: s.color }}
              />
            </div>
            <Link
              href={s.path}
              className="mt-3 inline-block text-sm font-medium"
              style={{ color: GOLD }}
            >
              Practice →
            </Link>
            {s.bestMock != null && (
              <p className="mt-2 text-xs text-slate-500">Best mock: {s.bestMock}/{s.max}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ScoreTrendChart({ history }: { history: Summary["scoreHistory"] }) {
  const chartData = history.map((p) => ({
    date: formatShortDate(p.date),
    score: p.score,
    source: p.source,
    fullDate: p.date,
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        Your Score Journey
      </h2>
      {chartData.length < 3 ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          Complete more practice sessions to see your score trend
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, _name, props) => {
                  const v = typeof value === "number" ? value : 0;
                  const source = (props as { payload?: { source?: string } })?.payload?.source ?? "";
                  return [`${v} (${source})`, "Score"];
                }}
                labelFormatter={(_l, payload) =>
                  payload?.[0]?.payload?.fullDate
                    ? formatDate(payload[0].payload.fullDate)
                    : ""
                }
              />
              <ReferenceLine y={80} stroke={TEAL} strokeDasharray="6 4" label="Target 80" />
              <ReferenceLine y={65} stroke={AMBER} strokeDasharray="6 4" label="Uni ready 65" />
              <Line
                type="monotone"
                dataKey="score"
                stroke={GOLD}
                strokeWidth={2}
                dot={{ r: 4, fill: GOLD }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function MockHistoryTable({ mocks }: { mocks: Summary["mockHistory"] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        Mock Exam Results
      </h2>
      {mocks.length === 0 ? (
        <div className="rounded-lg bg-slate-50 py-10 text-center">
          <p className="text-slate-600">No mock exams completed yet</p>
          <Link
            href="/dashboard/step/student/mock-test"
            className="mt-4 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: GOLD }}
          >
            Start Mock Exam #01 →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Mock #</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Reading</th>
                <th className="py-2 pr-4">Structure</th>
                <th className="py-2 pr-4">Listening</th>
                <th className="py-2 pr-4">Compositional</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Phase</th>
                <th className="py-2">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {mocks.map((m) => (
                <tr key={m.mockNumber} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{m.mockLabel}</td>
                  <td className="py-3 pr-4">{formatDate(m.date)}</td>
                  <td className="py-3 pr-4">{m.reading}/40</td>
                  <td className="py-3 pr-4">{m.structure}/30</td>
                  <td className="py-3 pr-4">{m.listening}/20</td>
                  <td className="py-3 pr-4">{m.compositional}/10</td>
                  <td className="py-3 pr-4 font-bold" style={{ color: m.totalColor }}>
                    {m.total}
                  </td>
                  <td className="py-3 pr-4">{m.phase}/4</td>
                  <td className="py-3">
                    {m.improvement == null ? (
                      <span className="text-slate-400">first mock</span>
                    ) : m.improvement >= 0 ? (
                      <span className="text-green-600">+{m.improvement}</span>
                    ) : (
                      <span className="text-red-600">{m.improvement}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PhaseJourney({ phases }: { phases: Summary["phaseProgress"] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        Your Phase Progress
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {phases.map((p) => (
          <div
            key={p.phase}
            className={`rounded-xl border p-4 ${
              p.status === "active" ? "border-teal-300 bg-teal-50/30" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <PhaseIcon status={p.status} />
              <p className="font-semibold" style={{ color: NAVY }}>
                Phase {p.phase}
              </p>
            </div>
            <p className="text-sm text-slate-600">{p.title}</p>
            <p className="mt-2 text-xs capitalize text-slate-500">{p.status}</p>
            {p.entryScore != null && (
              <p className="mt-1 text-xs text-slate-500">Entry: {p.entryScore}</p>
            )}
            {p.exitScore != null && (
              <p className="text-xs text-slate-500">Exit: {p.exitScore}</p>
            )}
            {p.durationWeeks != null && (
              <p className="text-xs text-slate-500">Duration: {p.durationWeeks} wk</p>
            )}
            {p.completedAt && (
              <p className="text-xs text-slate-500">Done: {formatShortDate(p.completedAt)}</p>
            )}
            <p className="mt-2 text-xs font-medium text-slate-700">{p.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudyHabits({ habits }: { habits: Summary["studyHabits"] }) {
  const calColors: Record<string, string> = {
    studied: TEAL,
    today: GOLD,
    missed: "#e2e8f0",
    future: "#f8fafc",
  };

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
        Study Habits
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Study Streak</p>
          <p className="mt-1 text-4xl font-bold">
            🔥 {habits.streak.current}
          </p>
          <div className="mt-4 flex justify-between gap-1">
            {habits.streak.calendar.map((d) => (
              <div key={d.label} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">{d.label}</span>
                <div
                  className="h-8 w-8 rounded-md border border-slate-200"
                  style={{ background: calColors[d.status] ?? "#e2e8f0" }}
                  title={d.status}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {habits.streak.totalDays} total study days · {habits.streak.totalHours.toFixed(1)} hours
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Questions Answered</p>
          <p className="mt-1 text-4xl font-bold" style={{ color: NAVY }}>
            {habits.questions.total}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {habits.questions.bySection.map((s) => `${s.label} ${s.attempted}`).join(" | ")}
          </p>
          <p className="mt-2 text-sm">
            Accuracy: <strong>{habits.questions.accuracyRate}%</strong> overall
          </p>
          <p className="text-sm text-slate-600">
            Best section: {habits.questions.bestSection} ({habits.questions.bestSectionAccuracy}%
            accuracy)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Time Invested</p>
          <p className="mt-1 text-4xl font-bold" style={{ color: NAVY }}>
            {habits.time.totalHours.toFixed(1)}h
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Avg session: {habits.time.avgSessionMinutes} min
          </p>
          <p className="text-sm text-slate-600">Most active: {habits.time.mostActiveDay}</p>
          {habits.time.weeksToTarget != null && (
            <p className="mt-3 text-sm font-medium" style={{ color: TEAL }}>
              At this pace you will reach 80+ in approximately {habits.time.weeksToTarget} weeks
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function StepProgressDashboard({ data }: { data: Summary }) {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          STEP Progress
        </h1>
        <p className="text-sm text-slate-500">
          Phase {data.enrollment.currentPhase} — {data.enrollment.phaseTitle} · Week{" "}
          {data.enrollment.currentWeek}
        </p>
      </div>
      <ScoreOverview data={data.scoreOverview} />
      <SectionCards sections={data.sectionBreakdown} />
      <ScoreTrendChart history={data.scoreHistory} />
      <MockHistoryTable mocks={data.mockHistory} />
      <PhaseJourney phases={data.phaseProgress} />
      <StudyHabits habits={data.studyHabits} />
    </div>
  );
}
