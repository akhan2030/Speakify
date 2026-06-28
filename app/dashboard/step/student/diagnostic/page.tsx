"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StepMcqRunner from "@/components/step/StepMcqRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";
import type { StepMcqOption } from "@/lib/step/types";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";

type DiagnosticResult = {
  score: number;
  startingPhase: number;
  phaseTitle: string;
  targetScore: number;
  weeksToTarget: number;
};

export default function StepDiagnosticPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [questions, setQuestions] = useState<
    Array<{
      id: string;
      number: number;
      stem: string;
      options: Record<StepMcqOption, string>;
      section?: string;
      passage?: string;
      passageTitle?: string;
      transcript?: string;
      recordingId?: string;
      recordingNumber?: number;
      correct?: StepMcqOption;
      explanation?: string;
    }>
  >([]);
  const [timeLimit, setTimeLimit] = useState(45);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/step/diagnostic");
      const json = await res.json();
      if (json.completed) {
        setAlreadyDone(true);
      } else {
        setQuestions(json.questions ?? []);
        setTimeLimit(json.timeLimitMinutes ?? 45);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageSpinner />;

  if (alreadyDone && !result) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-bold" style={{ color: NAVY }}>
          Diagnostic already completed
        </p>
        <button
          type="button"
          onClick={() => router.push(STEP_ROUTES.home)}
          className="mt-4 rounded-xl px-6 py-2 text-sm font-semibold text-[#0d1b35]"
          style={{ backgroundColor: GOLD }}
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg p-6 pb-24 md:p-10">
        <div
          className="rounded-2xl p-8 text-center text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${NAVY}, #152a4d)` }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
            Diagnostic complete
          </p>
          <p className="mt-4 text-4xl font-extrabold tabular-nums">
            Your diagnostic score: {result.score}/100
          </p>
          <p className="mt-6 text-lg font-bold text-[#c9972c]">
            You are placed in Phase {result.startingPhase} — {result.phaseTitle}
          </p>
          <p className="mt-3 text-sm text-white/80">
            Your target: reach {result.targetScore}+ in {result.weeksToTarget} weeks
          </p>
          <Link
            href={STEP_ROUTES.home}
            className="mt-8 inline-block rounded-xl px-6 py-3 text-sm font-bold text-[#0d1b35]"
            style={{ backgroundColor: GOLD }}
          >
            Start Phase {result.startingPhase} →
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          All questions scored automatically · MCQ only · No speaking or writing
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-bold" style={{ color: NAVY }}>
          STEP Diagnostic Test
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          40 questions · 10 Reading + 10 Structure + 10 Listening + 10 Compositional
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Timed: {timeLimit} minutes · 4 options (A–D) · Sets your starting phase
        </p>
      </div>
      <StepMcqRunner
        title="STEP Diagnostic"
        subtitle={`${questions.length} questions · ${timeLimit} minutes`}
        questions={questions}
        timeLimitMinutes={timeLimit}
        submitLabel="Finish diagnostic"
        suppressResults
        onSubmit={async ({ answers }) => {
          const res = await fetch("/api/step/diagnostic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);

          setResult({
            score: json.score,
            startingPhase: json.startingPhase,
            phaseTitle: json.phaseTitle,
            targetScore: json.targetScore,
            weeksToTarget: json.weeksToTarget,
          });

          return {
            correct: json.correct,
            attempted: json.total,
            score: json.score,
          };
        }}
      />
    </div>
  );
}
