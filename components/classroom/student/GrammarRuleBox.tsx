"use client";

export type GrammarRuleBoxProps = {
  title: string;
  explanation?: string[];
  examples?: string[] | { label?: string; text: string }[];
};

function normalizeExample(
  ex: string | { label?: string; text: string },
  index: number
): { key: string; label?: string; text: string } {
  if (typeof ex === "string") {
    return { key: `${index}-${ex.slice(0, 24)}`, text: ex };
  }
  return { key: `${index}-${ex.text.slice(0, 24)}`, label: ex.label, text: ex.text };
}

export default function GrammarRuleBox({
  title,
  explanation = [],
  examples = [],
}: GrammarRuleBoxProps) {
  const normalized = examples.map(normalizeExample);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        Grammar
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>

      {explanation.length > 0 ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-slate-700">
          {explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {normalized.length > 0 ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Examples
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {normalized.map((ex) => (
              <div
                key={ex.key}
                className="rounded-lg border border-slate-100 bg-[#f7f4ef] px-3 py-2.5 text-sm text-slate-800"
              >
                {ex.label ? (
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#8a6a1f]">
                    {ex.label}
                  </span>
                ) : null}
                {ex.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
