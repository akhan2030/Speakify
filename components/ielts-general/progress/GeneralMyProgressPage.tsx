"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import AchievementsProgressPanel from "@/components/ielts/progress/AchievementsProgressPanel";
import HistoryProgressPanel from "@/components/ielts/progress/HistoryProgressPanel";
import GeneralIeltsReadinessMeter from "@/components/ielts-general/GeneralIeltsReadinessMeter";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";

const BASE = "/dashboard/ielts-general/student";

export type GtProgressTab = "readiness" | "history" | "achievements";

const TABS: { id: GtProgressTab; label: string; icon: string }[] = [
  { id: "readiness", label: "Readiness", icon: "📊" },
  { id: "history", label: "History", icon: "📈" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
];

function isGtProgressTab(value: string | null): value is GtProgressTab {
  return value === "readiness" || value === "history" || value === "achievements";
}

function GeneralMyProgressContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const activeTab: GtProgressTab = isGtProgressTab(tabParam) ? tabParam : "readiness";

  const setTab = useCallback(
    (tab: GtProgressTab) => {
      router.replace(`${BASE}/progress?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href={BASE}
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">My Progress</h1>
      <p className="mt-1 text-sm text-slate-600">
        Readiness, study history, and milestones — powered by your logged GT activity.
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
        {activeTab === "readiness" ? (
          <div>
            <GeneralSkillBandHeader
              skill="reading"
              title="IELTS Readiness"
              subtitle="General Training progress — letters, GT reading sections, listening & speaking"
            />
            <GeneralIeltsReadinessMeter />
          </div>
        ) : null}

        {activeTab === "history" ? (
          <HistoryProgressPanel
            todayHref={BASE}
            practiceHref={`${BASE}/practice`}
          />
        ) : null}

        {activeTab === "achievements" ? <AchievementsProgressPanel /> : null}
      </div>
    </main>
  );
}

export default function GeneralMyProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <PageSpinner />
        </div>
      }
    >
      <GeneralMyProgressContent />
    </Suspense>
  );
}
