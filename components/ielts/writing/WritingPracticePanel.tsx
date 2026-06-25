"use client";

import { useMemo, useState } from "react";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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

  const words = useMemo(() => countWords(essay), [essay]);
  const minWords = taskType === "task1" ? 150 : 250;
  const belowMinimum = words > 0 && words < minWords;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!essay.trim()) {
      setError("Please write your response first.");
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
          }}
          className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {defaultTaskType === "task1" ? (
        <p className="text-sm text-slate-600">
          Describe charts, graphs, maps, or processes — minimum 150 words.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Write a formal essay — minimum 250 words. Opinion, discussion, or
          problem-solution formats.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {(["task1", "task2"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTaskType(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              taskType === t
                ? "bg-[#c9972c] text-[#0d1b35]"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {t === "task1" ? "Task 1" : "Task 2"}
          </button>
        ))}
      </div>

      <textarea
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        rows={12}
        placeholder="Paste or write your essay here…"
        disabled={loading}
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]/30"
      />
      <p
        className={`mt-2 text-xs font-medium ${belowMinimum ? "text-red-600" : "text-slate-500"}`}
      >
        {words} words {belowMinimum ? `(need ${minWords}+)` : ""}
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || !essay.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9972c] py-3 text-sm font-bold text-[#0d1b35] disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1b35]/30 border-t-[#0d1b35]" />
            AI scoring…
          </>
        ) : (
          "Submit for AI score (TA/CC/LR/GRA)"
        )}
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Saudi-specific errors (articles, word order) are highlighted in feedback.
        Model answers at your target band appear after submission.
      </p>
    </form>
  );
}
