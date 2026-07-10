"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExamHighlightSection } from "@/components/exam/ExamHighlightSection";
import type { TextHighlight } from "@/lib/examHighlight";
import {
  EXIT_TEST_SECTION_COUNTS,
  EXIT_TEST_TIME_SECONDS,
} from "@/lib/step/exitTest/constants";
import type { MockExamClientQuestion, MockExamPayload } from "@/lib/step/mockExam/types";
import CompositionalQuestion from "@/components/step/mock-test/CompositionalQuestion";
import ListeningQuestion from "@/components/step/mock-test/ListeningQuestion";
import ExitTestHeader from "./ExitTestHeader";
import QuestionNavPanel from "@/components/step/mock-test/QuestionNavPanel";
import ReadingQuestion from "@/components/step/mock-test/ReadingQuestion";
import StructureQuestion from "@/components/step/mock-test/StructureQuestion";
import type { StepMcqOption } from "@/lib/step/types";

const TOTAL = 40;
const SECTION_COUNTS = [...EXIT_TEST_SECTION_COUNTS];
type ExamState = {
  status: "not_started" | "in_progress" | "submitted";
  currentSection: number;
  currentQuestion: number;
  answers: Record<string, string>;
  timeRemaining: number;
  attemptId: string | null;
  listeningPlayed: Record<string, boolean>;
  sectionSubmitted: boolean[];
};

type Props = {
  attemptId: string;
  phase: number;
  questions: MockExamPayload;
  onSubmitted: (attemptId: string) => void;
};

function sectionQuestions(payload: MockExamPayload, sectionIndex: number): MockExamClientQuestion[] {
  switch (sectionIndex) {
    case 0:
      return payload.reading;
    case 1:
      return payload.structure;
    case 2:
      return payload.listening;
    default:
      return payload.compositional;
  }
}

function getQuestionId(
  payload: MockExamPayload,
  sectionIndex: number,
  questionIndex: number
): string {
  const qs = sectionQuestions(payload, sectionIndex);
  return qs[questionIndex]?.id ?? "";
}

