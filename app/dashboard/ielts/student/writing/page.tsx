"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import SkillBandHeader from "@/components/ielts/SkillBandHeader";
import WritingCriteriaOverview from "@/components/writing/WritingCriteriaOverview";
import SkillTabs from "@/components/ielts/SkillTabs";
import WritingPracticePanel from "@/components/ielts/writing/WritingPracticePanel";
import WritingLessonsHub from "@/components/ielts/writing/WritingLessonsHub";
import SubmissionHistory from "@/components/ielts/SubmissionHistory";

const TABS = [
  { id: "task1", label: "Task 1" },
  { id: "task2", label: "Task 2" },
  { id: "submissions", label: "My Submissions" },
  { id: "lessons", label: "Lessons" },
];

function WritingContent() {
  return (
    <SkillTabs tabs={TABS} defaultTab="task2">
      {(tab) => {
        if (tab === "task1") return <WritingPracticePanel key="task1" defaultTaskType="task1" />;
        if (tab === "task2") return <WritingPracticePanel key="task2" defaultTaskType="task2" />;
        if (tab === "submissions") return <SubmissionHistory skill="writing" />;
        return <WritingLessonsHub />;
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
        subtitle={<WritingCriteriaOverview />}
      />
      <Suspense fallback={<PageSpinner />}>
        <WritingContent />
      </Suspense>
    </main>
  );
}
