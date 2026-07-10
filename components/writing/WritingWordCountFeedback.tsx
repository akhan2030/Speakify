"use client";

import type { WritingTaskType } from "@/lib/ielts/writingCriteria";
import {
  canSubmitWriting,
  countWritingWords,
  getWritingWordCountZone,
  getWritingWordLimits,
  submitLabelForWritingSubmission,
  writingSubmitHintMessage,
  writingUnderMinimumNotice,
  writingWordCountStatusMessage,
  writingWordMaximumReachedMessage,
  writingWordRequirementsSummary,
} from "@/lib/ielts/writingCriteria";

export default function WritingWordCountFeedback({
  text,
  taskType,
}: {
  text: string;
  taskType: WritingTaskType;
}) {
  const words = countWritingWords(text);
  const zone = getWritingWordCountZone(text, taskType);
  const { max: maxWords } = getWritingWordLimits(taskType);
  const atMaximum = zone === "exam_ready" && words === maxWords;

  const wordCountClass =
    zone === "empty"
      ? "text-slate-500"
      : zone === "practice"
        ? "text-amber-700"
        : zone === "over_limit"
          ? "text-[#E24B4A]"
          : "text-green-600";

  const readyLabel =
    zone === "exam_ready"
      ? "✓ Ready to submit"
      : zone === "practice"
        ? "✓ Feedback available (under IELTS minimum)"
        : null;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${wordCountClass}`}>
            Word count: <span className="font-bold">{words}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {writingWordCountStatusMessage(text, taskType)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {writingWordRequirementsSummary(taskType)}
          </p>
        </div>
        {readyLabel ? (
          <span
            className={`text-xs font-medium ${
              zone === "exam_ready" ? "text-green-600" : "text-amber-700"
            }`}
          >
            {readyLabel}
          </span>
        ) : null}
      </div>

      {zone === "practice" ? (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {writingUnderMinimumNotice(taskType)}
        </div>
      ) : null}

      {atMaximum ? (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {writingWordMaximumReachedMessage(taskType)}
        </div>
      ) : null}
    </>
  );
}

export function writingSubmitButtonLabel(text: string, taskType: WritingTaskType) {
  return submitLabelForWritingSubmission(text, taskType);
}

export function writingSubmitHint(text: string, taskType: WritingTaskType) {
  return writingSubmitHintMessage(text, taskType);
}

export function writingCanSubmit(text: string, taskType: WritingTaskType) {
  return canSubmitWriting(text, taskType);
}
