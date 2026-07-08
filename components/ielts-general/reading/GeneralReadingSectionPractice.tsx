"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import ExamTextHighlighter from "@/components/exam/ExamTextHighlighter";
import { plainTextToBlocks, type TextHighlight } from "@/lib/examHighlight";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";
import type { GtReadingPassage, GtReadingQuestion } from "@/lib/ielts-general/readingContent";
import type { GtReadingScoreResult } from "@/lib/ielts-general/readingScore";
import {
  gtQuestionPrompt,
  gtUsesDropdown,
  gtUsesOptionPicker,
  normalizeGtOptions,
} from "@/lib/ielts-general/readingQuestionView";

const NAVY = "#0d1b35";
const TEAL = "#0d9488";
const GOLD = "#c9972c";

type SectionMeta = {
  label: string;
  description: string;
  questionRange: string;
  timeTarget: string;
};

function QuestionInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: GtReadingQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  if (question.type === "true_false_not_given") {
    return (
      <div className="mt-2 flex flex-wrap gap-3">
        {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              value === opt ? "border-[#0d9488] bg-[#0d9488]/10" : "border-slate-200"
            } ${disabled ? "opacity-70" : ""}`}
          >
            <input
              type="radio"
              name={question.id}
              value={opt}
              checked={value === opt}
              disabled={disabled}
              onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  const options = normalizeGtOptions(question.options);

  if (gtUsesOptionPicker(question.type) && options.length) {
    if (gtUsesDropdown(question.type)) {
      return (
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
        >
          <option value="">Select an option…</option>
          {options.map((opt, i) => (
            <option key={`${question.id}-opt-${i}`} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {options.map((opt, i) => (
          <label
            key={`${question.id}-opt-${i}`}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              value === opt ? "border-[#0d9488] bg-[#0d9488]/10" : "border-slate-200"
            } ${disabled ? "opacity-70" : ""}`}
          >
            <input
              type="radio"
              name={question.id}
              value={opt}
              checked={value === opt}
              disabled={disabled}
              onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your answer"
      className="mt-2 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
    />
  );
}

function ResultsPanel({ result }: { result: GtReadingScoreResult }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-5">
        <p className="text-sm text-slate-600">Your score</p>
        <p className="text-3xl font-bold" style={{ color: NAVY }}>
          {result.correct}/{result.total}{" "}
          <span className="text-lg font-semibold text-slate-500">
            ({result.accuracy}%)
          </span>
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: TEAL }}>
          Estimated band: {result.estimatedBand.toFixed(1)}
        </p>
      </div>

      <div className="space-y-3">
        {result.breakdown.map((row) => (
          <div
            key={row.questionId}
            className={`rounded-lg border p-4 text-sm ${
              row.correct
                ? "border-green-200 bg-green-50/50"
                : "border-red-200 bg-red-50/50"
            }`}
          >
            <p className="font-semibold text-[#0d1b35]">
              Q{row.number} — {row.correct ? "Correct" : "Incorrect"}
            </p>
            {!row.correct ? (
              <>
                <p className="mt-1 text-slate-600">
                  Your answer: <strong>{row.studentAnswer || "—"}</strong>
                </p>
                <p className="text-slate-600">
                  Correct answer: <strong>{row.correctAnswer}</strong>
                </p>
                <p className="mt-2 text-slate-700">{row.explanation}</p>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GeneralReadingSectionPractice({
  sectionSlug,
}: {
  sectionSlug: "section-a" | "section-b" | "section-c";
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SectionMeta | null>(null);
  const [passage, setPassage] = useState<GtReadingPassage | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GtReadingScoreResult | null>(null);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ielts-general/reading?mode=section&section=${encodeURIComponent(sectionSlug)}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load passage");
      setMeta(json.meta);
      setPassage(json.passage);
      setAnswers({});
      setHighlights([]);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [sectionSlug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passage) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ielts-general/reading/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "section",
          section: passage.section,
          questions: passage.questions,
          answers,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submit failed");
      setResult(json as GtReadingScoreResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (error && !passage) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!passage || !meta) return null;

  const sectionColors = { A: GOLD, B: TEAL, C: "#7c3aed" };
  const accent = sectionColors[passage.section];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`${GENERAL_STUDENT_BASE}/reading`}
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            ← Back to Reading
          </Link>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: NAVY }}>
            {meta.label} practice
          </h1>
          <p className="mt-1 text-sm text-slate-600">{meta.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            {meta.questionRange} · Target time: {meta.timeTarget}
          </p>
        </div>
        {passage.saudiContext ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            Saudi context
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          style={{ borderTopWidth: 4, borderTopColor: accent }}
        >
          <h2 className="text-lg font-bold text-[#0d1b35]">{passage.title}</h2>
          <div className="mt-4">
            <ExamTextHighlighter
              sectionId={passage.id}
              blocks={plainTextToBlocks(passage.text, passage.id)}
              highlights={highlights}
              onHighlightsChange={setHighlights}
              textClassName="text-sm leading-relaxed text-slate-700"
            />
          </div>
        </div>

        <div>
          {result ? (
            <ResultsPanel result={result} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {passage.questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#0d1b35]">
                    {q.number}. {gtQuestionPrompt(q)}
                  </p>
                  <QuestionInput
                    question={q}
                    value={answers[q.id] ?? ""}
                    disabled={submitting}
                    onChange={(v) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: v }))
                    }
                  />
                </div>
              ))}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-60 sm:w-auto"
                style={{ backgroundColor: NAVY }}
              >
                {submitting ? "Checking…" : "Submit answers"}
              </button>
            </form>
          )}

          {result ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={load}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#0d1b35]"
              >
                Try again
              </button>
              <Link
                href={`${GENERAL_STUDENT_BASE}/reading`}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: TEAL }}
              >
                Back to Reading hub
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
