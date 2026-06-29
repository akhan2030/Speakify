"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import {
  practicePathForSection,
  weakestMiniSection,
} from "@/lib/step/miniMock/grading";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type Result = {
  mockNumber: number;
  totalRaw: number;
  estimatedStepScore: number;
  readingRaw: number;
  structureRaw: number;
  listeningRaw: number;
  compositionalRaw: number;
  improvement: number | null;
  previousMockNumber: number | null;
  results: Array<{
    id: string;
    section: string;
    stem: string;
    chosen: string | null;
    correct: string;
    isCorrect: boolean;
    explanation: string;
    options: Record<string, string>;
  }>;
};

function pctColor(pct: number) {
  if (pct >= 75) return "#059669";
  if (pct >= 60) return GOLD;
  return "#dc2626";
}

function SectionReview({
  title,
  items,
}: {
  title: string;
  items: Result["results"];
}) {
  const [open, setOpen] = useState(false);
  const wrong = items.filter((r) => !r.isCorrect);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold"
        style={{ color: NAVY }}
      >
        {title}
        <span className="text-sm text-slate-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="space-y-4 border-t border-slate-100 px-4 py-3 text-sm">
          {items.map((r) => (
            <li key={r.id} className="border-b border-slate-50 pb-3 last:border-0">
              <p className="text-slate-800">{r.stem}</p>
              <p className={r.isCorrect ? "text-green-600" : "text-red-600"}>
                Your answer: {r.chosen ?? "—"} {r.isCorrect ? "✓" : "✗"}
              </p>
              {!r.isCorrect && (
                <p className="mt-1 text-slate-600">
                  Correct: <strong>{r.correct}</strong> — {r.explanation}
                </p>
              )}
            </li>
          ))}
          {wrong.length === 0 && (
            <li className="text-green-600">All correct in this section!</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function MiniMockResultsContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const raw = sessionStorage.getItem(`step-mini-result-${attemptId}`);
    if (raw) setResult(JSON.parse(raw));
  }, [attemptId]);

  if (!attemptId) {
    return (
      <p className="p-8">
        No results.{" "}
        <Link href="/dashboard/step/student/mini-mock" style={{ color: GOLD }}>
          Start a mini mock
        </Link>
      </p>
    );
  }

  if (!result) return <PageSpinner />;

  const weak = weakestMiniSection(result);
  const sections = [
    { key: "reading", label: "Reading", raw: result.readingRaw },
    { key: "structure", label: "Structure", raw: result.structureRaw },
    { key: "listening", label: "Listening", raw: result.listeningRaw },
    {
      key: "compositional_analysis",
      label: "Compositional",
      raw: result.compositionalRaw,
    },
  ];

  const bySection = (section: string) =>
    result.results.filter((r) => r.section === section);

  const perfLabel =
    result.estimatedStepScore >= 80
      ? "🏆 Excellence level"
      : result.estimatedStepScore >= 65
        ? "✅ University ready pace"
        : result.estimatedStepScore >= 50
          ? "📈 Developing"
          : "📚 Keep building";

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 pb-24 md:p-8">
      <section className="rounded-2xl p-8 text-center text-white" style={{ background: NAVY }}>
        <p className="text-5xl font-extrabold tabular-nums">
          {result.totalRaw} / 20
        </p>
        <p className="mt-3 text-xl" style={{ color: GOLD }}>
          Estimated STEP score: ~{result.estimatedStepScore}/100
        </p>
        <p className="mt-2 text-sm text-white/80">{perfLabel}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => {
          const pct = Math.round((s.raw / 5) * 100);
          return (
            <div key={s.key} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-xs font-bold uppercase text-slate-400">{s.label}</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: pctColor(pct) }}>
                {s.raw}/5
              </p>
              <p className="text-sm text-slate-500">{pct}%</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="font-bold" style={{ color: NAVY }}>
          Question review
        </h2>
        <SectionReview title="Reading" items={bySection("reading")} />
        <SectionReview title="Structure" items={bySection("structure")} />
        <SectionReview title="Listening" items={bySection("listening")} />
        <SectionReview title="Compositional" items={bySection("compositional_analysis")} />
      </div>

      {result.improvement != null && result.previousMockNumber != null && (
        <p className="text-center text-sm text-slate-600">
          vs Mini Mock #{String(result.previousMockNumber).padStart(2, "0")}:{" "}
          {result.improvement >= 0 ? (
            <span className="text-green-600">+{result.improvement} improvement ↑</span>
          ) : (
            <span className="text-red-600">{result.improvement} ↓</span>
          )}
        </p>
      )}

      <div className="rounded-xl bg-amber-50 p-4 text-sm text-slate-700">
        <p>
          Your weakest section today: <strong>{weak.label}</strong> ({weak.raw}/5 — {weak.pct}%)
        </p>
        <p className="mt-2">
          Recommended: Complete 2 {weak.label.toLowerCase()} practice sessions before next mini
          mock
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">
          Your mini mock score is scaled to estimate your full STEP score.
        </p>
        <p className="mt-2">
          Reading (÷5×40) + Structure (÷5×30) + Listening (÷5×20) + Compositional (÷5×10) = estimated
          total. This is an approximation — full mock exams give the most accurate prediction.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/step/student/mini-mock"
          className="rounded-xl px-6 py-3 text-sm font-bold text-[#0d1b35]"
          style={{ background: GOLD }}
        >
          Start another mini mock →
        </Link>
        <Link
          href="/dashboard/step/student/progress"
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-medium"
          style={{ color: NAVY }}
        >
          View full progress →
        </Link>
        <Link
          href={practicePathForSection(weak.id)}
          className="rounded-xl border-2 px-6 py-3 text-sm font-semibold"
          style={{ borderColor: TEAL, color: TEAL }}
        >
          Practice {weak.label} →
        </Link>
      </div>
    </div>
  );
}
