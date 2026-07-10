"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import DailyPracticeContinuePanel from "@/components/practice/DailyPracticeContinuePanel";
import { useDailyPracticeSession } from "@/components/practice/useDailyPracticeSession";

function DailyPracticeCompleteContent({
  programme,
  base,
}: {
  programme: "ielts" | "ielts_general";
  base: string;
}) {
  const ctx = useDailyPracticeSession();
  const router = useRouter();

  if (!ctx) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-[#0d1b35]">Daily practice</p>
        <p className="mt-2 text-sm text-slate-600">
          No active task session found. Head back to pick up where you left off.
        </p>
        <button
          type="button"
          onClick={() => router.push(`${base}/practice`)}
          className="mt-6 rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white"
        >
          Back to Daily Practice
        </button>
      </div>
    );
  }

  return (
    <DailyPracticeContinuePanel
      className="mx-auto max-w-lg"
      timeSpentMinutes={ctx.estimatedMinutes ?? 10}
    />
  );
}

export default function DailyPracticeCompletePage({
  programme,
  base,
}: {
  programme: "ielts" | "ielts_general";
  base: string;
}) {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d1b35]">Daily Practice</h1>
        <p className="text-sm text-slate-500">
          {programme === "ielts_general"
            ? "General Training — keep your momentum going"
            : "Academic — keep your momentum going"}
        </p>
      </div>
      <Suspense fallback={<PageSpinner />}>
        <DailyPracticeCompleteContent programme={programme} base={base} />
      </Suspense>
    </main>
  );
}
