"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import SkillBandHeader from "@/components/ielts/SkillBandHeader";
import SkillTabs from "@/components/ielts/SkillTabs";
import WritingPracticePanel from "@/components/ielts/writing/WritingPracticePanel";
import SubmissionHistory from "@/components/ielts/SubmissionHistory";

const TABS = [
  { id: "task1", label: "Task 1" },
  { id: "task2", label: "Task 2" },
  { id: "submissions", label: "My Submissions" },
  { id: "lessons", label: "Lessons" },
];

const LESSONS = [
  {
    title: "Essay structure for Band 6+",
    minutes: 12,
    desc: "Introduction → body paragraphs → conclusion with clear thesis.",
  },
  {
    title: "Task 1: describing trends",
    minutes: 15,
    desc: "Overview sentence, comparisons, and accurate data language.",
  },
  {
    title: "Cohesion & linking words",
    minutes: 10,
    desc: "However, furthermore, in contrast — avoid overusing firstly/secondly.",
  },
  {
    title: "Saudi common errors",
    minutes: 10,
    desc: "Articles (a/the), subject-verb agreement, and word order fixes.",
  },
];

function WritingContent() {
  return (
    <SkillTabs tabs={TABS} defaultTab="task2">
      {(tab) => {
        if (tab === "task1") return <WritingPracticePanel key="task1" defaultTaskType="task1" />;
        if (tab === "task2") return <WritingPracticePanel key="task2" defaultTaskType="task2" />;
        if (tab === "submissions") return <SubmissionHistory skill="writing" />;
        return (
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
        );
      }}
    </SkillTabs>
  );
}

export default function IeltsWritingPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <SkillBandHeader
        skill="writing"
        title="Writing"
        subtitle="Task 1 & 2 practice with AI scoring — TA, CC, LR, GRA"
      />
      <Suspense fallback={<PageSpinner />}>
        <WritingContent />
      </Suspense>
    </main>
  );
}
