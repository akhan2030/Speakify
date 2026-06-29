"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { EXIT_TEST_COOLDOWN_DAYS } from "@/lib/step/exitTest/constants";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";

type Result = {
  passed: boolean;
  phase: number;
  threshold: number;
  totalScore: number;
  sectionBreakdown: Record<string, string>;
  gapAnalysis?: {
    pointsNeeded: number;
    sections: Array<{
      label: string;
      got: number;
      needed: number;
      pointsShort: number;
      passed: boolean;
    }>;
  };
  recommendations?: string[];
  nextPhase?: { phase: number; title: string };
};

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute animate-bounce text-2xl"
          style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 23) % 60}%`,
            animationDelay: `${(i % 5) * 0.15}s`,
          }}
        >
          {["🎉", "✨", "🏆", "⭐"][i % 4]}
        </span>
      ))}
    </div>
  );
}

export default function ExitTestResultsContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const raw = sessionStorage.getItem(`step-exit-result-${attemptId}`);
    if (raw) {
      setResult(JSON.parse(raw));
    }
  }, [attemptId]);

  if (!attemptId) {
    return (
      <p className="p-8 text-slate-600">
        No results found.{" "}
        <Link href="/dashboard/step/student/exit-test" style={{ color: GOLD }}>
          Return to exit test
        </Link>
      </p>
    );
  }

  if (!result) return <PageSpinner />;

  const retakeDate = new Date();
  retakeDate.setDate(retakeDate.getDate() + EXIT_TEST_COOLDOWN_DAYS);

  if (result.passed) {
    return (
      <div className="relative mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <Confetti />
        <div className="text-center">
          <p className="text-6xl">✅</p>
          <h1 className="mt-4 text-3xl font-bold text-green-700">
            Phase {result.phase} Complete! 🎉
          </h1>
          <p className="mt-2 text-lg text-slate-700">
            Score: {result.totalScore}/100 — Pass threshold was {result.threshold}/100
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm">
          <p>
            Reading {result.sectionBreakdown.reading} | Structure{" "}
            {result.sectionBreakdown.structure} | Listening {result.sectionBreakdown.listening} |
            Compositional {result.sectionBreakdown.compositional}
          </p>
        </div>

        {result.nextPhase && (
          <div className="rounded-xl bg-teal-50 p-5 text-center">
            <p className="font-semibold" style={{ color: NAVY }}>
              Phase {result.nextPhase.phase} — {result.nextPhase.title} is now unlocked
            </p>
            <p className="mt-1 text-sm text-slate-600">
              You can begin immediately or take a short break first
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard/step/student"
                className="rounded-lg px-6 py-3 text-sm font-semibold text-white"
                style={{ background: GOLD }}
              >
                Start Phase {result.nextPhase.phase} →
              </Link>
              <Link
                href="/dashboard/step/student/progress"
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium"
                style={{ color: NAVY }}
              >
                View my progress
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div className="text-center">
        <p className="text-6xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-bold text-amber-700">
          Not quite this time — you needed {result.threshold} to pass
        </h1>
        <p className="mt-2 text-lg text-slate-700">Your score: {result.totalScore}/100</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm">
        Reading {result.sectionBreakdown.reading} | Structure {result.sectionBreakdown.structure} |
        Listening {result.sectionBreakdown.listening} | Compositional{" "}
        {result.sectionBreakdown.compositional}
      </div>

      {result.gapAnalysis && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="font-semibold" style={{ color: NAVY }}>
            You needed {result.gapAnalysis.pointsNeeded} more points. Here is where they were lost:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {result.gapAnalysis.sections.map((s) => (
              <li key={s.label}>
                {s.passed ? (
                  <span className="text-green-600">{s.label}: passed ✅</span>
                ) : (
                  <span>
                    {s.label}: got {s.got}/10, needed {s.needed}/10 — {s.pointsShort} points short
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="font-semibold" style={{ color: NAVY }}>
            Focus this week on:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {result.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-center text-sm text-slate-600">
        You can retake this exit test in {EXIT_TEST_COOLDOWN_DAYS} days —{" "}
        {retakeDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="text-center">
        <Link
          href="/dashboard/step/student/reading"
          className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
          style={{ background: NAVY }}
        >
          Return to Phase {result.phase} practice →
        </Link>
      </div>
    </div>
  );
}
