"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import {
  ExamHighlightQuestionText,
  ExamHighlightSection,
  HighlightableInlineText,
} from "@/components/exam/ExamHighlightSection";
import GtReadingQuestionField from "@/components/exam/GtReadingQuestionField";
import { plainTextToBlocks, type TextHighlight } from "@/lib/examHighlight";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";
import type { GtReadingPassage, GtReadingQuestion } from "@/lib/ielts-general/readingContent";
import type { GtReadingScoreResult } from "@/lib/ielts-general/readingScore";
import { gtQuestionPrompt } from "@/lib/ielts-general/readingQuestionView";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEST_SECONDS = 60 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function QuestionField({
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
  return (
    <GtReadingQuestionField
      question={question}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default function GeneralReadingTimedTest() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passages, setPassages] = useState<GtReadingPassage[]>([]);
  const [questions, setQuestions] = useState<GtReadingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(TEST_SECONDS);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GtReadingScoreResult | null>(null);
  const submittedRef = useRef(false);

  const submitTest = useCallback(
    async (answersSnapshot: Record<string, string>) => {
      if (submittedRef.current || questions.length === 0) return;
      submittedRef.current = true;
      setSubmitting(true);

      const passageSectionByQuestionId: Record<string, "A" | "B" | "C"> = {};
      for (const p of passages) {
        for (const q of p.questions) {
          passageSectionByQuestionId[q.id] = p.section;
        }
      }

      try {
        const res = await fetch("/api/ielts-general/reading/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "full",
            questions,
            answers: answersSnapshot,
            passageSectionByQuestionId,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Submit failed");
        setResult(json as GtReadingScoreResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Submit failed");
        submittedRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [passages, questions]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ielts-general/reading?mode=full");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not load test");
        if (cancelled) return;
        setPassages(json.passages ?? []);
        setQuestions(json.questions ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!started || result || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, result, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && started && !result && !submitting) {
      submitTest(answers);
    }
  }, [secondsLeft, started, result, submitting, answers, submitTest]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (error && !passages.length) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!started && !result) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0d1b35]">Full GT Reading Test</h1>
        <p className="mt-3 text-sm text-slate-600">
          60 minutes · Section A (everyday texts) · Section B (workplace) · Section C
          (extended passage) · {questions.length} questions
        </p>
        <ul className="mt-4 list-inside list-disc text-sm text-slate-600">
          <li>Section A: short everyday texts (Saudi notices, metro, promotions)</li>
          <li>Section B: workplace documents (ministry jobs, site safety)</li>
          <li>Section C: one extended general-interest article</li>
          <li>{questions.length} questions total · auto-submit when time runs out</li>
        </ul>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-6 rounded-xl px-8 py-3 text-sm font-bold text-[#0d1b35]"
          style={{ backgroundColor: GOLD }}
        >
          Start 60-minute test
        </button>
        <Link
          href={`${GENERAL_STUDENT_BASE}/reading`}
          className="mt-4 block text-center text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Back to Reading
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#0d1b35] bg-[#0d1b35] p-6 text-white">
          <h1 className="text-2xl font-bold">Test complete</h1>
          <p className="mt-2 text-3xl font-bold text-[#c9972c]">
            {result.correct}/{result.total} — Band {result.estimatedBand.toFixed(1)}
          </p>
        </div>

        {result.sectionBreakdown ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {(["A", "B", "C"] as const).map((sec) => {
              const row = result.sectionBreakdown![sec];
              const pct =
                row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
              return (
                <div
                  key={sec}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Section {sec}
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#0d1b35]">
                    {row.correct}/{row.total}
                  </p>
                  <p className="text-sm text-slate-500">{pct}% correct</p>
                </div>
              );
            })}
          </div>
        ) : null}

        <Link
          href={`${GENERAL_STUDENT_BASE}/reading`}
          className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white"
          style={{ backgroundColor: NAVY }}
        >
          Back to Reading hub
        </Link>
      </div>
    );
  }

  let currentSection: "A" | "B" | "C" | null = null;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-sm font-bold text-[#0d1b35]">GT Reading — timed test</p>
          <p className="text-xs text-slate-500">{questions.length} questions</p>
        </div>
        <p
          className={`text-2xl font-bold tabular-nums ${
            secondsLeft < 300 ? "text-red-600" : "text-[#0d1b35]"
          }`}
        >
          {formatTime(secondsLeft)}
        </p>
        <button
          type="button"
          disabled={submitting}
          onClick={() => submitTest(answers)}
          className="rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit test"}
        </button>
      </div>

      {passages.map((passage) => {
        const showHeader = passage.section !== currentSection;
        if (showHeader) currentSection = passage.section;

        return (
          <div key={passage.id} className="space-y-4">
            {showHeader ? (
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Section {passage.section}
                {passage.section === "A"
                  ? " — Everyday texts"
                  : passage.section === "B"
                    ? " — Workplace"
                    : " — Extended passage"}
              </h2>
            ) : null}

            <ExamHighlightSection
              sectionId={`gt-timed-${passage.id}`}
              highlights={highlights}
              onHighlightsChange={setHighlights}
              toolbarClassName="mb-3"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#0d1b35]">{passage.title}</h3>
                <div className="mt-3 max-h-64 select-text space-y-3 overflow-y-auto">
                  {plainTextToBlocks(passage.text, passage.id).map((block) => (
                    <p key={block.id} className="text-sm leading-relaxed text-slate-700">
                      <HighlightableInlineText blockId={block.id} text={block.text} />
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {passage.questions.map((q) => (
                  <div
                    key={q.id}
                    className="select-text rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <p className="text-sm font-medium text-[#0d1b35]">
                      <ExamHighlightQuestionText
                        blockId={`gt-rq-${q.id}`}
                        number={q.number}
                        text={gtQuestionPrompt(q)}
                      />
                    </p>
                    <QuestionField
                      question={q}
                      value={answers[q.id] ?? ""}
                      disabled={submitting}
                      onChange={(v) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </ExamHighlightSection>
          </div>
        );
      })}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
