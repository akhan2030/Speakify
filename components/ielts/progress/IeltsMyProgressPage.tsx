"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import AchievementsProgressPanel from "@/components/ielts/progress/AchievementsProgressPanel";
import HistoryProgressPanel from "@/components/ielts/progress/HistoryProgressPanel";
import ProgrammeProgressPanel from "@/components/ielts/progress/ProgrammeProgressPanel";
import ReadinessProgressPanel from "@/components/ielts/progress/ReadinessProgressPanel";
import WeeklyPlanPanel from "@/components/ielts/progress/WeeklyPlanPanel";
import GrowthRoadmapPanel from "@/components/growth/GrowthRoadmapPanel";

export type ProgressTab = "programme" | "readiness" | "history" | "achievements" | "growth";

const TABS: { id: ProgressTab; label: string; icon: string }[] = [
  { id: "programme", label: "Programme", icon: "🗺" },
  { id: "growth", label: "Growth Roadmap", icon: "🎯" },
  { id: "readiness", label: "Readiness", icon: "📊" },
  { id: "history", label: "History", icon: "📈" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
];

function isProgressTab(value: string | null): value is ProgressTab {
  return (
    value === "programme" ||
    value === "growth" ||
    value === "readiness" ||
    value === "history" ||
    value === "achievements"
  );
}

export default function IeltsMyProgressPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const activeTab: ProgressTab = isProgressTab(tabParam) ? tabParam : "programme";
  const programmeView = searchParams.get("view") === "weekly" ? "weekly" : "roadmap";

  const setTab = useCallback(
    (tab: ProgressTab) => {
      router.replace(`/dashboard/ielts/student/progress?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  const setProgrammeView = useCallback(
    (view: "roadmap" | "weekly") => {
      const qs = view === "weekly" ? "?tab=programme&view=weekly" : "?tab=programme";
      router.replace(`/dashboard/ielts/student/progress${qs}`, { scroll: false });
    },
    [router]
  );

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href="/dashboard/ielts/student/today"
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Today&apos;s Mission
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">My Progress</h1>
      <p className="mt-1 text-sm text-slate-600">
        Programme roadmap, readiness, study history, and achievements in one place.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? "border-b-2 border-[#c9972c] bg-white text-[#0d1b35]"
                : "text-slate-500 hover:text-[#0d1b35]"
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "programme" ? (
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setProgrammeView("roadmap")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  programmeView === "roadmap"
                    ? "bg-[#0d1b35] text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                Roadmap
              </button>
              <button
                type="button"
                onClick={() => setProgrammeView("weekly")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  programmeView === "weekly"
                    ? "bg-[#0d1b35] text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                Weekly plan
              </button>
            </div>
            <div className="mt-6">
              {programmeView === "weekly" ? (
                <WeeklyPlanPanel />
              ) : (
                <ProgrammeProgressPanel onOpenWeeklyPlan={() => setProgrammeView("weekly")} />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "growth" ? <GrowthRoadmapPanel programme="ielts" showResolved /> : null}
        {activeTab === "readiness" ? <ReadinessProgressPanel /> : null}
        {activeTab === "history" ? <HistoryProgressPanel /> : null}
        {activeTab === "achievements" ? <AchievementsProgressPanel /> : null}
      </div>
    </main>
  );
}
