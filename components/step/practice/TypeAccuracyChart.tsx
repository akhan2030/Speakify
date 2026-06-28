import { STEP_GOLD, STEP_NAVY, STEP_TEAL } from "./StepSectionTopBar";

type Entry = { label: string; correct: number; total: number };

type Props = {
  title?: string;
  entries: Entry[];
};

export default function TypeAccuracyChart({ title = "Accuracy by question type", entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold" style={{ color: STEP_NAVY }}>
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {entries.map((e) => {
          const pct = e.total > 0 ? Math.round((e.correct / e.total) * 100) : 0;
          return (
            <li key={e.label}>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span className="capitalize">{e.label.replace(/_/g, " ")}</span>
                <span className="font-semibold tabular-nums">
                  {e.correct}/{e.total} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 70 ? STEP_TEAL : pct >= 50 ? STEP_GOLD : "#ef4444",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
