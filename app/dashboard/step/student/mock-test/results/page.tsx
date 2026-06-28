"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import type { StepSectionId } from "@/lib/step/examModel";
import {
  MOCK_SECTION_ORDER,
} from "@/lib/step/mockExam/constants";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type ResultItem = {
  id: string;
  section: StepSectionId;
  stem: string;
  options: Record<string, string>;
  chosen: string | null;
  correct: string;
  isCorrect: boolean;
  explanation: string;
  grammarPoint?: string;
};

type ResultsData = {
  mockNumber: number;
  readingScore: number;
  structureScore: number;
  listeningScore: number;
  compositionalScore: number;
  totalScore: number;
  durationMinutes: number;
  results: ResultItem[];
  weakestSection: StepSectionId;
  weakestSectionName: string;
  weakestPracticePath: string;
};

const SECTION_LABELS: Record<StepSectionId, string> = {
  reading: "Reading",
  structure: "Structure",
  listening: "Listening",
  compositional_analysis: "Compositional",
};

function performanceBadge(score: number) {
  if (score >= 80) return { label: "🏆 Excellence — Top Performance", bg: TEAL };
  if (score >= 65) return { label: "✅ Competitive — University Ready", bg: GOLD };
  if (score >= 50) return { label: "📈 Developing — Keep Practising", bg: "#888" };
  return { label: "📚 Foundation — More Study Needed", bg: "#ef4444" };
}

function focusTips(section: StepSectionId, scores: ResultsData) {
  if (section === "reading") {
    return (
      <>
        <p>
          Your Reading score ({scores.readingScore}/40) is your biggest improvement opportunity.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Practice 3 reading passages this week</li>
          <li>Focus on vocabulary in context questions</li>
          <li>Review inference question strategies</li>
        </ul>
      </>
    );
  }
  if (section === "structure") {
    return (
      <>
        <p>
          Your Structure score ({scores.structureScore}/30) needs the most attention.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Complete 20 grammar drills daily</li>
          <li>Focus on subject-verb agreement</li>
          <li>Review conditional sentence structures</li>
        </ul>
      </>
    );
  }
  if (section === "listening") {
    return (
      <>
        <p>
          Your Listening score ({scores.listeningScore}/20) is your priority focus area.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Practice with single-play audio only</li>
          <li>Drill numbers, dates, and times</li>
          <li>Review idiom and attitude questions</li>
        </ul>
      </>
    );
  }
  return (
    <>
      <p>
        Your Compositional score ({scores.compositionalScore}/10) has the most room to grow.
      </p>
      <ul className="mt-2 list-inside list-disc text-sm">
        <li>Practice punctuation and word order daily</li>
        <li>Review sentence combining connectors</li>
        <li>Study error-identification patterns</li>
      </ul>
    </>
  );
}

