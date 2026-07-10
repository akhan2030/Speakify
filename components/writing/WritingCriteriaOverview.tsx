"use client";

import type { WritingTaskType } from "@/lib/ielts/writingCriteria";
import {
  WRITING_CRITERION_WEIGHT_PERCENT,
  writingCriteriaLabels,
} from "@/lib/ielts/writingCriteria";

function TaskCriteriaBlock({
  taskLabel,
  taskType,
}: {
  taskLabel: string;
  taskType: WritingTaskType;
}) {
  const labels = writingCriteriaLabels(taskType);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#0d1b35]">
        {taskLabel}
      </p>
      <ul className="mt-1.5 space-y-1">
        {labels.map((label) => (
          <li key={label} className="text-sm text-slate-700">
            <span>{label}</span>
            <span className="ml-2 text-xs font-semibold text-[#c9972c]">
              — {WRITING_CRITERION_WEIGHT_PERCENT}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WritingCriteriaOverview({
  task1Label = "Task 1",
  task2Label = "Task 2",
}: {
  task1Label?: string;
  task2Label?: string;
}) {
  return (
    <div className="mt-2">
      <p className="text-sm text-slate-600">
        Your writing band is the average of four criteria — each carries{" "}
        <span className="font-semibold text-[#0d1b35]">
          {WRITING_CRITERION_WEIGHT_PERCENT}%
        </span>{" "}
        of your score.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TaskCriteriaBlock taskLabel={task1Label} taskType="task1" />
        <TaskCriteriaBlock taskLabel={task2Label} taskType="task2" />
      </div>
    </div>
  );
}
