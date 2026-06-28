"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import StepSectionTopBar, {
  type SectionProgress,
  STEP_GOLD,
  STEP_NAVY,
  STEP_TEAL,
} from "./StepSectionTopBar";
import TypeAccuracyChart from "./TypeAccuracyChart";
import type { StepMcqOption } from "@/lib/step/types";
import { accuracyPercent } from "@/lib/step/practiceScoreUtils";
import { STEP_STUDENT_BASE } from "@/lib/step/paths";

type ClientQuestion = {
  id: string;
  stem: string;
  questionType: string;
  options: Record<StepMcqOption, string>;
};

type GradedResult = {
  id: string;
  chosen: StepMcqOption | null;
  correct: StepMcqOption;
  isCorrect: boolean;
  explanation: string;
  questionType?: string;
};

type Payload = {
  passage: { id: string; title: string; text: string };
  questions: ClientQuestion[];
  progress: SectionProgress;
  weightPercent: number;
  label: string;
};

const OPTS: StepMcqOption[] = ["A", "B", "C", "D"];

export default function StepReadingPractice() {
  const [passageOffset, setPassageOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [answers, setAnswers] = useState<Record<string, StepMcqOption>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [graded, setGraded] = useState<GradedResult[]>([]);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [typeStats, setTypeStats] = useState<Record<string, { correct: number; total: number }>>(
    {}
  );
  const [progress, setProgress] = useState<SectionProgress | null>(null);

  const loadPassage = useCallback(async (offset: number) => {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    setGraded([]);
    const res = await fetch(
      `/api/step/questions?section=reading&limit=8&passageOffset=${offset}`
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load");
    setPayload(json);
    setProgress(json.progress);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPassage(passageOffset).catch(() => setLoading(false));
  }, [loadPassage, passageOffset]);

  const questions = payload?.questions ?? [];
  const allAnswered = questions.length > 0 && Object.keys(answers).length >= questions.length;

  const gradedById = useMemo(() => {
    const map = new Map<string, GradedResult>();
    for (const g of graded) map.set(g.id, g);
    return map;
  }, [graded]);

  const handleSubmit = async () => {
    if (!payload) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/step/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "reading", answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const results = (json.results ?? []) as GradedResult[];
      setGraded(results);
      setSessionCorrect(json.sessionCorrect ?? 0);
      setSubmitted(true);

      const nextStats = { ...typeStats };
      for (const q of questions) {
        const g = results.find((r) => r.id === q.id);
        const key = q.questionType || "general";
        if (!nextStats[key]) nextStats[key] = { correct: 0, total: 0 };
        nextStats[key].total += 1;
        if (g?.isCorrect) nextStats[key].correct += 1;
      }
      setTypeStats(nextStats);

      if (json.today) {
        setProgress((p) =>
          p
            ? {
                ...p,
                questionsAttemptedToday: json.today.questionsAttempted,
                questionsCorrectToday: json.today.questionsCorrect,
                estimatedSectionScore: json.today.estimatedScore,
              }
            : p
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !payload) return <PageSpinner />;

  const chartEntries = Object.entries(typeStats).map(([label, v]) => ({
    label,
    correct: v.correct,
    total: v.total,
  }));

  const todayAttempted = progress?.questionsAttemptedToday ?? payload.progress.questionsAttemptedToday;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <StepSectionTopBar
        label="Reading Comprehension"
        weightPercent={payload.weightPercent}
        progress={progress ?? payload.progress}
      />

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold" style={{ color: STEP_NAVY }}>
          {payload.passage.title}
        </h2>
        <div
          className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-slate-700"
          style={{ lineHeight: 1.75 }}
        >
          {payload.passage.text}
        </div>
      </article>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const g = gradedById.get(q.id);
          const showResult = submitted && g;
          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 ${
                showResult
                  ? g.isCorrect
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold" style={{ color: STEP_NAVY }}>
                {showResult ? (g.isCorrect ? "✅" : "❌") : null} Question {i + 1}. {q.stem}
              </p>
              <div className="mt-3 space-y-2">
                {OPTS.map((letter) => (
                  <label
                    key={letter}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      submitted
                        ? "cursor-default opacity-90"
                        : answers[q.id] === letter
                          ? "border-teal-400 bg-teal-50"
                          : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      disabled={submitted}
                      checked={answers[q.id] === letter}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: letter }))
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <strong>{letter}.</strong> {q.options[letter]}
                    </span>
                  </label>
                ))}
              </div>
              {showResult && !g.isCorrect ? (
                <p className="mt-3 text-sm text-slate-700">
                  <strong>Correct answer: {g.correct}</strong> — {g.explanation}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          disabled={!allAnswered || submitting}
          onClick={handleSubmit}
          className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: STEP_TEAL }}
        >
          {submitting ? "Submitting…" : "Submit answers"}
        </button>
      ) : (
        <div
          className="rounded-xl p-4 text-white"
          style={{ backgroundColor: STEP_NAVY }}
        >
          <p className="text-lg font-bold">
            {sessionCorrect}/{questions.length} correct —{" "}
            {accuracyPercent(sessionCorrect, questions.length)}%
          </p>
          <button
            type="button"
            onClick={() => setPassageOffset((n) => n + 1)}
            className="mt-3 rounded-lg px-4 py-2 text-sm font-bold"
            style={{ backgroundColor: STEP_GOLD, color: STEP_NAVY }}
          >
            Next Passage →
          </button>
        </div>
      )}

      <footer className="space-y-4 border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-600">
          <strong>{todayAttempted}</strong> reading questions answered today
        </p>
        {chartEntries.length > 0 ? (
          <TypeAccuracyChart entries={chartEntries} />
        ) : null}
        <Link
          href={STEP_STUDENT_BASE}
          className="inline-block text-sm font-semibold"
          style={{ color: STEP_TEAL }}
        >
          ← Return to Dashboard
        </Link>
      </footer>
    </div>
  );
}
