"use client";

import { useState } from "react";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";
import GeneralWritingPracticePanel from "@/components/ielts-general/writing/GeneralWritingPracticePanel";

const TABS = [
  { id: "task1" as const, label: "Task 1 — Letter", hint: "150+ words · formal / semi-formal / informal" },
  { id: "task2" as const, label: "Task 2 — Essay", hint: "250+ words · everyday topics" },
  { id: "lessons" as const, label: "Lessons", hint: "Letter & essay skills" },
];

const LESSONS = [
  {
    title: "Formal letter structure",
    minutes: 12,
    desc: "Opening, purpose, bullet points, and appropriate closing for formal letters.",
  },
  {
    title: "Semi-formal & informal tone",
    minutes: 10,
    desc: "When to use Dear + first name, contractions, and friendly closings.",
  },
  {
    title: "General Task 2 essay structure",
    minutes: 15,
    desc: "Clear position, balanced paragraphs, and practical examples.",
  },
  {
    title: "Everyday vocabulary for GT Writing",
    minutes: 10,
    desc: "Useful phrases for letters about work, housing, travel, and friends.",
  },
];

export default function IeltsGeneralWritingPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("task1");

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
            {LESSONS.map((lesson) => (
              <div
                key={lesson.title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="font-bold text-[#0d1b35]">{lesson.title}</h3>
                <p className="mt-1 text-xs text-[#0d9488]">{lesson.minutes} min</p>
                <p className="mt-2 text-sm text-slate-600">{lesson.desc}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
