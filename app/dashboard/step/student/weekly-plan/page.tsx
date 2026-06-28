"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";

const GOLD = "#c9972c";
const NAVY = "#0d1b35";

type Mission = {
  day: string;
  title: string;
  description: string;
  minutes: number;
  href: string;
};

export default function StepWeeklyPlanPage() {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    fetch("/api/step/dashboard")
      .then((r) => r.json())
      .then((json) => setMissions(json.weeklyPlan ?? []));
  }, []);

  if (!missions.length) return <PageSpinner />;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
        Weekly Plan
      </h1>
      <p className="text-sm text-slate-600">
        One adaptive STEP course — your daily focus rotates through all four Qiyas sections.
      </p>
      <ul className="space-y-4">
        {missions.map((m) => (
          <li
            key={m.day}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase text-slate-400">{m.day}</p>
            <p className="mt-1 font-bold" style={{ color: NAVY }}>
              {m.title}
            </p>
            <p className="mt-1 text-sm text-slate-600">{m.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">{m.minutes} min</span>
              <Link
                href={m.href}
                className="text-sm font-semibold hover:underline"
                style={{ color: GOLD }}
              >
                Start →
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <Link href={STEP_ROUTES.home} className="text-sm font-semibold" style={{ color: GOLD }}>
        ← Back to dashboard
      </Link>
    </div>
  );
}
