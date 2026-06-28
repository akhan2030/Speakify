"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import {
  MOCK_SECTION_COUNTS,
  MOCK_SECTION_MINUTES,
  MOCK_SECTION_NAMES,
  MOCK_SECTION_WEIGHTS,
} from "@/lib/step/mockExam/constants";
import type { MockHistoryRow } from "@/lib/step/mockExam/types";

const CHECKLIST = [
  "I am in a quiet place with no distractions",
  "I have 2 hours and 30 minutes available right now",
  "My headphones or speakers are working (for Listening)",
  "My internet connection is stable",
  "I understand the exam cannot be paused",
];

const NAVY = "#0d1b35";
const GOLD = "#c9972c";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export default function StepMockTestLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [mocks, setMocks] = useState<MockHistoryRow[]>([]);
  const [nextMockNumber, setNextMockNumber] = useState(1);
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));

  useEffect(() => {
    fetch("/api/step/mock/history")
      .then((r) => r.json())
      .then((json) => {
        setMocks(json.mocks ?? []);
        setNextMockNumber(json.nextMockNumber ?? 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allChecked = checked.every(Boolean);

  const toggleCheck = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleStart = async () => {
    if (!allChecked || starting) return;
    setStarting(true);
    try {
      const res = await fetch("/api/step/mock/start", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start mock");
      sessionStorage.setItem(
        `step-mock-${json.attemptId}`,
        JSON.stringify({
          attemptId: json.attemptId,
          mockNumber: json.mockNumber,
          questions: json.questions,
        })
      );
      router.push("/dashboard/step/student/mock-test/exam");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start");
      setStarting(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: NAVY }}>
          STEP Full Mock Exam
        </h1>
        <p className="mt-2 text-slate-600">
          Complete simulation of the real Qiyas STEP test
        </p>
        <p className="mt-1 text-sm font-medium text-[#0d9488]">
          100 questions · 150 minutes · Auto-scored instantly
        </p>
      </header>

      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900">⚠ Important exam rules — read before starting:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-amber-900">
          <li>• The exam cannot be paused once started</li>
          <li>• Listening audio plays ONCE only — just like the real exam</li>
          <li>• You can navigate between questions within each section</li>
          <li>• The exam auto-submits when the timer reaches zero</li>
          <li>• Your score is saved automatically on completion</li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>
          Readiness checklist
        </h2>
        <ul className="mt-4 space-y-3">
          {CHECKLIST.map((label, i) => (
            <li key={label}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggleCheck(i)}
                  className="mt-0.5"
                />
                <span>{label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Score Weight</th>
              <th className="px-4 py-3">Time (approx)</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SECTION_NAMES.map((name, i) => (
              <tr key={name} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>
                  {name}
                </td>
                <td className="px-4 py-3">{MOCK_SECTION_COUNTS[i]}</td>
                <td className="px-4 py-3">{MOCK_SECTION_WEIGHTS[i]}</td>
                <td className="px-4 py-3">{MOCK_SECTION_MINUTES[i]} min</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold" style={{ color: NAVY }}>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3">100</td>
              <td className="px-4 py-3">100%</td>
              <td className="px-4 py-3">~150 min</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>
          Mock history
        </h2>
        {mocks.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            No mock exams completed yet — start your first mock below
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-500">
                  <th className="py-2 pr-4">Mock #</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Reading</th>
                  <th className="py-2 pr-4">Structure</th>
                  <th className="py-2 pr-4">Listening</th>
                  <th className="py-2 pr-4">Comp</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2">Phase</th>
                </tr>
              </thead>
              <tbody>
                {mocks.map((m) => (
                  <tr key={m.mock_number} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium">
                      #{String(m.mock_number).padStart(2, "0")}
                    </td>
                    <td className="py-2 pr-4">{formatDate(m.completed_at)}</td>
                    <td className="py-2 pr-4">{m.reading_score ?? "—"}/40</td>
                    <td className="py-2 pr-4">{m.structure_score ?? "—"}/30</td>
                    <td className="py-2 pr-4">{m.listening_score ?? "—"}/20</td>
                    <td className="py-2 pr-4">{m.compositional_score ?? "—"}/10</td>
                    <td className="py-2 pr-4 font-semibold">{m.total_score ?? "—"}/100</td>
                    <td className="py-2">{m.phase ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!allChecked || starting}
        onClick={handleStart}
        className="rounded-xl px-8 py-4 text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: allChecked ? GOLD : "#94a3b8", color: allChecked ? NAVY : "white" }}
      >
        {starting
          ? "Starting…"
          : `Start Mock Exam #${String(nextMockNumber).padStart(2, "0")} →`}
      </button>

      <Link
        href="/dashboard/step/student"
        className="ml-4 inline-block text-sm font-semibold text-[#0d9488]"
      >
        ← Return to Dashboard
      </Link>
    </div>
  );
}
