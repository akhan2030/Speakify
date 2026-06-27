"use client";

import GeneralWritingPracticePanel from "@/components/ielts-general/writing/GeneralWritingPracticePanel";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";

export default function IeltsGeneralLetterPracticePage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <GeneralSkillBandHeader
        skill="writing"
        title="Letter Practice"
        subtitle="Formal, semi-formal, and informal letters — General Training Task 1 only"
      />
      <GeneralWritingPracticePanel lockTaskType="task1" />
    </main>
  );
}
