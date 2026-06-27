"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TASK1_QUESTIONS,
  TASK2_QUESTIONS,
  getSessionTask1Question,
  getSessionTask2Question,
  setTask1QuestionIndex,
  setTask2QuestionIndex,
  type Task1Question,
  type Task2Question,
} from "@/lib/ielts/writingTaskData";
import WritingTaskVisual from "@/components/writing/WritingTaskVisual";
import { getGuidedSteps, type GuidedStep } from "@/lib/ielts/writingGuidedMode";
import ParagraphFeedbackCard, {
  type ParagraphFeedbackData,
} from "@/components/writing/ParagraphFeedbackCard";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const VISUAL_TYPE_LABELS: Record<Task1Question["visualType"], string> = {
  bar: "Bar chart",
  line: "Line graph",
  pie: "Pie chart",
  table: "Table",
  map: "Map",
  process: "Process diagram",
};

type Props = {
  taskType: "task1" | "task2";
};

function StepProgressBar({
  steps,
  currentIndex,
  completedCount,
}: {
  steps: GuidedStep[];
  currentIndex: number;
  completedCount: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Guided paragraph progress
      </p>
      <div className="mt-3 flex gap-1">
        {steps.map((step, i) => {
          const done = i < completedCount;
          const active = i === currentIndex;
          return (
            <div key={step.id} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full transition-colors ${
                  done
                    ? "bg-[#0d9488]"
                    : active
                      ? "bg-[#c9972c]"
                      : "bg-slate-200"
                }`}
              />
              <span
                className={`text-[10px] font-semibold sm:text-xs ${
                  active ? "text-[#c9972c]" : done ? "text-[#0d9488]" : "text-slate-400"
                }`}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-sm font-medium text-[#0d1b35]">
        Paragraph {Math.min(currentIndex + 1, steps.length)} of {steps.length}:{" "}
        {steps[currentIndex]?.label ?? "Complete"}
      </p>
    </div>
  );
}

function QuestionPanel({
  taskType,
  task1Question,
  task2Question,
  loading,
  onTask1Select,
  onTask2Select,
}: {
  taskType: "task1" | "task2";
  task1Question: Task1Question;
  task2Question: Task2Question;
  loading: boolean;
  onTask1Select: (index: number) => void;
  onTask2Select: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[#0d1b35] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          IELTS Academic — Writing {taskType === "task1" ? "Task 1" : "Task 2"}
        </span>
        {taskType === "task1" ? (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">Visual type:</span>
            <select
              value={TASK1_QUESTIONS.findIndex((q) => q.id === task1Question.id)}
              onChange={(e) => onTask1Select(Number(e.target.value))}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
            >
              {TASK1_QUESTIONS.map((q, i) => (
                <option key={q.id} value={i}>
                  {VISUAL_TYPE_LABELS[q.visualType]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">Essay type:</span>
            <select
              value={TASK2_QUESTIONS.findIndex((q) => q.id === task2Question.id)}
              onChange={(e) => onTask2Select(Number(e.target.value))}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
            >
              {TASK2_QUESTIONS.map((q, i) => (
                <option key={q.id} value={i}>
                  {q.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#0d1b35]">
        {taskType === "task1" ? task1Question.prompt : task2Question.prompt}
      </div>

      {taskType === "task1" ? (
        <div className="mt-5">
          <WritingTaskVisual question={task1Question} />
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-[#0d9488]/30 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Essay type
          </p>
          <p className="mt-1 text-base font-bold text-[#0d9488]">{task2Question.label}</p>
        </div>
      )}
    </div>
  );
}

export default function GuidedWritingMode({ taskType }: Props) {
  const steps = useMemo(() => getGuidedSteps(taskType), [taskType]);
  const [task1Question, setTask1Question] = useState<Task1Question | null>(null);
  const [task2Question, setTask2Question] = useState<Task2Question | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [p1Text, setP1Text] = useState("");
  const [p2Text, setP2Text] = useState("");
  const [p3Text, setP3Text] = useState("");
  const [draft, setDraft] = useState("");
  const [feedbacks, setFeedbacks] = useState<ParagraphFeedbackData[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<ParagraphFeedbackData | null>(null);
  const [phase, setPhase] = useState<"writing" | "feedback" | "complete">("writing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = steps[stepIndex];
  const words = useMemo(() => countWords(draft), [draft]);
  const meetsMin = words >= (currentStep?.wordTargetMin ?? 15);

  const visualType = task1Question
    ? VISUAL_TYPE_LABELS[task1Question.visualType]
    : undefined;
  const essayType = task2Question?.essayType ?? task2Question?.label;

  useEffect(() => {
    setTask1Question(getSessionTask1Question());
    setTask2Question(getSessionTask2Question());
  }, []);

  useEffect(() => {
    resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType]);

  function resetSession() {
    setStepIndex(0);
    setP1Text("");
    setP2Text("");
    setP3Text("");
    setDraft("");
    setFeedbacks([]);
    setPendingFeedback(null);
    setPhase("writing");
    setError(null);
  }

  function handleTask1Select(index: number) {
    setTask1QuestionIndex(index);
    setTask1Question(TASK1_QUESTIONS[index % TASK1_QUESTIONS.length]);
    resetSession();
  }

  function handleTask2Select(index: number) {
    setTask2QuestionIndex(index);
    setTask2Question(TASK2_QUESTIONS[index % TASK2_QUESTIONS.length]);
    resetSession();
  }

  const questionPrompt =
    taskType === "task1" ? task1Question?.prompt ?? "" : task2Question?.prompt ?? "";

  function saveParagraphToState(text: string) {
    if (stepIndex === 0) setP1Text(text);
    else if (stepIndex === 1) setP2Text(text);
    else if (stepIndex === 2) setP3Text(text);
  }

  async function submitParagraph() {
    if (!currentStep || !draft.trim()) {
      setError("Write this paragraph before submitting.");
      return;
    }
    if (!meetsMin) {
      setError(
        `Aim for at least ${currentStep.wordTargetMin} words for this paragraph (you have ${words}).`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "paragraph",
          taskType,
          stepIndex,
          paragraphText: draft,
          questionPrompt,
          visualType: taskType === "task1" ? visualType : undefined,
          essayType: taskType === "task2" ? essayType : undefined,
          p1Text,
          p2Text,
          p3Text,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Evaluation failed. Try again.");
        return;
      }

      const feedback: ParagraphFeedbackData = {
        stepLabel: data.stepLabel,
        paragraphNumber: data.paragraphNumber,
        isFinal: Boolean(data.isFinal),
        paragraphBand: data.paragraphBand ?? null,
        bands: data.bands ?? {
          ta: null,
          cc: null,
          lr: null,
          gra: null,
          overall: null,
        },
        feedback: data.feedback ?? {
          taskAchievement: "",
          coherenceCohesion: "",
          lexicalResource: "",
          grammaticalRange: "",
          strengths: "",
          priorityFix: "",
          modelSentence: "",
          fullResponseSummary: "",
          nextSteps: "",
        },
      };

      saveParagraphToState(draft.trim());
      setPendingFeedback(feedback);
      setPhase("feedback");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleNextStep() {
    if (!pendingFeedback) return;

    setFeedbacks((prev) => [...prev, pendingFeedback]);
    setPendingFeedback(null);
    setDraft("");
    setError(null);

    if (pendingFeedback.isFinal) {
      setPhase("complete");
      return;
    }

    setStepIndex((i) => i + 1);
    setPhase("writing");
  }

  if (!task1Question || !task2Question) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  if (phase === "complete" && feedbacks.length > 0) {
    const finalFeedback = feedbacks[feedbacks.length - 1];
    return (
      <div className="space-y-6">
        <QuestionPanel
          taskType={taskType}
          task1Question={task1Question}
          task2Question={task2Question}
          loading
          onTask1Select={handleTask1Select}
          onTask2Select={handleTask2Select}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ParagraphFeedbackCard data={finalFeedback} />
        </div>
        <button
          type="button"
          onClick={resetSession}
          className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
        >
          Start a new guided session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuestionPanel
        taskType={taskType}
        task1Question={task1Question}
        task2Question={task2Question}
        loading={loading}
        onTask1Select={handleTask1Select}
        onTask2Select={handleTask2Select}
      />

      <StepProgressBar
        steps={steps}
        currentIndex={stepIndex}
        completedCount={feedbacks.length}
      />

      {phase === "feedback" && pendingFeedback ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#0d9488]/30 bg-white p-5 shadow-sm">
            <ParagraphFeedbackCard data={pendingFeedback} />
          </div>

          {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}

          <button
            type="button"
            onClick={handleNextStep}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9972c] py-3 font-semibold text-[#0d1b35] disabled:opacity-60"
          >
            {pendingFeedback.isFinal ? "Finish session" : "Write Next Paragraph →"}
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-bold text-[#0d1b35]">
              Paragraph {stepIndex + 1}: {currentStep.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {currentStep.description}
            </p>
            <p className="mt-2 text-xs font-medium text-[#0d9488]">
              Target: {currentStep.wordTargetMin}–{currentStep.wordTargetMax} words · Focus:{" "}
              {currentStep.focusCriteria.join(", ")}
            </p>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={currentStep.placeholder}
              rows={6}
              disabled={loading}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]/30 disabled:bg-slate-50"
            />

            <p
              className={`mt-2 text-sm font-medium ${
                words === 0
                  ? "text-slate-500"
                  : meetsMin
                    ? "text-green-600"
                    : "text-[#E24B4A]"
              }`}
            >
              Word count: {words}{" "}
              <span className="text-slate-400">
                / target {currentStep.wordTargetMin}–{currentStep.wordTargetMax}
              </span>
            </p>
          </div>

          {feedbacks.length > 0 ? (
            <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-semibold text-[#0d1b35]">
                Previous paragraph feedback ({feedbacks.length})
              </summary>
              <div className="mt-3 space-y-4">
                {feedbacks.map((fb) => (
                  <div
                    key={`${fb.paragraphNumber}-${fb.stepLabel}`}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <ParagraphFeedbackCard data={fb} />
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}

          <button
            type="button"
            onClick={submitParagraph}
            disabled={loading || !draft.trim() || !meetsMin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9972c] py-3 font-semibold text-[#0d1b35] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1b35]/30 border-t-[#0d1b35]" />
                Evaluating paragraph…
              </>
            ) : (
              "Submit Paragraph"
            )}
          </button>
        </>
      )}
    </div>
  );
}
