import type { StepMcqOption } from "@/lib/step/types";

const OPTS: StepMcqOption[] = ["A", "B", "C", "D"];

type Props = {
  options: Record<StepMcqOption, string>;
  selected?: string;
  onSelect: (opt: StepMcqOption) => void;
};

export default function MockOptionButtons({ options, selected, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {OPTS.map((opt) => {
        const active = selected === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className="flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-left text-[15px] transition"
            style={{
              borderColor: active ? "#0d1b35" : "#e5e7eb",
              background: active ? "#0d1b35" : "white",
              color: active ? "white" : "#0d1b35",
            }}
          >
            <span className="min-w-[24px] font-bold">{opt}.</span>
            {options[opt]}
          </button>
        );
      })}
    </div>
  );
}
