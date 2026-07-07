"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import SkillBandHeader from "@/components/ielts/SkillBandHeader";
import { dualTaskWritingCriteriaSubtitle } from "@/lib/ielts/writingCriteria";
import SkillTabs from "@/components/ielts/SkillTabs";
import WritingPracticePanel from "@/components/ielts/writing/WritingPracticePanel";
import SubmissionHistory from "@/components/ielts/SubmissionHistory";
import {
  ACADEMIC_WRITING_LESSONS,
  readCompletedAcademicLessons,
} from "@/lib/ielts/writingLessons";

const TABS = [
  { id: "task1", label: "Task 1" },
  { id: "task2", label: "Task 2" },
  { id: "submissions", label: "My Submissions" },
  { id: "lessons", label: "Lessons" },
];

const LESSON_BASE = "/dashboard/ielts/student/writing/lessons";

function LessonsTab() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(readCompletedAcademicLessons());
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ACADEMIC_WRITING_LESSONS.map((lesson) => {
        const done = completed.includes(lesson.slug);
        return (
          <Link
            key={lesson.slug}
            href={`${LESSON_BASE}/${lesson.slug}`}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-[#c9972c]/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-[#0d1b35] group-hover:text-[#c9972c]">
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
  );
}

function WritingContent() {
  return (
    <SkillTabs tabs={TABS} defaultTab="task2">
      {(tab) => {
        if (tab === "task1") return <WritingPracticePanel key="task1" defaultTaskType="task1" />;
        if (tab === "task2") return <WritingPracticePanel key="task2" defaultTaskType="task2" />;
        if (tab === "submissions") return <SubmissionHistory skill="writing" />;
        return <LessonsTab />;
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
        subtitle={dualTaskWritingCriteriaSubtitle()}
      />
      <Suspense fallback={<PageSpinner />}>
        <WritingContent />
      </Suspense>
    </main>
  );
}
