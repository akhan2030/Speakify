"use client";

export default function MCQBlock({
  id,
  prompt,
  options,
  value,
  onChange,
  disabled,
  correct,
}: {
  id: string;
  prompt: string;
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  correct?: boolean | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="font-medium text-slate-900">{prompt}</p>
      <div className="mt-3 space-y-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"
          >
            <input
              type="radio"
              name={`mcq-${id}`}
              className="mt-1"
              checked={value === opt}
              disabled={disabled}
              onChange={() => onChange(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {correct != null ? (
        <p
          className={`mt-2 text-xs font-semibold ${
            correct ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {correct ? "Correct" : "Incorrect"}
        </p>
      ) : null}
    </div>
  );
}
