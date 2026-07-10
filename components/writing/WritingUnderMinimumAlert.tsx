"use client";

import type { WritingTaskType } from "@/lib/ielts/writingCriteria";
import { writingUnderMinimumNoticeParts } from "@/lib/ielts/writingCriteria";

/** Bold, highlighted under-minimum alert — Academic & General, Task 1 & Task 2. */
export default function WritingUnderMinimumAlert({
  taskType,
  variant = "full",
}: {
  taskType: WritingTaskType;
  /** full = large alert when below minimum; compact = always-visible requirement strip */
  variant?: "full" | "compact";
}) {
  const { taskLabel, minWords, criterionLabel } =
    writingUnderMinimumNoticeParts(taskType);

  if (variant === "compact") {
    return (
      <div className="mt-2 rounded-lg border-2 border-[#c9972c]/50 bg-[#c9972c]/15 px-3 py-2.5">
        <p className="text-sm font-bold leading-snug text-[#0d1b35]">
          <span className="mr-1.5 inline-block rounded bg-[#c9972c] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0d1b35]">
            IELTS rule
          </span>
          {taskLabel} requires at least{" "}
          <span className="rounded bg-[#c9972c]/40 px-1.5 py-0.5 text-[#0d1b35]">
            {minWords} words
          </span>{" "}
          in the real exam.
        </p>
        <p className="mt-1 text-xs font-semibold text-amber-900">
          Shorter drafts can still be submitted for feedback —{" "}
          <span className="font-bold underline decoration-amber-600/60">
            {criterionLabel}
          </span>{" "}
          will reflect the short length.
        </p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mt-3 rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-100 via-amber-50 to-[#c9972c]/20 px-4 py-4 shadow-md ring-2 ring-amber-400/40"
    >
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-950">
        <span
          aria-hidden
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white"
        >
          !
        </span>
        Below IELTS minimum length
      </p>
      <p className="mt-3 text-base font-bold leading-snug text-[#0d1b35]">
        {taskLabel} requires at least{" "}
        <mark className="rounded-md bg-[#c9972c] px-2 py-0.5 font-extrabold text-[#0d1b35] no-underline">
          {minWords} words
        </mark>{" "}
        in the real IELTS exam.
      </p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950">
        You can still{" "}
        <strong className="font-extrabold text-[#0d1b35] underline decoration-amber-600">
          submit shorter drafts for feedback
        </strong>{" "}
        —{" "}
        <strong className="rounded bg-amber-200/80 px-1.5 py-0.5 font-extrabold text-[#0d1b35]">
          {criterionLabel}
        </strong>{" "}
        will reflect the short length.
      </p>
    </div>
  );
}
