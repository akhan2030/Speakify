"use client";

const LETTER_TYPE_LABELS = {
  formal: "Formal",
  semi_formal: "Semi-formal",
  informal: "Informal",
} as const;

export default function PlacementGtLetterPrompt({
  letterPrompt,
}: {
  letterPrompt: {
    letterType: keyof typeof LETTER_TYPE_LABELS;
    situation: string;
    writeTo: string;
    bulletPoints: string[];
    beginAs: string;
  };
}) {
  return (
    <div className="mb-4 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#0d9488] px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
          General Training Task 1
        </span>
        <span className="rounded-full border border-[#0d9488]/40 px-2.5 py-0.5 text-[10px] font-semibold text-[#0d9488]">
          {LETTER_TYPE_LABELS[letterPrompt.letterType]} letter
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#0d1b35]">{letterPrompt.situation}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Write a letter to {letterPrompt.writeTo}. In your letter, you should:
      </p>
      <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
        {letterPrompt.bulletPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Begin your letter as follows:
        </p>
        <p className="mt-1 font-medium text-[#0d1b35]">{letterPrompt.beginAs}</p>
      </div>
    </div>
  );
}
