"use client";

export type UnitHeaderProps = {
  levelCode: string;
  unitNumber: number;
  title: string;
  theme: string;
  grammarPoint1?: string;
  grammarPoint2?: string;
};

export default function UnitHeader({
  levelCode,
  unitNumber,
  title,
  theme,
  grammarPoint1,
  grammarPoint2,
}: UnitHeaderProps) {
  const grammarPoints = [grammarPoint1, grammarPoint2].filter(Boolean);

  return (
    <header className="rounded-2xl border border-slate-200 bg-[#fcfbf8] px-5 py-6 sm:px-8 sm:py-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a1f]">
        Speakify · {levelCode} · Unit {unitNumber}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-base text-slate-600 sm:text-lg">{theme}</p>
      {grammarPoints.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {grammarPoints.map((point) => (
            <span
              key={point}
              className="rounded-md border border-[#d4c4a0] bg-white px-3 py-1.5 text-sm text-slate-800"
            >
              <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8a6a1f]">
                Grammar
              </span>
              {point}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}
