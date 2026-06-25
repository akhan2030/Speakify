"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Assignment = {
  id: string;
  studentId: string;
  studentName: string;
  module: string;
  taskDescription: string;
  dueDate: string;
  dueDateLabel: string;
  status: string;
};

type StudentOption = { id: string; name: string };

const MODULES = ["Writing", "Speaking", "Reading", "Listening", "Vocabulary"] as const;

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    submitted: "bg-[#0d9488]/15 text-[#0d9488]",
    graded: "bg-[#c9972c]/20 text-[#c9972c]",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function TeacherHomeworkPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [module, setModule] = useState<(typeof MODULES)[number]>("Reading");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hwRes, studentsRes] = await Promise.all([
        fetch("/api/teacher/homework"),
        fetch("/api/teacher/students"),
      ]);
      const hwJson = await hwRes.json();
      const studentsJson = await studentsRes.json();
      setAssignments(hwJson.assignments ?? []);
      setTableMissing(Boolean(hwJson.tableMissing));
      setStudents(
        (studentsJson.students ?? []).map(
          (s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          })
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignHomework = async () => {
    if (!studentId || !taskDescription.trim() || !dueDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          module,
          taskDescription: taskDescription.trim(),
          dueDate,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setModalOpen(false);
      setStudentId("");
      setTaskDescription("");
      setDueDate("");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not assign homework");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0d1b35]">Homework</h1>
              <p className="mt-1 text-sm text-slate-600">
                Assign and track student tasks across all modules
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
            >
              Assign New Homework
            </button>
          </div>

          {tableMissing ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Run <code className="text-xs">supabase/teacher_homework_tables.sql</code> in
              the Supabase SQL editor to enable homework.
            </p>
          ) : null}

          <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Student</th>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Due date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        Loading…
                      </td>
                    </tr>
                  ) : assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No homework assigned yet.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/teacher/student/${row.studentId}`}
                            className="font-semibold text-[#0d9488] hover:underline"
                          >
                            {row.studentName}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500">{row.module}</p>
                        </td>
                        <td className="max-w-md px-4 py-4 text-slate-600">
                          <p className="line-clamp-2">{row.taskDescription}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {row.dueDateLabel}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
    </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#0d1b35]">Assign new homework</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Student
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d1b35]"
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Module
              <select
                value={module}
                onChange={(e) =>
                  setModule(e.target.value as (typeof MODULES)[number])
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Task description
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Complete one timed reading passage on True/False/Not Given…"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={assignHomework}
                disabled={submitting || !studentId || !taskDescription.trim() || !dueDate}
                className="rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-bold text-white hover:bg-[#152a4d] disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
