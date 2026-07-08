"use client";

import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { IELTS_ACHIEVEMENTS, formatAchievementProgress } from "@/lib/ielts/achievements";
import AchievementCard, { type AchievementCardData } from "@/components/ielts/progress/AchievementCard";

const DEFAULT_API = "/api/student/ielts-achievements";

export default function AchievementsProgressPanel({
  apiPath = DEFAULT_API,
}: {
  apiPath?: string;
}) {
  const [achievements, setAchievements] = useState<AchievementCardData[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
          setAchievements(
            IELTS_ACHIEVEMENTS.map((a) => ({
              ...a,
              earned: false,
              progress: formatAchievementProgress(a.id, {
                tasksCompleted: 0,
                streak: 0,
                mocksTaken: 0,
                currentBand: null,
                writingAttempts: 0,
                wordsMastered: 0,
                skillsAttempted: 0,
                trackProgressPercent: 0,
              }, false),
            }))
          );
          setTotalCount(IELTS_ACHIEVEMENTS.length);
          return;
        }
        setAchievements(json.achievements ?? []);
        setEarnedCount(json.earnedCount ?? 0);
        setTotalCount(json.totalCount ?? 0);
      })
      .catch(() => {
        setError("Could not load achievements");
        setAchievements(
          IELTS_ACHIEVEMENTS.map((a) => ({
            ...a,
            earned: false,
            progress: formatAchievementProgress(a.id, {
              tasksCompleted: 0,
              streak: 0,
              mocksTaken: 0,
              currentBand: null,
              writingAttempts: 0,
              wordsMastered: 0,
              skillsAttempted: 0,
              trackProgressPercent: 0,
            }, false),
          }))
        );
        setTotalCount(IELTS_ACHIEVEMENTS.length);
      })
      .finally(() => setLoading(false));
  }, [apiPath]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  const earned = achievements.filter((a) => a.earned);
  const inProgress = achievements.filter((a) => !a.earned);

  return (
    <div>
      <p className="text-sm text-slate-600">
        {earnedCount} of {totalCount} milestones unlocked — all counts come from your logged study
        activity, not defaults.
      </p>

      {error ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error} — showing milestones below.
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-[#C8923E]/30 bg-[#C8923E]/10 px-4 py-3 text-sm font-semibold text-[#0d1b35]">
        🏆 {earnedCount}/{totalCount} earned
      </div>

      {earned.length ? (
        <>
          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">Earned</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((m) => (
              <AchievementCard key={m.id} achievement={m} variant="earned" />
            ))}
          </div>
        </>
      ) : null}

      {inProgress.length ? (
        <>
          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
            {earned.length ? "In progress" : "Milestones"}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((m) => (
              <AchievementCard key={m.id} achievement={m} variant="locked" />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
