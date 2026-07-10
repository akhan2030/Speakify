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
  grammarPoint?: string;
  questionType?: string;
};

const SESSION_SIZE = 10;
const OPTS: StepMcqOption[] = ["A", "B", "C", "D"];

const CATEGORY_LABELS: Record<string, string> = {
  subject_verb_agreement: "Subject-verb agreement",
  tense_selection: "Tense selection",
  prepositions: "Prepositions",
  modals: "Modal verbs",
  modals_and_conditionals: "Modal verbs",
  articles: "Articles",
  conditional: "Conditionals",
  relative_clauses: "Relative clauses",
  parallel_structure: "Parallel structure",
};

export default function StepStructurePractice() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [progress, setProgress] = useState<SectionProgress | null>(null);
  const [weightPercent, setWeightPercent] = useState(30);
  const [idx, setIdx] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, StepMcqOption>>({});
  const [feedback, setFeedback] = useState<GradedResult | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionGraded, setSessionGraded] = useState<GradedResult[]>([]);
  const [batchKey, setBatchKey] = useState(0);
  const [runningToday, setRunningToday] = useState({ attempted: 0, correct: 0 });
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setIdx(0);
    setSessionAnswers({});
    setFeedback(null);
    setSessionComplete(false);
    setSessionGraded([]);
    const res = await fetch(`/api/step/questions?section=structure&limit=${SESSION_SIZE}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setQuestions(json.questions ?? []);
    setProgress(json.progress);
    setWeightPercent(json.weightPercent ?? 30);
    setRunningToday({
      attempted: json.progress?.questionsAttemptedToday ?? 0,
      correct: json.progress?.questionsCorrectToday ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession().catch(() => setLoading(false));
  }, [loadSession, batchKey]);

  useEffect(() => {
    setHighlights([]);
  }, [batchKey, idx, questions[idx]?.id]);

  const current = questions[idx];

  const handleSelect = async (letter: StepMcqOption) => {
    if (!current || feedback || sessionComplete) return;
    setSessionAnswers((prev) => ({ ...prev, [current.id]: letter }));

    const res = await fetch("/api/step/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "structure",
        answers: { [current.id]: letter },
      }),
    });
    const json = await res.json();
    const result = (json.results?.[0] ?? null) as GradedResult | null;
    if (result) {
      setFeedback(result);
      setSessionGraded((prev) => [...prev, result]);
      setRunningToday({
        attempted: json.today?.questionsAttempted ?? runningToday.attempted + 1,
        correct:
          json.today?.questionsCorrect ??
          runningToday.correct + (result.isCorrect ? 1 : 0),
      });
      if (json.today?.estimatedScore != null && progress) {
        setProgress({ ...progress, estimatedSectionScore: json.today.estimatedScore });
      }
    }

    window.setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= questions.length) {
        setSessionComplete(true);
      } else {
        setIdx((i) => i + 1);
      }
    }, 2000);
  };

  if (loading) return <PageSpinner />;

  const sessionCorrect = sessionGraded.filter((g) => g.isCorrect).length;
  const todayPct = accuracyPercent(runningToday.correct, runningToday.attempted);

  const wrongCategories = sessionGraded
    .filter((g) => !g.isCorrect)
    .map((g) => {
      const key = g.grammarPoint ?? g.questionType ?? "grammar";
      return CATEGORY_LABELS[key] ?? key.replace(/_/g, " ");
    });
  const weakArea = wrongCategories[0];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <StepSectionTopBar
        label="Structure and Grammar"
        weightPercent={weightPercent}
        progress={
          progress ?? {
            questionsAttemptedToday: 0,
            questionsCorrectToday: 0,
            estimatedSectionScore: 0,
            sectionMax: 30,
          }
        }
      />

      <div
        className="rounded-lg px-4 py-2 text-sm font-medium text-amber-900"
        style={{ backgroundColor: "#fef3c7" }}
      >
        Today: {runningToday.attempted}/30 questions answered — {runningToday.correct} correct (
        {todayPct}%)
      </div>

      {!sessionComplete && current ? (
        <ExamHighlightSection
          sectionId={`step-structure-${current.id}`}
          highlights={highlights}
          onHighlightsChange={setHighlights}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Question {idx + 1} of {questions.length}
            </p>
            <p className="mt-4 text-lg font-medium leading-relaxed" style={{ color: STEP_NAVY }}>
              <HighlightableInlineText blockId={`${current.id}-stem`} text={current.stem} />
            </p>

            {feedback ? (
              <div
                className={`mt-5 rounded-xl p-4 text-sm ${
                  feedback.isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
                }`}
              >
                {feedback.isCorrect ? "✅ Correct" : `❌ Incorrect — answer: ${feedback.correct}`} —{" "}
                {feedback.explanation}
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {OPTS.map((letter) => (
                  <HighlightableMcqOption
                    key={letter}
                    blockId={`${current.id}-opt-${letter}`}
                    letter={letter}
                    text={current.options[letter]}
                    name={current.id}
                    checked={false}
                    onSelect={() => handleSelect(letter)}
                    className="rounded-xl border-2 border-slate-200 px-4 py-4 text-left text-sm font-semibold transition hover:border-teal-400 hover:bg-teal-50"
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
            {sessionCorrect >= 8 ? "Excellent" : sessionCorrect >= 6 ? "Good work" : "Keep practicing"}
          </h2>
          {weakArea ? (
            <p className="mt-3 text-sm text-white/90">
              Weak area: <strong>{weakArea}</strong> — practice more
            </p>
          ) : (
            <p className="mt-3 text-sm text-white/90">No weak categories this session — great job!</p>
          )}
          <ul className="mt-4 space-y-1 text-sm text-white/80">
            {sessionGraded
              .filter((g) => !g.isCorrect)
              .map((g) => (
                <li key={g.id}>
                  ✗ {CATEGORY_LABELS[g.questionType ?? ""] ?? g.grammarPoint ?? "Grammar"}
                </li>
              ))}
          </ul>
          <button
            type="button"
            onClick={() => setBatchKey((k) => k + 1)}
            className="mt-5 rounded-lg px-5 py-2.5 text-sm font-bold"
            style={{ backgroundColor: STEP_GOLD, color: STEP_NAVY }}
          >
            Start next 10 questions →
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
