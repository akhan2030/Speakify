"use client";

import { useState } from "react";
import WritingPracticeForm from "@/components/writing/WritingPracticeForm";

export default function WritingPracticePanel({
  defaultTaskType = "task2",
}: {
  defaultTaskType?: "task1" | "task2";
}) {
  const [taskType, setTaskType] = useState<"task1" | "task2">(defaultTaskType);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [overallBand, setOverallBand] = useState<number | null>(null);

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
        body: JSON.stringify({ essay, taskType }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Evaluation failed. Try again.");
        return;
      }
      setEvaluation(String(data.evaluation || ""));
      const m = String(data.evaluation || "").match(
        /Overall[^0-9]*([0-9]+(?:\.[0-9])?)/i
      );
      setOverallBand(m ? Number(m[1]) : null);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (evaluation) {
    return (
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
    );
  }

  return (
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
      submitLabel="Submit for AI score (TA/CC/LR/GRA)"
    />
  );
}
