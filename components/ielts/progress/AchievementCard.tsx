"use client";

import Link from "next/link";
import type { AchievementProgress } from "@/lib/ielts/achievements";

export type AchievementCardData = {
  id: string;
  title: string;
  icon: string;
  desc: string;
  earned: boolean;
  progress?: AchievementProgress;
};

export default function AchievementCard({
  achievement,
  variant = "locked",
}: {
  achievement: AchievementCardData;
  variant?: "earned" | "locked";
}) {
  const { earned, progress } = achievement;
  const isEarned = variant === "earned" || earned;
  const showNumericProgress =
    !isEarned &&
    progress &&
    (progress.kind === "count" || progress.kind === "percent" || progress.kind === "band") &&
    progress.progressPercent != null;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isEarned
          ? "border-[#c9972c] bg-[#c9972c]/10"
          : "border-slate-200 bg-white"
      }`}
    >
      <span className={`text-2xl ${isEarned ? "" : "grayscale"}`}>{achievement.icon}</span>
      <p className="mt-2 font-semibold text-[#0d1b35]">{achievement.title}</p>
      <p className="mt-1 text-xs text-slate-600">{achievement.desc}</p>

      {isEarned ? (
        <p className="mt-3 text-xs font-semibold text-green-700">Earned ✓</p>
      ) : showNumericProgress ? (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#0d9488] transition-all"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-[#0d1b35]">{progress.statusLabel}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-slate-600">
          {progress?.statusLabel ?? achievement.desc}
        </p>
      )}
    </div>
  );
}

export function HistoryEmptyState({
  todayHref,
  practiceHref,
}: {
  todayHref: string;
  practiceHref: string;
}) {
  return (
    <section className="mt-6 rounded-xl border-2 border-dashed border-[#c9972c]/40 bg-[#c9972c]/5 p-6 text-center">
      <p className="text-3xl">📅</p>
      <h3 className="mt-2 text-lg font-bold text-[#0d1b35]">No study history yet</h3>
      <p className="mt-2 text-sm text-slate-600">
        Your calendar and band trend will fill in as you complete tasks, skill practice, or mock
        exams. Every session you log counts toward your progress.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={todayHref}
          className="inline-flex rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-95"
        >
          Start your first study session →
        </Link>
        <Link
          href={practiceHref}
          className="inline-flex rounded-xl border border-[#0d9488] px-5 py-2.5 text-sm font-semibold text-[#0d9488] hover:bg-[#0d9488]/10"
        >
          Daily Practice
        </Link>
      </div>
    </section>
  );
}
