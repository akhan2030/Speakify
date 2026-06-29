"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MINI_MOCK_SECTION_COUNTS, MINI_MOCK_TIME_SECONDS } from "@/lib/step/miniMock/constants";
import type { MockExamClientQuestion, MockExamPayload } from "@/lib/step/mockExam/types";
import CompositionalQuestion from "@/components/step/mock-test/CompositionalQuestion";
import ListeningQuestion from "@/components/step/mock-test/ListeningQuestion";
import QuestionNavPanel from "@/components/step/mock-test/QuestionNavPanel";
import ReadingQuestion from "@/components/step/mock-test/ReadingQuestion";
import StructureQuestion from "@/components/step/mock-test/StructureQuestion";
import MiniMockHeader from "./MiniMockHeader";
import type { StepMcqOption } from "@/lib/step/types";

const TOTAL = 20;
const SECTION_COUNTS = [...MINI_MOCK_SECTION_COUNTS];

type ExamState = {
  status: "in_progress" | "submitted";
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
  return sectionQuestions(payload, sectionIndex)[questionIndex]?.id ?? "";
}

export default function MiniMockRunner({ attemptId, questions, onSubmitted }: Props) {
  const [examState, setExamState] = useState<ExamState>(() => ({
    status: "in_progress",
    currentSection: 0,
    currentQuestion: 0,
    answers: {},
    timeRemaining: MINI_MOCK_TIME_SECONDS,
    attemptId,
    listeningPlayed: {},
    sectionSubmitted: [false, false, false, false],
  }));
  const [submitting, setSubmitting] = useState(false);
  const warned5 = useRef(false);
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
      if (!auto && answered < TOTAL) return;
      if (!auto) {
        const ok = window.confirm(`Submit mini mock?\n\nAnswered: ${answered}/${TOTAL}`);
        if (!ok) return;
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/step/mini-mock/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: state.attemptId,
            answers: state.answers,
            timeSpent: MINI_MOCK_TIME_SECONDS - state.timeRemaining,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Submit failed");
        sessionStorage.setItem(`step-mini-result-${state.attemptId}`, JSON.stringify(json));
        setExamState((s) => ({ ...s, status: "submitted" }));
        onSubmitted(state.attemptId!);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not submit");
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
        if (next === 300 && !warned5.current) {
          warned5.current = true;
          window.alert("⚠ 5 minutes remaining");
        }
        return { ...prev, timeRemaining: next };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [examState.status, handleFinalSubmit]);

  const handleAnswer = (section: number, qIndex: number, ans: StepMcqOption) => {
    const qId = getQuestionId(questions, section, qIndex);
    if (!qId) return;
    setExamState((s) => ({ ...s, answers: { ...s.answers, [qId]: ans } }));
  };

  const totalAnswered = Object.keys(examState.answers).length;
  const allAnswered = totalAnswered >= TOTAL;
  const currentQs = sectionQuestions(questions, examState.currentSection);
  const currentQ = currentQs[examState.currentQuestion];
  if (!currentQ) return <p className="p-8 text-slate-500">Loading…</p>;

  return (
    <div className="min-h-screen bg-white pb-28">
      <MiniMockHeader
        examState={examState}
        sectionCounts={SECTION_COUNTS}
        answeredInSection={answeredInSection}
        onSectionChange={(i) =>
          setExamState((s) => ({ ...s, currentSection: i, currentQuestion: 0 }))
        }
        totalAnswered={totalAnswered}
        submitting={submitting}
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
        onSectionSubmit={() => {}}
      />

      <div className="ml-0 max-w-[800px] px-4 py-8 md:ml-[200px] md:px-8" style={{ marginTop: 64 }}>
        {examState.currentSection === 0 && (
          <ReadingQuestion
            question={currentQ}
            answer={examState.answers[currentQ.id]}
            onAnswer={(ans) => handleAnswer(0, examState.currentQuestion, ans)}
            questionNumber={examState.currentQuestion + 1}
          />
        )}
        {examState.currentSection === 1 && (
          <StructureQuestion
            question={currentQ}
            answer={examState.answers[currentQ.id]}
            onAnswer={(ans) => handleAnswer(1, examState.currentQuestion, ans)}
            questionNumber={examState.currentQuestion + 1}
          />
        )}
        {examState.currentSection === 2 && (
          <ListeningQuestion
            question={currentQ}
            answer={examState.answers[currentQ.id]}
            onAnswer={(ans) => handleAnswer(2, examState.currentQuestion, ans)}
            hasPlayed={Boolean(examState.listeningPlayed[currentQ.recordingId ?? currentQ.id])}
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
            answer={examState.answers[currentQ.id]}
            onAnswer={(ans) => handleAnswer(3, examState.currentQuestion, ans)}
            questionNumber={examState.currentQuestion + 1}
          />
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white px-4 py-4 md:px-8"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="text-sm text-slate-600">
            {allAnswered ? "All questions answered" : `${totalAnswered}/20 answered`}
          </span>
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={() => handleFinalSubmit(false)}
            className="rounded-xl px-8 py-3 text-sm font-bold text-[#0d1b35] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: allAnswered ? "#c9972c" : "#e2e8f0" }}
          >
            Submit Mini Mock →
          </button>
        </div>
      </div>
    </div>
  );
}
