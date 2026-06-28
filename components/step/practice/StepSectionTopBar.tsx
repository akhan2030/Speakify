export const STEP_NAVY = "#0d1b35";
export const STEP_GOLD = "#c9972c";
export const STEP_TEAL = "#0d9488";

export type SectionProgress = {
  questionsAttemptedToday: number;
  questionsCorrectToday: number;
  estimatedSectionScore: number;
  sectionMax: number;
};

type Props = {
  label: string;
  weightPercent: number;
  progress: SectionProgress;
};

export default function StepSectionTopBar({ label, weightPercent, progress }: Props) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-white shadow-sm md:px-6 md:py-4"
      style={{ backgroundColor: STEP_NAVY }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            STEP Section Practice
          </p>
          <h1 className="text-lg font-bold md:text-xl">
            {label} — {weightPercent}% of STEP score
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-white/60">Today&apos;s progress</p>
            <p className="font-bold tabular-nums">
              {progress.questionsAttemptedToday} questions answered
            </p>
          </div>
          <div>
            <p className="text-white/60">Estimated section score</p>
            <p className="font-bold tabular-nums" style={{ color: STEP_GOLD }}>
              {progress.estimatedSectionScore}/{progress.sectionMax}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
