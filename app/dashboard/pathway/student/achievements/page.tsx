"use client";

import Link from "next/link";
import PathwaySubPageShell from "@/components/pathway/PathwaySubPageShell";

const ACHIEVEMENTS = [
  { icon: "🔥", title: "7-day streak", desc: "Studied seven days in a row" },
  { icon: "📚", title: "Vocabulary builder", desc: "Completed 5 vocabulary units" },
  { icon: "🎤", title: "Confident speaker", desc: "Finished 3 speaking practice tasks" },
];

export default function PathwayAchievementsPage() {
  return (
    <PathwaySubPageShell
      title="Achievements"
      subtitle="Milestones on your English Pathway journey — CEFR progress, not exam scores."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => (
          <li
            key={a.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="text-2xl">{a.icon}</span>
            <p className="mt-2 font-bold text-[#0d1b35]">{a.title}</p>
            <p className="mt-1 text-sm text-slate-600">{a.desc}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/pathway/student/progress"
        className="mt-6 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
      >
        View skill progress →
      </Link>
    </PathwaySubPageShell>
  );
}
