"use client";

import { useState } from "react";
import { criteriaSummaryForTask } from "@/lib/ielts/writingCriteria";
import WritingPracticeForm from "@/components/writing/WritingPracticeForm";
import GuidedWritingMode from "@/components/writing/GuidedWritingMode";

type PracticeMode = "full" | "guided";

export default function WritingPracticePanel({
  defaultTaskType = "task2",
}: {
  defaultTaskType?: "task1" | "task2";
}) {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("full");
  const [taskType, setTaskType] = useState<"task1" | "task2">(defaultTaskType);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [overallBand, setOverallBand] = useState<number | null>(null);

  const fullModeLabel = "Full Report Mode";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const words = essay.trim().split(/\s+/).filter(Boolean).length;
    const minWords = taskType === "task1" ? 150 : 250;

    if (!essay.trim()) {
      setError("Please write your response first.");
      return;
    }

    if (words < minWords) {
      setError(`Your response must be at least ${minWords} words.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay, taskType, mode: "full" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Evaluation failed. Try again.");
        return;
      }
      setEvaluation(String(data.evaluation || ""));
      if (data.bands?.overall != null) {
        setOverallBand(Number(data.bands.overall));
      } else {
        const m = String(data.evaluation || "").match(
          /Overall Band\s*:\s*([0-9]+(?:\.[0-9])?)/i
        );
        setOverallBand(m ? Number(m[1]) : null);
      }
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

  return (
    <div className="space-y-6">
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
        <GuidedWritingMode taskType={taskType} />
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
          onTaskTypeChange={setTaskType}
          essay={essay}
          onEssayChange={setEssay}
          loading={loading}
          error={error}
          onSubmit={onSubmit}
          hideTaskToggle
          formClassName="space-y-6"
          submitLabel={`Submit for AI score (${criteriaSummaryForTask(taskType)})`}
        />
      )}
    </div>
  );
}