export default function ExitTestRunner({ attemptId, phase, questions, onSubmitted }: Props) {
  const [examState, setExamState] = useState<ExamState>(() => ({
    status: "in_progress",
    currentSection: 0,
    currentQuestion: 0,
    answers: {},
    timeRemaining: EXIT_TEST_TIME_SECONDS,
    attemptId,
    listeningPlayed: {},
    sectionSubmitted: [false, false, false, false],
  }));
  const [submitting, setSubmitting] = useState(false);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const warned10 = useRef(false);
  const warned5 = useRef(false);
  const examStateRef = useRef(examState);
  examStateRef.current = examState;

  useEffect(() => {
    setHighlights([]);
  }, [examState.currentSection, examState.currentQuestion]);

  const answeredInSection = useCallback(
    (sectionIndex: number) => {
      const qs = sectionQuestions(questions, sectionIndex);
      return qs.filter((q) => examState.answers[q.id] !== undefined).length;
    },
    [examState.answers, questions]
  );

  const handleFinalSubmit = useCallback(
    async (auto = false) => {
      if (submitting || examStateRef.current.status === "submitted") return;

      const state = examStateRef.current;
      const answered = Object.keys(state.answers).length;

      if (!auto) {
        const confirmed = window.confirm(
          `Submit Phase ${phase} exit test?\n\nAnswered: ${answered}/${TOTAL}\nUnanswered: ${TOTAL - answered}\n\nThis cannot be undone.`
        );
        if (!confirmed) return;
      }

      setSubmitting(true);
      try {
        const res = await fetch("/api/step/exit-test/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: state.attemptId,
            answers: state.answers,
            timeSpent: EXIT_TEST_TIME_SECONDS - state.timeRemaining,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Submit failed");
        sessionStorage.setItem(`step-exit-result-${state.attemptId}`, JSON.stringify(json));
        setExamState((s) => ({ ...s, status: "submitted" }));
        onSubmitted(state.attemptId!);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not submit exit test");
        setSubmitting(false);
      }
    },
    [onSubmitted, phase, submitting]
  );

  useEffect(() => {
    if (examState.status !== "in_progress") return;

    const timer = window.setInterval(() => {
      setExamState((prev) => {
        if (prev.timeRemaining <= 1) {
          window.clearInterval(timer);
          void handleFinalSubmit(true);
          return { ...prev, timeRemaining: 0, status: "submitted" };
        }

        const next = prev.timeRemaining - 1;
        if (next === 600 && !warned10.current) {
          warned10.current = true;
          window.alert("⚠ 10 minutes remaining");
        }
        if (next === 300 && !warned5.current) {
          warned5.current = true;
          window.alert("⚠ 5 minutes remaining — submit any unanswered questions");
        }
        return { ...prev, timeRemaining: next };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [examState.status, handleFinalSubmit]);

  const handleAnswer = (section: number, qIndex: number, ans: StepMcqOption) => {
    const qId = getQuestionId(questions, section, qIndex);
    if (!qId) return;
    setExamState((s) => ({
      ...s,
      answers: { ...s.answers, [qId]: ans },
    }));
  };

  const navigateNext = () => {
    const count = SECTION_COUNTS[examState.currentSection];
    if (examState.currentQuestion < count - 1) {
      setExamState((s) => ({ ...s, currentQuestion: s.currentQuestion + 1 }));
    } else if (examState.currentSection < 3) {
      setExamState((s) => ({
        ...s,
        currentSection: s.currentSection + 1,
        currentQuestion: 0,
      }));
    }
  };

  const navigatePrev = () => {
    if (examState.currentQuestion > 0) {
      setExamState((s) => ({ ...s, currentQuestion: s.currentQuestion - 1 }));
    } else if (examState.currentSection > 0) {
      const prevSection = examState.currentSection - 1;
      setExamState((s) => ({
        ...s,
        currentSection: prevSection,
        currentQuestion: SECTION_COUNTS[prevSection] - 1,
      }));
    }
  };

  const handleSectionSubmit = (sectionIndex: number) => {
    setExamState((s) => {
      const nextSubmitted = [...s.sectionSubmitted];
      nextSubmitted[sectionIndex] = true;
      if (sectionIndex < 3) {
        return {
          ...s,
          sectionSubmitted: nextSubmitted,
          currentSection: sectionIndex + 1,
          currentQuestion: 0,
        };
      }
      return { ...s, sectionSubmitted: nextSubmitted };
    });
  };

  const currentQs = sectionQuestions(questions, examState.currentSection);
  const currentQ = currentQs[examState.currentQuestion];
  const totalAnswered = Object.keys(examState.answers).length;
  const allAnswered = totalAnswered >= TOTAL;

  if (!currentQ) {
    return <p className="p-8 text-slate-500">Loading exit test questions…</p>;
  }

  const currentAnswer = examState.answers[currentQ.id];

  return (
    <div className="min-h-screen bg-white pb-24">
      <ExitTestHeader
        examState={examState}
        phase={phase}
        sectionCounts={SECTION_COUNTS}
        answeredInSection={answeredInSection}
        onSectionChange={(i) =>
          setExamState((s) => ({ ...s, currentSection: i, currentQuestion: 0 }))
        }
        onSubmitExam={() => handleFinalSubmit(false)}
        totalAnswered={totalAnswered}
        submitting={submitting}
        submitEnabled={allAnswered}
      />

      <QuestionNavPanel
        sectionIndex={examState.currentSection}
        sectionCounts={SECTION_COUNTS}
        currentQuestion={examState.currentQuestion}
        answers={examState.answers}
        getQuestionId={(si, qi) => getQuestionId(questions, si, qi)}
        answeredInSection={answeredInSection(examState.currentSection)}
        sectionTotal={SECTION_COUNTS[examState.currentSection]}
        onQuestionSelect={(i) => setExamState((s) => ({ ...s, currentQuestion: i }))}
        onSectionSubmit={() => handleSectionSubmit(examState.currentSection)}
      />

      <div className="ml-0 max-w-[800px] px-4 py-8 md:ml-[200px] md:px-8" style={{ marginTop: 64 }}>
        <ExamHighlightSection
          sectionId={`exit-test-${examState.currentSection}-${examState.currentQuestion}`}
          highlights={highlights}
          onHighlightsChange={setHighlights}
        >
        {examState.currentSection === 0 && (
          <ReadingQuestion
            question={currentQ}
            answer={currentAnswer}
            onAnswer={(ans) => handleAnswer(0, examState.currentQuestion, ans)}
            questionNumber={examState.currentQuestion + 1}
          />
        )}
        {examState.currentSection === 1 && (
          <StructureQuestion
            question={currentQ}
            answer={currentAnswer}
            onAnswer={(ans) => handleAnswer(1, examState.currentQuestion, ans)}
            questionNumber={examState.currentQuestion + 1}
          />
        )}
        {examState.currentSection === 2 && (
          <ListeningQuestion
            question={currentQ}
            answer={currentAnswer}
            onAnswer={(ans) => handleAnswer(2, examState.currentQuestion, ans)}
            hasPlayed={Boolean(
              examState.listeningPlayed[currentQ.recordingId ?? currentQ.id]
            )}
            onPlay={(id) =>
              setExamState((s) => ({
                ...s,
                listeningPlayed: { ...s.listeningPlayed, [id]: true },
              }))
            }
            questionNumber={examState.currentQuestion + 1}
          />
        )}
        {examState.currentSection === 3 && (
          <CompositionalQuestion
            question={currentQ}
            answer={currentAnswer}
            onAnswer={(ans) => handleAnswer(3, examState.currentQuestion, ans)}
            questionNumber={examState.currentQuestion + 1}
          />
        )}

        </ExamHighlightSection>

        <div className="mt-8 flex justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={navigatePrev}
            disabled={examState.currentSection === 0 && examState.currentQuestion === 0}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          {allAnswered ? (
            <button
              type="button"
              onClick={() => handleFinalSubmit(false)}
              disabled={submitting}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#c9972c" }}
            >
              Submit Exit Test
            </button>
          ) : (
            <button
              type="button"
              onClick={navigateNext}
              disabled={
                examState.currentSection === 3 &&
                examState.currentQuestion === SECTION_COUNTS[3] - 1
              }
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#0d1b35" }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
