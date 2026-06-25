"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  bandColorClass,
  accuracyColorClass,
  trackerStatus,
} from "@/lib/readingScorer";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";

type Difficulty = "Easy" | "Medium" | "Hard";

type QuestionTypeRow = {
  slug: string;
  name: string;
  difficulty: Difficulty;
};

type TrackerRow = {
  question_type: string;
  attempts: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  accuracy: number | null;
  estimated_band: number | null;
};

const QUESTION_TYPES: QuestionTypeRow[] = [
  { slug: "multiple-choice", name: "Multiple Choice", difficulty: "Medium" },
  {
    slug: "true-false-not-given",
    name: "True / False / Not Given",
    difficulty: "Hard",
  },
  { slug: "matching-headings", name: "Matching Headings", difficulty: "Hard" },
  {
    slug: "matching-information",
    name: "Matching Information",
    difficulty: "Medium",
  },
  { slug: "matching-features", name: "Matching Features", difficulty: "Medium" },
  {
    slug: "matching-sentence-endings",
    name: "Matching Sentence Endings",
    difficulty: "Medium",
  },
  {
    slug: "sentence-completion",
    name: "Sentence Completion",
    difficulty: "Medium",
  },
  {
    slug: "summary-completion",
    name: "Summary Completion",
    difficulty: "Medium",
  },
  { slug: "note-completion", name: "Note Completion", difficulty: "Easy" },
  { slug: "short-answer", name: "Short Answer Questions", difficulty: "Easy" },
  {
    slug: "diagram-completion",
    name: "Diagram / Flowchart Completion",
    difficulty: "Hard",
  },
  { slug: "classification", name: "Classification", difficulty: "Medium" },
];

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

const ACCURACY_TEXT: Record<string, string> = {
  green: "text-green-600",
  amber: "text-amber-600",
  red: "text-red-600",
  gray: "text-slate-400",
};

const BAND_TEXT: Record<string, string> = {
  green: "text-green-600",
  amber: "text-amber-600",
  red: "text-red-600",
  gray: "text-slate-400",
};

const STATUS_CLASS: Record<string, string> = {
  "Not attempted": "text-slate-400",
  "Needs work": "text-red-600",
  Good: "text-amber-600",
  Excellent: "text-green-600",
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct * 10) / 10}%`;
}

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

type PassageHistoryRow = {
  questionType: string;
  label: string;
  count: number;
};

export default function ReadingTrackerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [trackerRows, setTrackerRows] = useState<TrackerRow[]>([]);
  const [passageHistory, setPassageHistory] = useState<PassageHistoryRow[]>([]);
  const [passageHistoryTotal, setPassageHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const studentId = (session?.user as { id?: string })?.id ?? "";

  const trackerMap = useMemo(() => {
    const map = new Map<string, TrackerRow>();
    for (const row of trackerRows) {
      map.set(normalizeSlug(row.question_type), row);
    }
    return map;
  }, [trackerRows]);

  const overallBand = useMemo(() => {
    const bands = trackerRows
      .map((row) => row.estimated_band)
      .filter((b): b is number => b !== null && Number.isFinite(b));
    if (bands.length === 0) return null;
    const avg = bands.reduce((sum, b) => sum + b, 0) / bands.length;
    return Math.round(avg * 2) / 2;
  }, [trackerRows]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [trackerRes, historyRes] = await Promise.all([
          fetch("/api/reading/tracker?all=true"),
          studentId
            ? fetch(
                `/api/reading/passage-history?studentId=${encodeURIComponent(studentId)}`
              )
            : Promise.resolve(null),
        ]);
        const data = await trackerRes.json().catch(() => null);
        const historyData = historyRes
          ? await historyRes.json().catch(() => null)
          : null;
        if (!cancelled && trackerRes.ok && Array.isArray(data?.rows)) {
          setTrackerRows(data.rows);
        }
        if (!cancelled && historyRes?.ok && historyData) {
          setPassageHistory(
            Array.isArray(historyData.rows) ? historyData.rows : []
          );
          setPassageHistoryTotal(Number(historyData.total) || 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, studentId]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="min-h-screen flex bg-white">
      <StudentSidebar activePage="reading" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header>
            <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
              My Reading Progress
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Track your performance across all question types
            </p>
          </header>

          <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                    Question Type
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                    Total Attempts
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                    Correct Answers
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                    Accuracy %
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                    Estimated Band
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0d1b35]" />
                </tr>
              </thead>
              <tbody>
                {QUESTION_TYPES.map((type) => {
                  const row = trackerMap.get(type.slug);
                  const attempts = row?.attempts ?? 0;
                  const notAttempted = !attempts || attempts <= 0;
                  const accuracy = row?.accuracy ?? null;
                  const band = row?.estimated_band ?? null;
                  const accTone = accuracyColorClass(accuracy);
                  const bandTone = bandColorClass(band);
                  const statusLabel = trackerStatus(accuracy, band, attempts);

                  if (notAttempted) {
                    return (
                      <tr
                        key={type.slug}
                        className="border-b border-dashed border-slate-200 bg-slate-50/50"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-500">
                            {type.name}
                          </div>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFFICULTY_CLASS[type.difficulty]}`}
                          >
                            {type.difficulty}
                          </span>
                        </td>
                        <td colSpan={5} className="px-4 py-4 text-slate-400 italic">
                          Not attempted yet
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/student/reading/practice/${type.slug}`}
                            className="inline-flex rounded-lg bg-[#c9972c] px-3 py-1.5 text-xs font-bold text-[#0d1b35] hover:bg-[#b8862b]"
                          >
                            Practice
                          </Link>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={type.slug} className="border-b border-slate-100">
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#0d1b35]">{type.name}</div>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFFICULTY_CLASS[type.difficulty]}`}
                        >
                          {type.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{attempts}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {row?.correct_answers ?? "—"}
                      </td>
                      <td
                        className={`px-4 py-4 font-semibold ${ACCURACY_TEXT[accTone]}`}
                      >
                        {formatPercent(accuracy)}
                      </td>
                      <td
                        className={`px-4 py-4 text-lg font-bold ${BAND_TEXT[bandTone]}`}
                      >
                        {formatBand(band)}
                      </td>
                      <td
                        className={`px-4 py-4 font-medium ${STATUS_CLASS[statusLabel]}`}
                      >
                        {statusLabel}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/student/reading/practice/${type.slug}`}
                          className="inline-flex rounded-lg bg-[#c9972c] px-3 py-1.5 text-xs font-bold text-[#0d1b35] hover:bg-[#b8862b]"
                        >
                          Practice
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading ? (
            <p className="mt-4 text-center text-sm text-slate-500">Loading…</p>
          ) : null}

          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0d1b35]">Passages Completed</h2>
            <p className="mt-1 text-sm text-slate-500">
              Unique passages you have seen, grouped by question type ({passageHistoryTotal}{" "}
              total)
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 font-semibold text-[#0d1b35]">Question Type</th>
                    <th className="pb-3 font-semibold text-[#0d1b35]">
                      Unique Passages Seen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {passageHistory.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-slate-500">
                        No passages completed yet. Start a practice or test session to build
                        your history.
                      </td>
                    </tr>
                  ) : (
                    passageHistory.map((row) => (
                      <tr
                        key={row.questionType}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 font-medium text-slate-700">{row.label}</td>
                        <td className="py-3 font-bold text-[#c9972c]">{row.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#0d1b35]">
              Overall Reading Band
            </p>
            <p className="mt-2 text-5xl font-extrabold text-[#c9972c]">
              {overallBand !== null ? formatBand(overallBand) : "—"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Average of all attempted question types
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
