"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";

export default function StepProgressPage() {
  const [data, setData] = useState<{
    scoreMeter: { estimated: number; target: number; trendLabel: string };
    phaseProgress: { overallCompletion: number; weekLabel: string; phases: Array<{ phase: number; title: string; status: string }> };
    sectionBreakdown: Array<{ label: string; estimatedPoints: number; maxPoints: number; status: string }>;
    mocks: { recent: Array<{ mock_number: number; total_score: number }> };
  } | null>(null);

  useEffect(() => {
    fetch("/api/step/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <PageSpinner />;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
        My Progress
      </h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Estimated score</p>
          <p className="text-3xl font-bold">{data.scoreMeter.estimated}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Course completion</p>
          <p className="text-3xl font-bold">{data.phaseProgress.overallCompletion}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Status</p>
          <p className="text-lg font-bold">{data.scoreMeter.trendLabel}</p>
        </div>
      </div>
      <section>
        <h2 className="font-bold" style={{ color: NAVY }}>
          Section scores
        </h2>
        <ul className="mt-3 space-y-2">
          {data.sectionBreakdown.map((s) => (
            <li key={s.label} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
              <span>{s.label}</span>
              <strong>
                {s.estimatedPoints}/{s.maxPoints}
              </strong>
            </li>
          ))}
        </ul>
      </section>
      <Link href={STEP_ROUTES.home} style={{ color: GOLD }}>
        ← Dashboard
      </Link>
    </div>
  );
}
