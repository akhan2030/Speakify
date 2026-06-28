"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StepMcqOption } from "@/lib/step/types";

export type StepRunnerQuestion = {
  id: string;
  number?: number;
  stem: string;
  options: Record<StepMcqOption, string>;
  correct?: StepMcqOption;
  explanation?: string;
  section?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  questions: StepRunnerQuestion[];
  timeLimitMinutes?: number;
  submitLabel?: string;
  onSubmit: (payload: {
    answers: Record<string, StepMcqOption>;
    answerKey: Record<string, StepMcqOption>;
    durationMinutes: number;
  }) => Promise<{
    correct: number;
    attempted: number;
    sectionScore?: number;
    estimatedTotal?: number;
    phaseAdvanced?: boolean;
    newPhase?: number;
    score?: number;
    startingPhase?: number;
  }>;
  onComplete?: (result: unknown) => void;
  /** When true, parent handles results UI (e.g. diagnostic placement screen) */
  suppressResults?: boolean;
};

const ACCENT = "#059669";

export default function StepMcqRunner({
  title,
  subtitle,
  questions,
  timeLimitMinutes,
  submitLabel = "Submit answers",
  onSubmit,
  onComplete,
  suppressResults = false,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, StepMcqOption>>({});
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: number;
    attempted: number;
    details?: StepRunnerQuestion[];
  } | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [secondsLeft, setSecondsLeft] = useState(
    timeLimitMinutes ? timeLimitMinutes * 60 : null
  );

  useEffect(() => {
    if (secondsLeft == null) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s != null ? s - 1 : s)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const current = questions[idx];
  const answerKey = useMemo(() => {
    const key: Record<string, StepMcqOption> = {};
    for (const q of questions) {
      if (q.correct) key[q.id] = q.correct;
    }
    return key;
  }, [questions]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const durationMinutes = Math.round((Date.now() - startedAt) / 60000);
      const res = await onSubmit({ answers, answerKey, durationMinutes });
      if (suppressResults) {
        onComplete?.(res);
        return;
      }
      setResult({
        correct: res.correct,
        attempted: res.attempted,
        details: questions,
      });
      onComplete?.(res);
    } finally {
      setSubmitting(false);
    }
  }, [answers, answerKey, onComplete, onSubmit, questions, startedAt, suppressResults]);

  if (!current && !result) {
    return <p className="text-slate-500">No questions available.</p>;
  }

  if (result) {
    const pct = Math.round((result.correct / result.attempted) * 100);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #047857)` }}
        >
          <h1 className="text-2xl font-bold">Results</h1>
          <p className="mt-2 text-3xl font-extrabold">
            {result.correct}/{result.attempted} correct ({pct}/100)
          </p>
        </div>
        <ul className="space-y-4">
          {questions.map((q, i) => {
            const chosen = answers[q.id];
            const ok = chosen === q.correct;
            return (
              <li
                key={q.id}
                className={`rounded-xl border p-4 ${ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
              >
                <p className="text-sm font-semibold text-[#0d1b35]">
                  {i + 1}. {q.stem}
                </p>
                <p className="mt-2 text-sm">
                  Your answer: <strong>{chosen ?? "—"}</strong> · Correct:{" "}
                  <strong>{q.correct}</strong>
                </p>
                {q.explanation ? (
                  <p className="mt-2 text-sm text-slate-600">{q.explanation}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const opts: StepMcqOption[] = ["A", "B", "C", "D"];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0d1b35]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {secondsLeft != null ? (
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      <div className="flex gap-1">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-2 flex-1 rounded-full ${i === idx ? "opacity-100" : "opacity-40"}`}
            style={{ backgroundColor: answers[questions[i].id] ? ACCENT : "#cbd5e1" }}
            aria-label={`Question ${i + 1}`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Question {current.number ?? idx + 1} of {questions.length}
        </p>
        <p className="mt-3 text-base font-medium leading-relaxed text-[#0d1b35]">
          {current.stem}
        </p>
        <div className="mt-5 space-y-3">
          {opts.map((letter) => (
            <label
              key={letter}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                answers[current.id] === letter
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name={current.id}
                checked={answers[current.id] === letter}
                onChange={() =>
                  setAnswers((prev) => ({ ...prev, [current.id]: letter }))
                }
                className="mt-0.5"
              />
              <span>
                <strong className="mr-2">{letter}.</strong>
                {current.options[letter]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => setIdx((i) => i - 1)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        {idx < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setIdx((i) => i + 1)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting || Object.keys(answers).length < questions.length}
            onClick={handleSubmit}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {submitting ? "Submitting…" : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
