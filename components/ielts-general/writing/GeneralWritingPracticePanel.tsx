"use client";

import { useCallback, useState } from "react";
import { criteriaSummaryForTask } from "@/lib/ielts/writingCriteria";
import GeneralWritingPracticeForm from "@/components/ielts-general/writing/GeneralWritingPracticeForm";
import type { LetterType } from "@/lib/ielts-general/writingTaskData";

export default function GeneralWritingPracticePanel({
  lockTaskType,
}: {
  /** When set, only letter (task1) or essay (task2) — never Academic graph reports. */
  lockTaskType: "task1" | "task2";
}) {
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [overallBand, setOverallBand] = useState<number | null>(null);
  const [questionMeta, setQuestionMeta] = useState<{
    questionPrompt: string;
    letterType?: LetterType;
    essayType?: string;
  }>({ questionPrompt: "" });

  const handleQuestionChange = useCallback(
    (meta: {
      questionPrompt: string;
      letterType?: LetterType;
      essayType?: string;
    }) => {
      setQuestionMeta(meta);
    },
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const words = essay.trim().split(/\s+/).filter(Boolean).length;
    const minWords = lockTaskType === "task1" ? 150 : 250;

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
      const res = await fetch("/api/ielts-general/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay,
          taskType: lockTaskType,
          questionPrompt: questionMeta.questionPrompt,
          letterType: questionMeta.letterType,
          essayType: questionMeta.essayType,
        }),
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

  if (evaluation) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
          IELTS General Training — {lockTaskType === "task1" ? "Task 1 Letter" : "Task 2 Essay"}
        </p>
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
    <GeneralWritingPracticeForm
      taskType={lockTaskType}
      essay={essay}
      onEssayChange={setEssay}
      loading={loading}
      error={error}
      onSubmit={onSubmit}
      formClassName="space-y-6"
      submitLabel={`Submit for AI score (${criteriaSummaryForTask(lockTaskType)})`}
      onQuestionChange={handleQuestionChange}
    />
  );
}
