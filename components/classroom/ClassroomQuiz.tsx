"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/classroom/b1-1-unit1";

export default function ClassroomQuiz({
  levelCode,
  unitNumber,
  title,
  questions,
  showAnswerKey = false,
  answerKey,
}: {
  levelCode: string;
  unitNumber: number;
  title: string;
  questions: QuizQuestion[];
  showAnswerKey?: boolean;
  answerKey?: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    results: Record<string, boolean>;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/classroom/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelCode, unitNumber, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quiz submit failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quiz submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-slate-600">
        15 questions · auto-marked on your device · results go to your teacher
      </p>
      {questions.map((q) => {
        const key = String(q.id);
        return (
          <div
            key={q.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Question {q.id}
            </p>
            <p className="mt-1 font-medium">{q.prompt}</p>
            {q.type === "mcq" && q.options ? (
              <div className="mt-3 space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-start gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      className="mt-1"
                      checked={answers[key] === opt}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [key]: opt }))
                      }
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : q.type === "true_false" ? (
              <div className="mt-3 flex gap-4 text-sm">
                {["true", "false"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 capitalize">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[key] === opt}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [key]: opt }))
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={answers[key] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder="Type your answer"
              />
            )}
            {result ? (
              <p
                className={`mt-2 text-xs font-semibold ${
                  result.results[key] ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {result.results[key] ? "Correct" : "Incorrect"}
              </p>
            ) : null}
            {showAnswerKey && answerKey?.[key] ? (
              <p className="mt-1 text-xs text-emerald-800">
                Key: {answerKey[key]}
              </p>
            ) : null}
          </div>
        );
      })}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {result ? (
        <p className="rounded-lg bg-slate-900 px-4 py-3 text-white">
          Score: {result.score}/{result.maxScore}
        </p>
      ) : null}

      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : result ? "Resubmit quiz" : "Submit quiz"}
      </button>
    </div>
  );
}
