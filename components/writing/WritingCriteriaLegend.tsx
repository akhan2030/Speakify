"use client";

import type { WritingTaskType } from "@/lib/ielts/writingCriteria";
import {
  WRITING_CRITERION_WEIGHT_PERCENT,
  writingCriteriaLabels,
} from "@/lib/ielts/writingCriteria";

export default function WritingCriteriaLegend({
  taskType,
}: {
  taskType: WritingTaskType;
}) {
  const labels = writingCriteriaLabels(taskType);

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
      <p className="font-semibold text-[#0d1b35]">
        Scored on four criteria ({WRITING_CRITERION_WEIGHT_PERCENT}% each)
      </p>
      <ul className="mt-2 list-inside list-disc space-y-0.5">
        {labels.map((label) => (
          <li key={label}>
            {label} — <span className="font-medium">{WRITING_CRITERION_WEIGHT_PERCENT}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