export default function StepMockResultsPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const [data, setData] = useState<ResultsData | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    reading: true,
    structure: false,
    listening: false,
    compositional_analysis: false,
  });

  useEffect(() => {
    if (!attemptId) return;
    fetch(`/api/step/mock/results/${attemptId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(() => setData(null));
  }, [attemptId]);

  const bySection = useMemo(() => {
    if (!data) return {} as Record<StepSectionId, ResultItem[]>;
    const map: Record<string, ResultItem[]> = {};
    for (const r of data.results) {
      if (!map[r.section]) map[r.section] = [];
      map[r.section].push(r);
    }
    return map as Record<StepSectionId, ResultItem[]>;
  }, [data]);

  if (!attemptId) {
    return (
      <p className="p-8 text-slate-500">
        No attempt specified.{" "}
        <Link href="/dashboard/step/student/mock-test" className="text-teal-600">
          Return to mock test
        </Link>
      </p>
    );
  }

  if (!data) return <PageSpinner />;

  const badge = performanceBadge(data.totalScore);
  const sections = [
    { label: "Reading", score: data.readingScore, max: 40, weight: "40%" },
    { label: "Structure", score: data.structureScore, max: 30, weight: "30%" },
    { label: "Listening", score: data.listeningScore, max: 20, weight: "20%" },
    { label: "Compositional", score: data.compositionalScore, max: 10, weight: "10%" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="rounded-2xl p-8 text-center text-white" style={{ background: NAVY }}>
        <p className="text-xs tracking-[2px] text-white/50">
          MOCK EXAM #{String(data.mockNumber).padStart(2, "0")} RESULTS
        </p>
        <p className="my-2 text-7xl font-bold leading-none text-[#c9972c]">{data.totalScore}</p>
        <p className="text-lg text-white">out of 100</p>
        <span
          className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-semibold text-white"
          style={{ background: badge.bg }}
        >
          {badge.label}
        </span>
        <p className="mt-3 text-sm text-white/70">
          Target: 80+ · Gap remaining: {Math.max(0, 80 - data.totalScore)} points ·{" "}
          {data.durationMinutes} min
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => {
          const pct = Math.round((s.score / s.max) * 100);
          const barColor = pct >= 75 ? TEAL : pct >= 60 ? GOLD : "#ef4444";
          return (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 bg-white p-5 text-center"
            >
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold" style={{ color: NAVY }}>
                {s.score}/{s.max}
              </p>
              <p className="text-sm" style={{ color: barColor }}>
                {pct}%
              </p>
              <div className="mt-2 h-1 rounded bg-slate-100">
                <div className="h-1 rounded" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Weight: {s.weight}</p>
            </div>
          );
        })}
      </div>

      {MOCK_SECTION_ORDER.map((sectionId) => {
        const items = bySection[sectionId] ?? [];
        const open = expanded[sectionId];
        return (
          <div key={sectionId} className="rounded-xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left font-bold"
              style={{ color: NAVY }}
              onClick={() =>
                setExpanded((e) => ({ ...e, [sectionId]: !e[sectionId] }))
              }
            >
              <span>
                {SECTION_LABELS[sectionId]} — Question Review ({items.length})
              </span>
              <span>{open ? "▲" : "▼"}</span>
            </button>
            {open && (
              <div className="mt-4 space-y-2">
                {items.map((q, i) => (
                  <div
                    key={q.id}
                    className="rounded-lg border p-3 text-sm"
                    style={{
                      background: q.isCorrect ? "#f0fdf4" : "#fef2f2",
                      borderColor: q.isCorrect ? TEAL : "#ef4444",
                    }}
                  >
                    <p className="font-semibold">
                      {q.isCorrect ? "✅" : "❌"} Q{i + 1}: {q.stem}
                    </p>
                    <p className="mt-1">
                      Your answer:{" "}
                      <strong style={{ color: q.isCorrect ? TEAL : "#ef4444" }}>
                        {q.chosen ?? "Not answered"}
                      </strong>
                    </p>
                    {!q.isCorrect && (
                      <>
                        <p className="text-[#0d9488]">
                          Correct answer: <strong>{q.correct}</strong> —{" "}
                          {q.options[q.correct]}
                        </p>
                        <p className="italic text-slate-600">{q.explanation}</p>
                        {q.grammarPoint ? (
                          <p className="mt-1 text-xs text-slate-500">Rule: {q.grammarPoint}</p>
                        ) : null}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-xl border border-[#c9972c] bg-amber-50 p-6">
        <h3 className="font-bold" style={{ color: NAVY }}>
          ⚠ Priority focus for next week
        </h3>
        <div className="mt-3 text-sm text-slate-700">
          {focusTips(data.weakestSection, data)}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/step/student"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-white no-underline"
          style={{ background: NAVY }}
        >
          Return to Dashboard
        </Link>
        <Link
          href="/dashboard/step/student/mock-test"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-white no-underline"
          style={{ background: GOLD }}
        >
          Start Next Mock →
        </Link>
        <Link
          href={data.weakestPracticePath}
          className="rounded-lg border-2 px-6 py-3 text-sm font-semibold no-underline"
          style={{ borderColor: TEAL, color: TEAL }}
        >
          Practice {data.weakestSectionName} →
        </Link>
      </div>
    </div>
  );
}
