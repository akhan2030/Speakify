"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { IELTS_ACHIEVEMENTS } from "@/lib/ielts/achievements";

type Achievement = {
  id: string;
  title: string;
  icon: string;
  desc: string;
  earned: boolean;
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/ielts-achievements")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
          setAchievements(
            IELTS_ACHIEVEMENTS.map((a) => ({ ...a, earned: false }))
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
          IELTS_ACHIEVEMENTS.map((a) => ({ ...a, earned: false }))
        );
        setTotalCount(IELTS_ACHIEVEMENTS.length);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <PageSpinner />
      </div>
    );
  }

  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href="/dashboard/ielts/student"
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Achievements</h1>
      <p className="mt-2 text-sm text-slate-600">
        {earnedCount} of {totalCount} milestones unlocked on your IELTS journey.
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
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
            Earned
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-[#c9972c] bg-[#c9972c]/10 p-4"
              >
                <span className="text-2xl">{m.icon}</span>
                <p className="mt-2 font-semibold text-[#0d1b35]">{m.title}</p>
                <p className="mt-1 text-xs text-slate-600">{m.desc}</p>
                <p className="mt-2 text-xs font-semibold text-green-700">Earned ✓</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {locked.length ? (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
            Locked
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white p-4 opacity-70"
              >
                <span className="text-2xl grayscale">{m.icon}</span>
                <p className="mt-2 font-semibold text-[#0d1b35]">{m.title}</p>
                <p className="mt-1 text-xs text-slate-500">{m.desc}</p>
                <p className="mt-2 text-xs text-slate-400">Locked</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
