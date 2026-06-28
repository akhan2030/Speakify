"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MOCK_SECTION_COUNTS,
  MOCK_SECTION_NAMES,
  MOCK_TIME_SECONDS,
} from "@/lib/step/mockExam/constants";
import type { MockExamClientQuestion, MockExamPayload } from "@/lib/step/mockExam/types";
import CompositionalQuestion from "./CompositionalQuestion";
import ListeningQuestion from "./ListeningQuestion";
import MockExamHeader from "./MockExamHeader";
import QuestionNavPanel from "./QuestionNavPanel";
import ReadingQuestion from "./ReadingQuestion";
import StructureQuestion from "./StructureQuestion";
import type { StepMcqOption } from "@/lib/step/types";

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
  mockNumber: number;
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

export default function MockExamRunner({ attemptId, questions, onSubmitted }: Props) {
  const [examState, setExamState] = useState<ExamState>(() => ({
    status: "in_progress",
    currentSection: 0,
    currentQuestion: 0,
    answers: {},
    timeRemaining: MOCK_TIME_SECONDS,
    attemptId,
    listeningPlayed: {},
    sectionSubmitted: [false, false, false, false],
  }));
  const [submitting, setSubmitting] = useState(false);
  const warned30 = useRef(false);
  const warned10 = useRef(false);
  const examStateRef = useRef(examState);
  examStateRef.current = examState;

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
          `Submit your exam?\n\nAnswered: ${answered}/100\nUnanswered: ${100 - answered}\n\nThis cannot be undone.`
        );
        if (!confirmed) return;
      }

      setSubmitting(true);
      try {
        const res = await fetch("/api/step/mock/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: state.attemptId,
            answers: state.answers,
            timeSpent: MOCK_TIME_SECONDS - state.timeRemaining,
            autoSubmit: auto,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Submit failed");
        setExamState((s) => ({ ...s, status: "submitted" }));
        onSubmitted(state.attemptId!);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not submit exam");
        setSubmitting(false);
      }
    },
    [onSubmitted, submitting]
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
        if (next === 1800 && !warned30.current) {
          warned30.current = true;
          window.alert("⚠ 30 minutes remaining — check all sections");
        }
        if (next === 600 && !warned10.current) {
          warned10.current = true;
          window.alert("⚠ 10 minutes remaining — submit any unanswered sections");
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
    const count = MOCK_SECTION_COUNTS[examState.currentSection];
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
        currentQuestion: MOCK_SECTION_COUNTS[prevSection] - 1,
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

  if (!currentQ) {
    return <p className="p-8 text-slate-500">Loading exam questions…</p>;
  }

  const currentAnswer = examState.answers[currentQ.id];

  return (
    <div className="min-h-screen bg-white pb-24">
      <MockExamHeader
        examState={examState}
        sectionNames={MOCK_SECTION_NAMES}
        sectionCounts={MOCK_SECTION_COUNTS}
        answeredInSection={answeredInSection}
        onSectionChange={(i) =>
          setExamState((s) => ({ ...s, currentSection: i, currentQuestion: 0 }))
        }
        onSubmitExam={() => handleFinalSubmit(false)}
        totalAnswered={totalAnswered}
        submitting={submitting}
      />

      <QuestionNavPanel
        sectionIndex={examState.currentSection}
        sectionCounts={MOCK_SECTION_COUNTS}
        currentQuestion={examState.currentQuestion}
        answers={examState.answers}
        getQuestionId={(si, qi) => getQuestionId(questions, si, qi)}
        answeredInSection={answeredInSection(examState.currentSection)}
        sectionTotal={MOCK_SECTION_COUNTS[examState.currentSection]}
        onQuestionSelect={(i) => setExamState((s) => ({ ...s, currentQuestion: i }))}
        onSectionSubmit={() => handleSectionSubmit(examState.currentSection)}
      />

      <div className="ml-0 max-w-[800px] px-4 py-8 md:ml-[200px] md:px-8" style={{ marginTop: 64 }}>
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

        <div className="mt-8 flex justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={navigatePrev}
            disabled={examState.currentSection === 0 && examState.currentQuestion === 0}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={navigateNext}
            disabled={
              examState.currentSection === 3 &&
              examState.currentQuestion === MOCK_SECTION_COUNTS[3] - 1
            }
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#0d1b35" }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
