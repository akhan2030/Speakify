"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CEFR_LEVELS } from "@/lib/vocabulary";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  cefrLevel: string;
  writingBand: number | null;
  speakingBand: number | null;
  readingBand: number | null;
  listeningBand: number | null;
  vocabularyPercent: number;
  lastActiveAt: string | null;
  lastActiveLabel: string;
  needsAttention: boolean;
  activeToday: boolean;
  testsToday: number;
};

type Overview = {
  totalStudents: number;
  testsToday: number;
  averageBandScore: number | null;
  inactiveStudents3PlusDays: number;
};

type PlacementResultRow = {
  attemptId: string;
  studentId: string;
  name: string;
  email: string;
  overallBand: number | null;
  cefrLevel: string;
  completedAtLabel: string;
};

function bandRowClass(band: number | null) {
  if (band == null || !Number.isFinite(band)) return "text-slate-600";
  if (band < 5) return "font-bold text-red-600";
  if (band <= 6) return "font-bold text-amber-600";
  return "font-bold text-green-600";
}

type FilterId = "all" | "needs_attention" | "active_today" | `cefr:${string}`;

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "gold" | "teal" | "navy" | "alert";
}) {
  const valueClass =
    accent === "alert"
      ? "text-red-600"
      : accent === "teal"
        ? "text-[#0d9488]"
        : accent === "gold"
          ? "text-[#c9972c]"
          : "text-[#0d1b35]";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<FilterId>("all");
  const [placementResults, setPlacementResults] = useState<PlacementResultRow[]>(
    []
  );
  const [placementLoading, setPlacementLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const [overviewRes, studentsRes, placementRes] = await Promise.all([
          fetch("/api/teacher/overview"),
          fetch("/api/teacher/students"),
          fetch("/api/teacher/placement-results"),
        ]);
        const overviewJson = await overviewRes.json();
        const studentsJson = await studentsRes.json();
        const placementJson = placementRes.ok
          ? await placementRes.json()
          : { results: [] };
        if (!overviewRes.ok && !studentsRes.ok) {
          throw new Error(
            overviewJson.error ?? studentsJson.error ?? "Failed"
          );
        }
        if (!cancelled) {
          if (overviewRes.ok) {
            setOverview({
              totalStudents: overviewJson.totalStudents ?? 0,
              testsToday: overviewJson.testsToday ?? 0,
              averageBandScore: overviewJson.averageBandScore ?? null,
              inactiveStudents3PlusDays:
                overviewJson.inactiveStudents3PlusDays ?? 0,
            });
          }
          if (studentsRes.ok) {
            setStudents(studentsJson.students ?? []);
          } else {
            setStudents([]);
          }
          if (!overviewRes.ok || !studentsRes.ok) setError(true);
          setPlacementResults(placementJson.results ?? []);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setOverview({
            totalStudents: 0,
            testsToday: 0,
            averageBandScore: null,
            inactiveStudents3PlusDays: 0,
          });
          setStudents([]);
          setPlacementResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPlacementLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    if (filter === "all") return students;
    if (filter === "needs_attention") {
      return students.filter((s) => s.needsAttention);
    }
    if (filter === "active_today") {
      return students.filter((s) => s.activeToday);
    }
    if (filter.startsWith("cefr:")) {
      const level = filter.replace("cefr:", "");
      return students.filter((s) => s.cefrLevel === level);
    }
    return students;
  }, [students, filter]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
          <header>
            <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
              Teacher Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Overview of your IELTS students and their progress
            </p>
          </header>

          {error ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Could not load student data. Check Supabase connection and try again.
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total students"
              value={loading ? "…" : String(overview?.totalStudents ?? 0)}
              accent="navy"
            />
            <StatCard
              label="Tests today"
              value={loading ? "…" : String(overview?.testsToday ?? 0)}
              accent="teal"
            />
            <StatCard
              label="Average band score"
              value={
                loading
                  ? "…"
                  : overview?.averageBandScore != null
                    ? overview.averageBandScore.toFixed(1)
                    : "—"
              }
              accent="gold"
            />
            <StatCard
              label="Inactive 3+ days"
              value={
                loading ? "…" : String(overview?.inactiveStudents3PlusDays ?? 0)
              }
              accent="alert"
            />
          </div>

          <section className="mt-10 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-[#0d1b35]">Student roster</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <FilterButton
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  All Students
                </FilterButton>
                <FilterButton
                  active={filter === "needs_attention"}
                  onClick={() => setFilter("needs_attention")}
                >
                  Needs Attention
                </FilterButton>
                <FilterButton
                  active={filter === "active_today"}
                  onClick={() => setFilter("active_today")}
                >
                  Active Today
                </FilterButton>
                <select
                  value={filter.startsWith("cefr:") ? filter : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFilter(v ? (`cefr:${v}` as FilterId) : "all");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#0d1b35] focus:border-[#c9972c] focus:outline-none focus:ring-1 focus:ring-[#c9972c]"
                >
                  <option value="">By CEFR Level</option>
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Student</th>
                    <th className="px-4 py-3">CEFR</th>
                    <th className="px-4 py-3">Writing</th>
                    <th className="px-4 py-3">Speaking</th>
                    <th className="px-4 py-3">Reading</th>
                    <th className="px-4 py-3">Listening</th>
                    <th className="px-4 py-3">Vocab %</th>
                    <th className="px-4 py-3">Last active</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        Loading students…
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        No students match this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                          student.needsAttention ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#0d1b35]">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-[#c9972c]/15 px-2.5 py-0.5 text-xs font-semibold text-[#c9972c]">
                            {student.cefrLevel}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-[#0d1b35]">
                          {formatBand(student.writingBand)}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#0d1b35]">
                          {formatBand(student.speakingBand)}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#0d1b35]">
                          {formatBand(student.readingBand)}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#0d1b35]">
                          {formatBand(student.listeningBand)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#0d9488]"
                                style={{ width: `${student.vocabularyPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">
                              {student.vocabularyPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {student.lastActiveLabel}
                          {student.needsAttention ? (
                            <span className="mt-0.5 block text-xs font-semibold text-red-600">
                              Needs attention
                            </span>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/teacher/student/${student.id}`}
                            className="inline-block rounded-lg bg-[#0d1b35] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#152a4d]"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#0d1b35]">
              Student Placement Results
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Completed adaptive placement tests
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Band</th>
                    <th className="px-4 py-3">CEFR</th>
                    <th className="px-4 py-3">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {placementLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Loading placement results…
                      </td>
                    </tr>
                  ) : placementResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No completed placement tests yet.
                      </td>
                    </tr>
                  ) : (
                    placementResults.map((row) => (
                      <tr key={row.attemptId} className="hover:bg-slate-50/80">
                        <td className="px-4 py-4 font-medium text-[#0d1b35]">
                          {row.name}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{row.email}</td>
                        <td className={`px-4 py-4 ${bandRowClass(row.overallBand)}`}>
                          {row.overallBand != null
                            ? row.overallBand.toFixed(1)
                            : "—"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{row.cefrLevel}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {row.completedAtLabel}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-[#0d1b35] text-white"
          : "border border-slate-200 bg-white text-[#0d1b35] hover:border-[#c9972c]"
      }`}
    >
      {children}
    </button>
  );
}
