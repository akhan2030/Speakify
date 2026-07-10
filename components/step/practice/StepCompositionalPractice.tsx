"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ExamHighlightSection,
  HighlightableInlineText,
  HighlightableMcqOption,
} from "@/components/exam/ExamHighlightSection";
import { PageSpinner } from "@/components/StudentSidebar";
import type { TextHighlight } from "@/lib/examHighlight";
import StepSectionTopBar, {
  type SectionProgress,
  STEP_GOLD,
  STEP_NAVY,
  STEP_TEAL,
} from "./StepSectionTopBar";
import { SAUDI_TIPS } from "@/lib/step/fallbackQuestions";
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
  isCorrect: boolean;
  correct: StepMcqOption;
  explanation: string;
  questionType?: string;
};

const SESSION_SIZE = 5;
const OPTS: StepMcqOption[] = ["A", "B", "C", "D"];

const TYPE_LABELS: Record<string, string> = {
  punctuation_accuracy: "Punctuation",
  correct_word_order: "Word order",
  sentence_combining: "Sentence combining",
  identify_incorrect_underlined: "Error identification",
};

export default function StepCompositionalPractice() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [progress, setProgress] = useState<SectionProgress | null>(null);
  const [weightPercent, setWeightPercent] = useState(10);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<GradedResult | null>(null);
  const [sessionGraded, setSessionGraded] = useState<GradedResult[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [batchKey, setBatchKey] = useState(0);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setIdx(0);
    setFeedback(null);
    setSessionGraded([]);
    setSessionComplete(false);
    const res = await fetch(
      `/api/step/questions?section=compositional_analysis&limit=${SESSION_SIZE}`
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setQuestions(json.questions ?? []);
    setProgress(json.progress);
    setWeightPercent(json.weightPercent ?? 10);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession().catch(() => setLoading(false));
  }, [loadSession, batchKey]);

  useEffect(() => {
    setHighlights([]);
  }, [batchKey, idx, questions[idx]?.id]);

  const current = questions[idx];

  const saudiTip = (type?: string) => {
    if (!type) return null;
    return SAUDI_TIPS[type] ?? SAUDI_TIPS[type.replace(/_accuracy|_underlined/g, "")] ?? null;
  };

  const handleSelect = async (letter: StepMcqOption) => {
    if (!current || feedback || sessionComplete) return;

    const res = await fetch("/api/step/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "compositional_analysis",
        answers: { [current.id]: letter },
      }),
    });
    const json = await res.json();
    const result = (json.results?.[0] ?? null) as GradedResult | null;
    if (result) {
      setFeedback(result);
      setSessionGraded((prev) => [...prev, result]);
      if (json.today?.estimatedScore != null && progress) {
        setProgress({
          ...progress,
          questionsAttemptedToday: json.today.questionsAttempted,
          estimatedSectionScore: json.today.estimatedScore,
        });
      }
    }

    window.setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= questions.length) {
        setSessionComplete(true);
      } else {
        setIdx((i) => i + 1);
      }
    }, 2200);
  };

  if (loading) return <PageSpinner />;

  const sessionCorrect = sessionGraded.filter((g) => g.isCorrect).length;

  const categoryBreakdown = Object.entries(
    sessionGraded.reduce<Record<string, { correct: number; total: number }>>((acc, g) => {
      const key = TYPE_LABELS[g.questionType ?? ""] ?? g.questionType ?? "Other";
      if (!acc[key]) acc[key] = { correct: 0, total: 0 };
      acc[key].total += 1;
      if (g.isCorrect) acc[key].correct += 1;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <StepSectionTopBar
        label="Compositional Analysis"
        weightPercent={weightPercent}
        progress={
          progress ?? {
            questionsAttemptedToday: 0,
            questionsCorrectToday: 0,
            estimatedSectionScore: 0,
            sectionMax: 10,
          }
        }
      />

      {!sessionComplete && current ? (
        <ExamHighlightSection
          sectionId={`step-compositional-${current.id}`}
          highlights={highlights}
          onHighlightsChange={setHighlights}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Question {idx + 1} of {questions.length}
            </p>
            <p
              className="mt-4 whitespace-pre-wrap text-base font-medium leading-relaxed"
              style={{ color: STEP_NAVY }}
            >
              <HighlightableInlineText blockId={`${current.id}-stem`} text={current.stem} />
            </p>

            {feedback ? (
              <div
                className={`mt-5 space-y-2 rounded-xl p-4 text-sm ${
                  feedback.isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
                }`}
              >
                <p>
                  {feedback.isCorrect ? "✅ Correct" : `❌ Correct: ${feedback.correct}`} —{" "}
                  {feedback.explanation}
                </p>
                {saudiTip(feedback.questionType) ? (
                  <p className="rounded-lg bg-white/60 px-3 py-2 text-xs italic">
                    🇸🇦 Saudi tip: {saudiTip(feedback.questionType)}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                {OPTS.map((letter) => (
                  <HighlightableMcqOption
                    key={letter}
                    blockId={`${current.id}-opt-${letter}`}
                    letter={letter}
                    text={current.options[letter]}
                    name={current.id}
                    checked={false}
                    onSelect={() => handleSelect(letter)}
                    className="flex w-full items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-teal-400 hover:bg-teal-50"
                  />
                ))}
              </div>
            )}
          </div>
        </ExamHighlightSection>
      ) : (
        <div
          className="rounded-2xl p-6 text-white"
          style={{ backgroundColor: STEP_NAVY }}
        >
          <h2 className="text-2xl font-bold">
            {sessionCorrect}/{questions.length} —{" "}
            {accuracyPercent(sessionCorrect, questions.length)}%
          </h2>
          <h3 className="mt-4 text-sm font-semibold text-white/80">Category breakdown</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {categoryBreakdown.map(([cat, v]) => (
              <li key={cat}>
                {cat}: {v.correct}/{v.total}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setBatchKey((k) => k + 1)}
            className="mt-5 rounded-lg px-5 py-2.5 text-sm font-bold"
            style={{ backgroundColor: STEP_GOLD, color: STEP_NAVY }}
          >
            Continue — next 5 questions →
          </button>
        </div>
      )}

      <Link
        href={STEP_STUDENT_BASE}
        className="inline-block text-sm font-semibold"
        style={{ color: STEP_TEAL }}
      >
        ← Return to Dashboard
      </Link>
    </div>
  );
}
