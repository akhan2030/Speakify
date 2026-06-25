"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  writingBand: number | null;
  speakingBand: number | null;
  readingBand: number | null;
  listeningBand: number | null;
  compositeBand: number | null;
  readinessPercent: number | null;
  testsToday: number;
  lastActiveLabel: string;
  needsAttention: boolean;
};

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

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

export default function IeltsTeacherDashboardPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgBand, setAvgBand] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher/students?program=ielts");
        const data = await res.json();
        if (!cancelled && res.ok) {
          const roster = data.students ?? [];
          setStudents(roster);
          const bands = roster
            .map((s: StudentRow) => s.compositeBand)
            .filter((v: number | null) => v != null && Number.isFinite(v));
          setAvgBand(
            bands.length
              ? Math.round(
                  (bands.reduce((a: number, b: number) => a + b, 0) / bands.length) *
                    10
                ) / 10
              : null
          );
        }
      } catch {
        if (!cancelled) {
          setStudents([]);
          setAvgBand(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
            IELTS — Teacher Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            IELTS students only · band scores, mock activity, and readiness
          </p>
        </div>
        <Link
          href="/dashboard/teacher"
          className="text-sm font-semibold text-[#c9972c] hover:underline"
        >
          ← All students dashboard
        </Link>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="IELTS students"
          value={loading ? "…" : String(students.length)}
          accent="gold"
        />
        <StatCard
          label="Average band"
          value={loading ? "…" : avgBand != null ? avgBand.toFixed(1) : "—"}
          accent="gold"
        />
        <StatCard
          label="Tests today"
          value={
            loading
              ? "…"
              : String(students.reduce((sum, s) => sum + (s.testsToday ?? 0), 0))
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

      <section className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#0d1b35]">IELTS student roster</h2>
          <p className="mt-1 text-sm text-slate-500">
            Band scores per skill and readiness meter
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Student</th>
                <th className="px-4 py-3">Writing</th>
                <th className="px-4 py-3">Speaking</th>
                <th className="px-4 py-3">Reading</th>
                <th className="px-4 py-3">Listening</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Tests today</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Loading students…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No IELTS students found.
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
                    <td className="px-4 py-4 font-medium">{formatBand(student.writingBand)}</td>
                    <td className="px-4 py-4 font-medium">{formatBand(student.speakingBand)}</td>
                    <td className="px-4 py-4 font-medium">{formatBand(student.readingBand)}</td>
                    <td className="px-4 py-4 font-medium">{formatBand(student.listeningBand)}</td>
                    <td className="px-4 py-4">
                      {student.readinessPercent != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#c9972c]"
                              style={{ width: `${student.readinessPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {student.readinessPercent}%
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4">{student.testsToday ?? 0}</td>
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
