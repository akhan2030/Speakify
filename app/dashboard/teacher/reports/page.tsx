"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  programType: string;
  cefrLevel: string;
  writingBand: number | null;
  speakingBand: number | null;
  readingBand: number | null;
  listeningBand: number | null;
  vocabularyPercent: number;
  lastActiveLabel: string;
  needsAttention: boolean;
  testsToday: number;
  lessonsCompletedThisWeek: number;
  readinessPercent: number | null;
  compositeBand: number | null;
};

type Summary = {
  totalActiveStudents: number;
  testsCompletedToday: number;
  averageBandScore: number | null;
  needsAttentionCount: number;
};

const SKILLS = [
  { key: "readingBand", label: "Reading" },
  { key: "listeningBand", label: "Listening" },
  { key: "speakingBand", label: "Speaking" },
  { key: "writingBand", label: "Writing" },
] as const;

const PROGRAM_LABELS: Record<string, string> = {
  ielts: "IELTS Academic",
  ielts_general: "IELTS General",
  pathway: "English Pathway",
  business_english: "Business English",
  legal_english: "Legal English",
  kids_english: "Kids English",
  step: "STEP",
};

function formatBand(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function averageBand(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function programLabel(program: string) {
  return PROGRAM_LABELS[program] ?? program;
}

function toCsv(rows: StudentRow[]) {
  const header = [
    "Name",
    "Email",
    "Program",
    "CEFR",
    "Reading",
    "Listening",
    "Speaking",
    "Writing",
    "Composite",
    "Readiness %",
    "Vocabulary %",
    "Tests today",
    "Lessons this week",
    "Last active",
    "Needs attention",
  ];
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((s) =>
    [
      s.name,
      s.email,
      programLabel(s.programType),
      s.cefrLevel,
      formatBand(s.readingBand),
      formatBand(s.listeningBand),
      formatBand(s.speakingBand),
      formatBand(s.writingBand),
      formatBand(s.compositeBand),
      s.readinessPercent ?? "",
      s.vocabularyPercent,
      s.testsToday,
      s.lessonsCompletedThisWeek,
      s.lastActiveLabel,
      s.needsAttention ? "Yes" : "No",
    ]
      .map(escape)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function BandBar({ band }: { band: number | null }) {
  const pct = band != null ? Math.min(100, (band / 9) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-[#c9972c] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function TeacherReportsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/teacher/students");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load reports");
        setStudents(json.students ?? []);
        setSummary(json.summary ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const programs = useMemo(() => {
    const set = new Set(students.map((s) => s.programType).filter(Boolean));
    return Array.from(set);
  }, [students]);

  const filtered = useMemo(
    () =>
      program === "all"
        ? students
        : students.filter((s) => s.programType === program),
    [students, program]
  );

  const moduleAverages = useMemo(
    () =>
      SKILLS.map((skill) => ({
        label: skill.label,
        band: averageBand(filtered.map((s) => s[skill.key])),
        count: filtered.filter(
          (s) => s[skill.key] != null && Number.isFinite(s[skill.key] as number)
        ).length,
      })),
    [filtered]
  );

  const distribution = useMemo(() => {
    const buckets = [
      { label: "< 5.0", min: 0, max: 5, count: 0 },
      { label: "5.0–5.5", min: 5, max: 6, count: 0 },
      { label: "6.0–6.5", min: 6, max: 7, count: 0 },
      { label: "7.0–7.5", min: 7, max: 8, count: 0 },
      { label: "8.0+", min: 8, max: 9.5, count: 0 },
    ];
    for (const s of filtered) {
      const b = s.compositeBand;
      if (b == null || !Number.isFinite(b)) continue;
      const bucket = buckets.find((x) => b >= x.min && b < x.max);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [filtered]);

  const programCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      map.set(s.programType, (map.get(s.programType) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [students]);

  const classAvg = useMemo(
    () => averageBand(filtered.map((s) => s.compositeBand)),
    [filtered]
  );
  const needsAttention = filtered.filter((s) => s.needsAttention).length;
  const maxBucket = Math.max(1, ...distribution.map((d) => d.count));

  function handleExport() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    const scope = program === "all" ? "all" : program;
    a.href = url;
    a.download = `speakify-progress-${scope}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
            Progress Reports
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Class-wide band trends, module breakdowns, and exportable reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {programs.length > 1 ? (
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-[#0d1b35]"
            >
              <option value="all">All programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>
                  {programLabel(p)}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || filtered.length === 0}
            className="rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-bold text-white hover:bg-[#152a4d] disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </header>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-12 text-center text-slate-500">Loading reports…</p>
      ) : students.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white px-8 py-16 text-center">
          <p className="text-lg text-slate-400">No student data yet.</p>
          <p className="mt-2 text-sm text-slate-400">
            Reports populate as students complete practice and tests.
          </p>
          <Link
            href="/dashboard/teacher"
            className="mt-6 inline-block rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white hover:bg-[#152a4d]"
          >
            Back to dashboard
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Students"
              value={String(filtered.length)}
              hint={program === "all" ? "Across all programs" : programLabel(program)}
            />
            <SummaryCard
              label="Class average band"
              value={formatBand(classAvg)}
              hint="Composite of available skills"
            />
            <SummaryCard
              label="Tests completed today"
              value={String(summary?.testsCompletedToday ?? 0)}
              hint="All students, all skills"
            />
            <SummaryCard
              label="Needs attention"
              value={String(needsAttention)}
              hint="Inactive 3+ days"
              alert={needsAttention > 0}
            />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Module breakdown
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Average band per skill across {filtered.length} student
                {filtered.length === 1 ? "" : "s"}
              </p>
              <div className="mt-5 space-y-4">
                {moduleAverages.map((m) => (
                  <div key={m.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[#0d1b35]">
                        {m.label}
                      </span>
                      <span className="text-slate-500">
                        {m.band != null ? (
                          <>
                            <span className="font-bold text-[#0d1b35]">
                              {formatBand(m.band)}
                            </span>{" "}
                            <span className="text-xs">
                              ({m.count} with data)
                            </span>
                          </>
                        ) : (
                          <span className="text-xs italic">No data yet</span>
                        )}
                      </span>
                    </div>
                    <BandBar band={m.band} />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Band distribution
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Students grouped by composite band
              </p>
              <div className="mt-5 space-y-3">
                {distribution.map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs font-medium text-slate-600">
                      {d.label}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-slate-100">
                      <div
                        className="flex h-full items-center justify-end rounded bg-[#0d1b35] px-2 text-[10px] font-bold text-white transition-all"
                        style={{ width: `${(d.count / maxBucket) * 100}%` }}
                      >
                        {d.count > 0 ? d.count : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {programCounts.length > 1 ? (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Students by program
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {programCounts.map(([p, count]) => (
                      <span
                        key={p}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[#0d1b35]"
                      >
                        {programLabel(p)}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Student roster
              </h2>
              <span className="text-xs text-slate-500">
                {filtered.length} student{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-4 py-3">R</th>
                    <th className="px-4 py-3">L</th>
                    <th className="px-4 py-3">S</th>
                    <th className="px-4 py-3">W</th>
                    <th className="px-4 py-3">Composite</th>
                    <th className="px-4 py-3">Readiness</th>
                    <th className="px-4 py-3">Last active</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                        s.needsAttention ? "bg-red-50/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#0d1b35]">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          {programLabel(s.programType)} · {s.cefrLevel}
                        </p>
                      </td>
                      <td className="px-4 py-4">{formatBand(s.readingBand)}</td>
                      <td className="px-4 py-4">{formatBand(s.listeningBand)}</td>
                      <td className="px-4 py-4">{formatBand(s.speakingBand)}</td>
                      <td className="px-4 py-4">{formatBand(s.writingBand)}</td>
                      <td className="px-4 py-4 font-bold text-[#0d1b35]">
                        {formatBand(s.compositeBand)}
                      </td>
                      <td className="px-4 py-4">
                        {s.readinessPercent != null ? `${s.readinessPercent}%` : "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {s.lastActiveLabel}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/teacher/student/${s.id}`}
                          className="rounded-lg bg-[#0d1b35] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#152a4d]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-4 text-xs text-slate-400">
            R = Reading, L = Listening, S = Speaking, W = Writing. Composite is the
            average of a student&apos;s available skill bands. Rows highlighted in
            red are inactive for 3+ days.
          </p>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        alert ? "border-red-200" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold ${
          alert ? "text-red-600" : "text-[#0d1b35]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
