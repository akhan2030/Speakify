"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CEFR_LEVELS } from "@/lib/vocabulary";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  cefrLevel: string;
  vocabularyPercent: number;
  lastActiveLabel: string;
  needsAttention: boolean;
  activeToday: boolean;
  lessonsCompletedThisWeek: number;
};

function StatCard({
  label,
  value,
  accent = "navy",
}: {
  label: string;
  value: string;
  accent?: "navy" | "teal" | "gold" | "alert";
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

export default function PathwayTeacherDashboardPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher/students?program=pathway");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setStudents(data.students ?? []);
        }
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const cefrBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const level of CEFR_LEVELS) counts.set(level, 0);
    for (const s of students) {
      counts.set(s.cefrLevel, (counts.get(s.cefrLevel) ?? 0) + 1);
    }
    return CEFR_LEVELS.map((level) => ({
      level,
      count: counts.get(level) ?? 0,
    })).filter((row) => row.count > 0);
  }, [students]);

  const totalLessonsThisWeek = useMemo(
    () => students.reduce((sum, s) => sum + (s.lessonsCompletedThisWeek ?? 0), 0),
    [students]
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
            English Pathway — Teacher Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Pathway students only · CEFR progress and weekly lesson activity
          </p>
        </div>
        <Link
          href="/dashboard/teacher"
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← All students dashboard
        </Link>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pathway students"
          value={loading ? "…" : String(students.length)}
          accent="teal"
        />
        <StatCard
          label="Lessons this week"
          value={loading ? "…" : String(totalLessonsThisWeek)}
          accent="gold"
        />
        <StatCard
          label="Active today"
          value={
            loading
              ? "…"
              : String(students.filter((s) => s.activeToday).length)
          }
        />
        <StatCard
          label="Needs attention"
          value={
            loading
              ? "…"
              : String(students.filter((s) => s.needsAttention).length)
          }
          accent="alert"
        />
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">Progress by CEFR level</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : cefrBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No pathway students yet.</p>
          ) : (
            cefrBreakdown.map((row) => (
              <div
                key={row.level}
                className="rounded-lg border border-[#0d9488]/20 bg-[#0d9488]/5 px-4 py-3"
              >
                <p className="text-xs text-slate-500">CEFR {row.level}</p>
                <p className="text-2xl font-bold text-[#0d9488]">{row.count}</p>
                <p className="text-xs text-slate-500">students</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#0d1b35]">Pathway student roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Student</th>
                <th className="px-4 py-3">CEFR</th>
                <th className="px-4 py-3">Lessons this week</th>
                <th className="px-4 py-3">Vocab %</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading students…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No pathway students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                      student.needsAttention ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0d1b35]">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#0d9488]/15 px-2.5 py-0.5 text-xs font-semibold text-[#0d9488]">
                        {student.cefrLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-[#0d1b35]">
                      {student.lessonsCompletedThisWeek ?? 0}
                    </td>
                    <td className="px-4 py-4">{student.vocabularyPercent}%</td>
                    <td className="px-4 py-4 text-slate-600">
                      {student.lastActiveLabel}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/teacher/student/${student.id}`}
                        className="inline-block rounded-lg bg-[#0d1b35] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#152a4d]"
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
    </div>
  );
}
