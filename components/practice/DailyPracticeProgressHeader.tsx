"use client";

import { MissionProgressBar } from "@/components/ielts/MissionTaskCard";

export default function DailyPracticeProgressHeader({
  completed,
  total,
  allComplete,
}: {
  completed: number;
  total: number;
  allComplete?: boolean;
}) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {allComplete ? (
        <p className="mb-3 text-base font-bold text-[#0d1b35]">
          All done for today! 🎉 You&apos;ve completed every daily practice task.
        </p>
      ) : (
        <p className="mb-3 text-sm text-slate-600">
          <span className="font-semibold text-[#0d1b35]">
            {completed} of {total} tasks completed today
          </span>
          {" — "}
          finish the set to keep your study streak going.
        </p>
      )}
      <MissionProgressBar completed={completed} total={total} />
    </section>
  );
}
