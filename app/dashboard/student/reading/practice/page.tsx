"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { READING_INCOMPLETE_UI_TYPES } from "@/lib/readingQuestionContent.js";

const QUESTION_TYPES = [
  { slug: "multiple-choice", name: "Multiple Choice", difficulty: "Medium" },
  { slug: "true-false-not-given", name: "True / False / Not Given", difficulty: "Hard" },
  { slug: "matching-headings", name: "Matching Headings", difficulty: "Hard" },
  { slug: "matching-information", name: "Matching Information", difficulty: "Medium" },
  { slug: "matching-features", name: "Matching Features", difficulty: "Medium" },
  { slug: "matching-sentence-endings", name: "Matching Sentence Endings", difficulty: "Medium" },
  { slug: "sentence-completion", name: "Sentence Completion", difficulty: "Medium" },
  { slug: "summary-completion", name: "Summary Completion", difficulty: "Medium" },
  { slug: "note-completion", name: "Note Completion", difficulty: "Easy" },
  { slug: "short-answer", name: "Short Answer", difficulty: "Easy" },
  { slug: "diagram-completion", name: "Diagram Completion", difficulty: "Hard" },
  { slug: "classification", name: "Classification", difficulty: "Medium" },
];

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

export default function ReadingPracticeIndexPage() {
  const router = useRouter();
  const { status } = useSession();
  const { base, usesProgramShell } = usePathwayStudentContext();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}
      <main className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}>
        <div className="mx-auto max-w-6xl px-6 py-8 pb-24">
          <Link href={`${base}/reading`} className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]">
            ← Back to Reading
          </Link>
          <header className="mt-4">
            <h1 className="text-2xl font-bold text-[#0d1b35]">Question Type Practice</h1>
            <p className="mt-2 text-sm text-slate-500">Choose a question type to practice with timed feedback</p>
          </header>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUESTION_TYPES.map((type) => {
              const comingSoon = READING_INCOMPLETE_UI_TYPES.has(type.slug);
              const cardClass = `flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow ${
                comingSoon
                  ? "cursor-not-allowed opacity-75"
                  : "hover:shadow-md hover:ring-2 hover:ring-[#c9972c]/20"
              }`;

              if (comingSoon) {
                return (
                  <div key={type.slug} className={cardClass} aria-disabled="true">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-[#0d1b35]">{type.name}</h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_CLASS[type.difficulty]}`}
                      >
                        {type.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      Coming soon — exam-style UI is in development
                    </p>
                    <span className="mt-4 text-sm font-bold text-slate-400">Not available yet</span>
                  </div>
                );
              }

              return (
              <Link
                key={type.slug}
                href={`${base}/reading/practice/${type.slug}`}
                className={cardClass}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-[#0d1b35]">{type.name}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_CLASS[type.difficulty]}`}>
                    {type.difficulty}
                  </span>
                </div>
                <span className="mt-4 text-sm font-bold text-[#c9972c]">
                  Start Practice →
                </span>
              </Link>
            );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
