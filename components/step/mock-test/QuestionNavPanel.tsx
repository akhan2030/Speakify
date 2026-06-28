"use client";

type Props = {
  sectionIndex: number;
  sectionCounts: readonly number[];
  currentQuestion: number;
  answers: Record<string, string>;
  getQuestionId: (sectionIndex: number, questionIndex: number) => string;
  answeredInSection: number;
  sectionTotal: number;
  onQuestionSelect: (index: number) => void;
  onSectionSubmit: () => void;
};

export default function QuestionNavPanel({
  sectionIndex,
  currentQuestion,
  answers,
  getQuestionId,
  answeredInSection,
  sectionTotal,
  onQuestionSelect,
  onSectionSubmit,
}: Props) {
  const count = sectionTotal;

  return (
    <div
      className="fixed bottom-0 left-0 top-16 z-50 hidden w-[200px] overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 md:block"
    >
      <p className="mb-3 text-[11px] tracking-widest text-slate-500">QUESTIONS</p>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: count }, (_, i) => {
          const qId = getQuestionId(sectionIndex, i);
          const answered = answers[qId] !== undefined;
          const isCurrent = currentQuestion === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onQuestionSelect(i)}
              className="h-8 w-8 rounded-md border-0 text-xs"
              style={{
                background: isCurrent ? "#0d1b35" : answered ? "#0d9488" : "#e5e7eb",
                color: isCurrent || answered ? "white" : "#666",
                fontWeight: isCurrent ? 700 : 400,
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-2.5">
        <p className="m-0 mb-1 text-xs text-slate-500">This section</p>
        <p className="m-0 text-sm font-semibold text-[#0d1b35]">
          {answeredInSection}/{sectionTotal} answered
        </p>
      </div>

      {answeredInSection === sectionTotal && (
        <button
          type="button"
          onClick={onSectionSubmit}
          className="mt-3 w-full rounded-lg border-0 py-2.5 text-[13px] font-semibold text-white"
          style={{ background: "#c9972c" }}
        >
          Submit Section →
        </button>
      )}
    </div>
  );
}
