"use client";

import type { SectionType } from "@/lib/classroom/types";

const OPTIONS: { value: SectionType; label: string }[] = [
  { value: "objectives", label: "Objectives" },
  { value: "warm_up", label: "Warm-up" },
  { value: "reading", label: "Reading" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "grammar", label: "Grammar" },
  { value: "listening", label: "Listening" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "mcq", label: "MCQ" },
  { value: "gap_fill", label: "Gap fill" },
  { value: "matching", label: "Matching" },
  { value: "true_false", label: "True / False" },
  { value: "cultural_bridge", label: "Cultural bridge" },
  { value: "reflection", label: "Reflection" },
];

export default function SectionTypePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: SectionType) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">Section type</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SectionType)}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
