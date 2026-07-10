"use client";

import { HighlightableMcqOption } from "@/components/exam/ExamHighlightSection";
import type { StepMcqOption } from "@/lib/step/types";

const OPTS: StepMcqOption[] = ["A", "B", "C", "D"];

type Props = {
  questionId: string;
  options: Record<StepMcqOption, string>;
  selected?: string;
  onSelect: (opt: StepMcqOption) => void;
};

export default function MockOptionButtons({
  questionId,
  options,
  selected,
  onSelect,
}: Props) {
  return (
    <div className="space-y-2">
      {OPTS.map((opt) => {
        const active = selected === opt;
        return (
          <HighlightableMcqOption
            key={opt}
            blockId={`${questionId}-opt-${opt}`}
            letter={opt}
            text={options[opt]}
            name={questionId}
            checked={active}
            onSelect={() => onSelect(opt)}
            className={`border-2 px-4 py-3.5 text-[15px] ${
              active
                ? "border-[#0d1b35] bg-[#0d1b35] text-white [&_strong]:text-white"
                : "border-[#e5e7eb] bg-white"
            }`}
          />
        );
      })}
    </div>
  );
}
