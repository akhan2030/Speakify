"use client";

type ExamStateSlice = {
  currentSection: number;
  currentQuestion: number;
  timeRemaining: number;
  sectionSubmitted: boolean[];
};

type Props = {
  examState: ExamStateSlice;
  sectionCounts: readonly number[];
  answeredInSection: (i: number) => number;
  onSectionChange: (i: number) => void;
  totalAnswered: number;
  submitting: boolean;
};

const SHORT_NAMES = ["Reading", "Structure", "Listening", "Compositional"];

export default function MiniMockHeader({
  examState,
  sectionCounts,
  answeredInSection,
  onSectionChange,
  totalAnswered,
  submitting,
}: Props) {
  const mins = Math.floor(examState.timeRemaining / 60);
  const secs = examState.timeRemaining % 60;
  const timerColor = examState.timeRemaining < 300 ? "#ef4444" : "#c9972c";

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[100] flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white md:px-6"
      style={{ background: "#0d1b35" }}
    >
      <div>
        <p className="m-0 text-xs tracking-[2px] text-[#c9972c]">STEP MINI MOCK</p>
        <p className="m-0 text-sm font-semibold">
          {SHORT_NAMES[examState.currentSection]} — Q {examState.currentQuestion + 1}/
          {sectionCounts[examState.currentSection]}
        </p>
      </div>

      <div className="hidden flex-wrap gap-2 md:flex">
        {SHORT_NAMES.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => onSectionChange(i)}
            className="rounded-md border-0 px-3 py-1.5 text-xs text-white"
            style={{
              background:
                examState.currentSection === i
                  ? "#c9972c"
                  : examState.sectionSubmitted[i]
                    ? "#0d9488"
                    : "rgba(255,255,255,0.1)",
            }}
          >
            {name} ({answeredInSection(i)}/{sectionCounts[i]})
          </button>
        ))}
      </div>

      <div className="text-right">
        <p className="m-0 text-[11px] text-white/50">TIME · {totalAnswered}/20</p>
        <p className="m-0 text-2xl font-bold tabular-nums" style={{ color: timerColor }}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
      </div>
      {submitting && <span className="text-xs text-white/70">Submitting…</span>}
    </div>
  );
}
