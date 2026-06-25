"use client";

import Link from "next/link";
import { useState } from "react";
import type { TaskWithProgress } from "@/components/pathway/usePathwayStudent";
import { setStoredTaskProgress } from "@/components/pathway/usePathwayStudent";

export default function PathwayTaskCard({
  task,
  skillHref,
  onComplete,
}: {
  task: TaskWithProgress;
  skillHref: string;
  onComplete?: (taskId: string) => void;
}) {
  const [progress, setProgress] = useState(task.progressPercent);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  function handleStart() {
    setActive(true);
    setFeedback(null);
    if (progress < 25) {
      setProgress(25);
      setStoredTaskProgress(task.id, 25);
    }
  }

  function handleComplete() {
    setProgress(100);
    setStoredTaskProgress(task.id, 100);
    setFeedback(
      "Well done — task recorded. Review the objective tomorrow for spaced practice."
    );
    onComplete?.(task.id);
  }

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        task.completed ? "border-green-300" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
            Week {task.week} · {task.level}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0d1b35]">{task.title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {task.minutes} min
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        <span className="font-semibold text-[#0d1b35]">Objective: </span>
        {task.objective}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-semibold text-[#0d1b35]">Instructions: </span>
        {task.instructions}
      </p>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#0d9488] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!task.completed ? (
          <>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35] hover:opacity-95"
            >
              {active ? "Continue →" : "Start"}
            </button>
            {active ? (
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-lg border border-[#0d9488] px-4 py-2 text-sm font-semibold text-[#0d9488] hover:bg-[#0d9488]/10"
              >
                Mark complete
              </button>
            ) : null}
          </>
        ) : (
          <span className="text-sm font-semibold text-green-700">✓ Completed</span>
        )}
        <Link
          href={skillHref}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-[#0d1b35]"
        >
          View skill →
        </Link>
      </div>

      {feedback ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {feedback}
        </p>
      ) : null}
    </article>
  );
}
