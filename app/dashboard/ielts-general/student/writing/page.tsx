"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";
import GeneralWritingPracticePanel from "@/components/ielts-general/writing/GeneralWritingPracticePanel";
import { PageSpinner } from "@/components/StudentSidebar";
import {
  GT_WRITING_LESSONS,
  readCompletedLessons,
} from "@/lib/ielts-general/writingLessons";

const TABS = [
  { id: "task1" as const, label: "Task 1 — Letter", hint: "150+ words · formal / semi-formal / informal" },
  { id: "task2" as const, label: "Task 2 — Essay", hint: "250+ words · everyday topics" },
  { id: "lessons" as const, label: "Lessons", hint: "Letter & essay skills" },
];

const LESSON_BASE = "/dashboard/ielts-general/student/writing/lessons";

function WritingPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "lessons" || tabParam === "task2" || tabParam === "task1"
      ? tabParam
      : "task1";

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(initialTab);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setCompletedLessons(readCompletedLessons());
  }, [tab]);

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <GeneralSkillBandHeader
        skill="writing"
        title="Writing — Letter + Essay"
        subtitle="IELTS General Training only — Task 1 letters (no charts) and Task 2 essays"
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
        {tab === "lessons" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {GT_WRITING_LESSONS.map((lesson) => {
              const done = completedLessons.includes(lesson.slug);
              return (
                <Link
                  key={lesson.slug}
                  href={`${LESSON_BASE}/${lesson.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-[#0d9488]/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#0d1b35] group-hover:text-[#0d9488]">
                      {lesson.title}
                    </h3>
                    {done ? (
                      <span className="shrink-0 rounded-full bg-[#0d9488]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0d9488]">
                        Done
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[#0d9488]">{lesson.minutes} min</p>
                  <p className="mt-2 text-sm text-slate-600">{lesson.desc}</p>
                  <p className="mt-3 text-xs font-semibold text-[#c9972c]">
                    Open lesson →
                  </p>
                </Link>
              );
            })}
          </div>
        ) : null}
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
