"use client";

type Progress7030 = {
  reviewPercent: number;
  newUnlocked: boolean;
  reviewCompleted: number;
  reviewTotal: number;
  newCompleted: number;
  newTotal: number;
};

export default function Progress7030Bar({ progress }: { progress: Progress7030 }) {
  return (
    <div className="rounded-xl border border-[#c9972c]/30 bg-[#c9972c]/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
          70/30 Progression
        </p>
        <span className="text-xs text-slate-500">70% review · 30% new</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700">Review (70%)</span>
            <span className="text-[#c9972c]">
              {progress.reviewCompleted}/{progress.reviewTotal} · {progress.reviewPercent}%
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#c9972c]"
              style={{ width: `${Math.min(100, progress.reviewPercent)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700">New (30%)</span>
            <span className={progress.newUnlocked ? "text-[#0d9488]" : "text-slate-400"}>
              {progress.newUnlocked
                ? `${progress.newCompleted}/${progress.newTotal} · unlocked`
                : "Locked until 70% review"}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${progress.newUnlocked ? "bg-[#0d9488]" : "bg-slate-300"}`}
              style={{
                width: progress.newUnlocked
                  ? `${progress.newTotal > 0 ? (progress.newCompleted / progress.newTotal) * 100 : 0}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
