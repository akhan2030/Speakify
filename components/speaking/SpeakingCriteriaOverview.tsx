"use client";

import {
  SPEAKING_CRITERION_WEIGHT_PERCENT,
  speakingCriteriaLabels,
} from "@/lib/ielts/speakingCriteria";

export default function SpeakingCriteriaOverview({
  programmeLabel,
}: {
  /** e.g. "IELTS Academic" or "IELTS General Training" */
  programmeLabel?: string;
}) {
  const labels = speakingCriteriaLabels();

  return (
    <div className="mt-2">
      {programmeLabel ? (
        <p className="text-sm font-medium text-[#0d9488]">{programmeLabel}</p>
      ) : null}
      <p className="text-sm text-slate-600">
        Your speaking band is the average of four criteria — each carries{" "}
        <span className="font-semibold text-[#0d1b35]">
          {SPEAKING_CRITERION_WEIGHT_PERCENT}%
        </span>{" "}
        of your score (Parts 1, 2 & 3 combined).
      </p>
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#0d1b35]">
          Scoring criteria
        </p>
        <ul className="mt-1.5 space-y-1">
          {labels.map((label) => (
            <li
              key={label}
              className="flex items-baseline justify-between gap-2 text-sm text-slate-700"
            >
              <span>{label}</span>
              <span className="shrink-0 text-xs font-semibold text-[#c9972c]">
                {SPEAKING_CRITERION_WEIGHT_PERCENT}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
