"use client";

import { useState } from "react";
import Link from "next/link";
import MCQBlock from "./MCQBlock";
import ProgressPath from "./ProgressPath";

export type QuizQuestionView = {
  id: string | number;
  type: string;
  prompt: string;
  options?: string[];
  pairs?: { left: string; right: string }[];
};

export default function QuizPageClient({
  levelSlug,
  unitSlug,
  levelCode,
  unitNumber,
  title,
  questions,
}: {
  levelSlug: string;
  unitSlug: string;
  levelCode: string;
  unitNumber: number;
  title: string;
  questions: QuizQuestionView[];
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    results: Record<string, boolean>;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/classroom/${encodeURIComponent(levelSlug)}/${encodeURIComponent(unitSlug)}`;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/classroom/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelCode,
          unitNumber,
          unitSlug,
          levelSlug,
          answers,
        }),
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
            End-of-unit quiz
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        <Link
          href={base}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Unit home
        </Link>
      </div>

      <ProgressPath levelSlug={levelSlug} unitSlug={unitSlug} activeKey="quiz" />

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-slate-600">
          No quiz questions found for this unit.
        </p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const key = String(q.id);
            const type = String(q.type ?? "mcq").toLowerCase();
            const marked = result ? Boolean(result.results[key]) : null;

            if (type === "mcq" && q.options?.length) {
              return (
                <MCQBlock
                  key={key}
                  id={key}
                  prompt={q.prompt}
                  options={q.options}
                  value={String(answers[key] ?? "")}
                  onChange={(v) =>
                    setAnswers((prev) => ({ ...prev, [key]: v }))
                  }
                  disabled={Boolean(result)}
                  correct={marked}
                />
              );
            }

            if (type === "true_false" || type === "true-false") {
              return (
                <div
                  key={key}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <p className="font-medium">{q.prompt}</p>
                  <div className="mt-3 flex gap-4 text-sm">
                    {["true", "false"].map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-2 capitalize"
                      >
                        <input
                          type="radio"
                          name={`q-${key}`}
                          checked={answers[key] === opt}
                          disabled={Boolean(result)}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [key]: opt }))
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {marked != null ? (
                    <p
                      className={`mt-2 text-xs font-semibold ${
                        marked ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {marked ? "Correct" : "Incorrect"}
                    </p>
                  ) : null}
                </div>
              );
            }

            if (type === "matching" && q.pairs?.length) {
              const rights = q.pairs.map((p) => p.right);
              const map = (answers[key] as Record<string, string>) ?? {};
              return (
                <div
                  key={key}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <p className="font-medium">{q.prompt}</p>
                  <div className="mt-3 space-y-2">
                    {q.pairs.map((pair) => (
                      <div
                        key={pair.left}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <span className="min-w-[8rem] font-medium">
                          {pair.left}
                        </span>
                        <select
                          className="rounded-md border border-slate-200 px-2 py-1"
                          value={map[pair.left] ?? ""}
                          disabled={Boolean(result)}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [key]: {
                                ...((prev[key] as Record<string, string>) ?? {}),
                                [pair.left]: e.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">Select…</option>
                          {rights.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={key}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="font-medium">{q.prompt}</p>
                <input
                  className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={String(answers[key] ?? "")}
                  disabled={Boolean(result)}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder="Type your answer"
                />
                {marked != null ? (
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      marked ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {marked ? "Correct" : "Incorrect"}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {result ? (
        <p className="rounded-lg bg-slate-900 px-4 py-3 text-white">
          Score: {result.score}/{result.maxScore}
        </p>
      ) : null}

      <button
        type="button"
        disabled={submitting || questions.length === 0}
        onClick={submit}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : result ? "Resubmit quiz" : "Submit quiz"}
      </button>
    </div>
  );
}
