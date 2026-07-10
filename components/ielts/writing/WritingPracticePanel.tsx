"use client";

import Link from "next/link";
import { useState } from "react";
import {
  canSubmitWriting,
  submitLabelForWritingTask,
  writingWordLimitExceededMessage,
} from "@/lib/ielts/writingCriteria";
import { resolveWritingOverallBand } from "@/lib/ielts/writingBandScore";
import {
  lessonsForTrack,
  sharedWritingLessons,
} from "@/lib/ielts/writingLessons";
import {
  setTask1QuestionById,
  setTask2QuestionById,
  type Task1Question,
  type Task2Question,
} from "@/lib/ielts/writingTaskData";
import { recordPromptAttempt } from "@/lib/ielts/writingPromptAttempts";
import WritingPracticeForm from "@/components/writing/WritingPracticeForm";
import GuidedWritingMode from "@/components/writing/GuidedWritingMode";
import WritingPromptPicker from "@/components/ielts/writing/WritingPromptPicker";

type PracticeMode = "full" | "guided";

export default function WritingPracticePanel({
  defaultTaskType = "task2",
}: {
  defaultTaskType?: "task1" | "task2";
}) {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("full");
  const [taskType] = useState<"task1" | "task2">(defaultTaskType);
  const [selectedTask1, setSelectedTask1] = useState<Task1Question | null>(null);
  const [selectedTask2, setSelectedTask2] = useState<Task2Question | null>(null);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [overallBand, setOverallBand] = useState<number | null>(null);

  const selectedPrompt = taskType === "task1" ? selectedTask1 : selectedTask2;
  const promptId = selectedPrompt?.id;

  const fullModeLabel = taskType === "task1" ? "Full Report Mode" : "Full Essay Mode";

  function handleSelectPrompt(prompt: Task1Question | Task2Question) {
    if (taskType === "task1") {
      const t1 = prompt as Task1Question;
      setSelectedTask1(t1);
      setTask1QuestionById(t1.id);
    } else {
      const t2 = prompt as Task2Question;
      setSelectedTask2(t2);
      setTask2QuestionById(t2.id);
    }
    setEssay("");
    setEvaluation(null);
    setOverallBand(null);
    setError(null);
  }

  function handleChangePrompt() {
    if (taskType === "task1") setSelectedTask1(null);
    else setSelectedTask2(null);
    setEssay("");
    setEvaluation(null);
    setOverallBand(null);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!essay.trim()) {
      setError("Please write your response first.");
      return;
    }

    if (!canSubmitWriting(essay, taskType)) {
      setError(writingWordLimitExceededMessage(taskType));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay,
          taskType,
          mode: "full",
          promptId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Evaluation failed. Try again.");
        return;
      }
      if (promptId) recordPromptAttempt(promptId);
      setEvaluation(String(data.evaluation || ""));
      setOverallBand(
        resolveWritingOverallBand(data.bands, String(data.evaluation || ""))
      );
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(mode: PracticeMode) {
    setPracticeMode(mode);
    setEvaluation(null);
    setEssay("");
    setOverallBand(null);
    setError(null);
  }

  if (!selectedPrompt) {
    return <WritingPromptPicker taskType={taskType} onSelectPrompt={handleSelectPrompt} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleChangePrompt}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Choose a different prompt
        </button>
        <span className="text-xs text-slate-500">
          {taskType === "task1"
            ? (selectedPrompt as Task1Question).title
            : (selectedPrompt as Task2Question).title}
        </span>
      </div>

      <Link
        href={`/dashboard/ielts/student/writing?tab=lessons&track=${taskType}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-[#c9972c]/40 hover:bg-[#c9972c]/5"
      >
        <span className="text-slate-700">
          <span className="font-bold text-[#0d1b35]">
            {taskType === "task1" ? "Task 1 lessons" : "Task 2 lessons"}
          </span>
          <span className="hidden sm:inline">
            {" "}
            — {lessonsForTrack(taskType).length} core +{" "}
            {sharedWritingLessons().length} shared skills
          </span>
        </span>
        <span className="shrink-0 text-xs font-bold text-[#c9972c]">Open →</span>
      </Link>

      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => handleModeChange("full")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            practiceMode === "full"
              ? "bg-[#0d1b35] text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {fullModeLabel}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("guided")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            practiceMode === "guided"
              ? "bg-[#c9972c] text-[#0d1b35]"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Guided Paragraph Mode
        </button>
      </div>

      {practiceMode === "guided" ? (
        <GuidedWritingMode
          taskType={taskType}
          task1Question={selectedTask1 ?? undefined}
          task2Question={selectedTask2 ?? undefined}
          promptId={promptId}
          hidePromptPicker
        />
      ) : evaluation ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {overallBand != null ? (
            <p className="text-center text-4xl font-bold text-[#c9972c]">
              Band {overallBand.toFixed(1)}
            </p>
          ) : null}
          <div className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
            {evaluation}
          </div>
          <button
            type="button"
            onClick={() => {
              setEvaluation(null);
              setEssay("");
              setOverallBand(null);
              setError(null);
            }}
            className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
          >
            Submit another
          </button>
        </div>
      ) : (
        <WritingPracticeForm
          taskType={taskType}
          onTaskTypeChange={() => {}}
          essay={essay}
          onEssayChange={setEssay}
          loading={loading}
          error={error}
          onSubmit={onSubmit}
          hideTaskToggle
          hidePromptPicker
          task1Question={selectedTask1 ?? undefined}
          task2Question={selectedTask2 ?? undefined}
          formClassName="space-y-6"
          submitLabel={submitLabelForWritingTask(taskType)}
        />
      )}
    </div>
  );
}
