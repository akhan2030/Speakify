"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";
import WritingCriteriaOverview from "@/components/writing/WritingCriteriaOverview";
import { wordCountRangeLabel } from "@/lib/ielts/writingCriteria";
import GeneralWritingPracticePanel from "@/components/ielts-general/writing/GeneralWritingPracticePanel";
import GeneralWritingLessonsHub from "@/components/ielts-general/writing/GeneralWritingLessonsHub";
import { PageSpinner } from "@/components/StudentSidebar";

const TABS = [
  { id: "task1" as const, label: "Task 1 — Letter", hint: wordCountRangeLabel("task1") },
  { id: "task2" as const, label: "Task 2 — Essay", hint: wordCountRangeLabel("task2") },
  { id: "lessons" as const, label: "Lessons", hint: "Letter & essay skills" },
];

function WritingPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "lessons" || tabParam === "task2" || tabParam === "task1"
      ? tabParam
      : "task1";

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <GeneralSkillBandHeader
        skill="writing"
        title="Writing — Letter + Essay"
        subtitle={
          <div>
            <p className="text-sm font-medium text-[#0d9488]">IELTS General Training</p>
            <WritingCriteriaOverview
              task1Label="Task 1 — Letter"
              task2Label="Task 2 — Essay"
            />
          </div>
        }
      />

      <div className="mb-4 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 px-4 py-3 text-sm text-[#0d1b35]">
        You are in <strong>IELTS General Training</strong>. Task 1 is a <strong>letter</strong>, not an
        Academic graph report. Use the sidebar link{" "}
        <strong>Writing — Letter + Essay</strong> — not the legacy{" "}
        <code className="rounded bg-white px-1 text-xs">/dashboard/student/writing</code> page.
      </div>

      <div className="mt-2 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-t-lg px-4 py-2.5 text-left transition-colors ${
                active
                  ? "border-b-2 border-[#c9972c] bg-[#c9972c]/10 text-[#0d1b35]"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="block text-[10px] font-normal opacity-80">{item.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "task1" ? <GeneralWritingPracticePanel lockTaskType="task1" /> : null}
        {tab === "task2" ? <GeneralWritingPracticePanel lockTaskType="task2" /> : null}
        {tab === "lessons" ? <GeneralWritingLessonsHub /> : null}
      </div>
    </main>
  );
}

export default function IeltsGeneralWritingPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <WritingPageContent />
    </Suspense>
  );
}
