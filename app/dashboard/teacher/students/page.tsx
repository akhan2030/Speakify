"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  cefrLevel: string;
  readingBand: number | null;
  listeningBand: number | null;
  lastActiveLabel: string;
  needsAttention: boolean;
};

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher/students");
        const json = await res.json();
        setStudents(json.students ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header>
        <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">My Students</h1>
        <p className="mt-2 text-sm text-slate-500">
          View and open individual student profiles
        </p>
      </header>

      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-4 py-3">CEFR</th>
                <th className="px-4 py-3">Reading</th>
                <th className="px-4 py-3">Listening</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                      s.needsAttention ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0d1b35]">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#c9972c]/15 px-2 py-0.5 text-xs font-semibold text-[#c9972c]">
                        {s.cefrLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4">{formatBand(s.readingBand)}</td>
                    <td className="px-4 py-4">{formatBand(s.listeningBand)}</td>
                    <td className="px-4 py-4 text-slate-600">{s.lastActiveLabel}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/teacher/student/${s.id}`}
                        className="rounded-lg bg-[#0d1b35] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#152a4d]"
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
