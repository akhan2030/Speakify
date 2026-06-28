"use client";

type ExamStateSlice = {
  currentSection: number;
  currentQuestion: number;
  timeRemaining: number;
  sectionSubmitted: boolean[];
};

type Props = {
  examState: ExamStateSlice;
  sectionNames: readonly string[];
  sectionCounts: readonly number[];
  answeredInSection: (i: number) => number;
  onSectionChange: (i: number) => void;
  onSubmitExam: () => void;
  totalAnswered: number;
  submitting: boolean;
};

const SHORT_NAMES = ["Reading", "Structure", "Listening", "Compositional"];

export default function MockExamHeader({
  examState,
  sectionCounts,
  answeredInSection,
  onSectionChange,
  onSubmitExam,
  totalAnswered,
  submitting,
}: Props) {
  const mins = Math.floor(examState.timeRemaining / 60);
  const secs = examState.timeRemaining % 60;
  const timerColor =
    examState.timeRemaining < 600
      ? "#ef4444"
      : examState.timeRemaining < 1800
        ? "#ef4444"
        : "#c9972c";

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[100] flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white md:px-6"
      style={{ background: "#0d1b35" }}
    >
      <div>
        <p className="m-0 text-xs tracking-[2px] text-[#c9972c]">STEP FULL MOCK EXAM</p>
        <p className="m-0 text-sm font-semibold">
          {SHORT_NAMES[examState.currentSection]} — Question {examState.currentQuestion + 1} of{" "}
          {sectionCounts[examState.currentSection]}
        </p>
      </div>

      <div className="hidden flex-wrap gap-2 md:flex">
        {SHORT_NAMES.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => onSectionChange(i)}
            className="rounded-md border-0 px-3.5 py-1.5 text-xs text-white"
            style={{
              background:
                examState.currentSection === i
                  ? "#c9972c"
                  : examState.sectionSubmitted[i]
                    ? "#0d9488"
                    : "rgba(255,255,255,0.1)",
              fontWeight: examState.currentSection === i ? 600 : 400,
            }}
          >
            {examState.sectionSubmitted[i] ? "✓ " : ""}
            {name}
            <span className="ml-1 opacity-80">
              ({answeredInSection(i)}/{sectionCounts[i]})
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmitExam}
          className="hidden rounded-md px-3 py-1.5 text-xs font-semibold text-[#0d1b35] md:block"
          style={{ background: "#c9972c" }}
        >
          Submit Exam ({totalAnswered}/100)
        </button>
        <div className="text-right">
          <p className="m-0 text-[11px] text-white/50">TIME REMAINING</p>
          <p className="m-0 text-2xl font-bold tabular-nums" style={{ color: timerColor }}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
