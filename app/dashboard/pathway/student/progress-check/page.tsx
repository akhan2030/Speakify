"use client";

import { useState } from "react";
import PathwaySubPageShell from "@/components/pathway/PathwaySubPageShell";
import { usePathwayStudent } from "@/components/pathway/usePathwayStudent";
import { getProgramTerminology } from "@/lib/programs/terminology";

const QUESTIONS = [
  "Which tense do we use for life experiences?",
  "What is the main idea of a skimming task?",
  "Name two linking words for giving reasons.",
  "What does sentence stress emphasise?",
];

export default function ProgressCheckPage() {
  const ctx = usePathwayStudent();
  const terms = getProgramTerminology("pathway");
  const [done, setDone] = useState(false);

  return (
    <PathwaySubPageShell
      title={terms.progressCheckLabel}
      subtitle={`Week ${ctx.week} review for ${ctx.levelName} — checks your understanding before the graduation assessment.`}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[#0d1b35]">Weekly review ({QUESTIONS.length} prompts)</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-700">
          {QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        {!done ? (
          <button
            type="button"
            onClick={() => setDone(true)}
            className="mt-6 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white"
          >
            Submit progress check
          </button>
        ) : (
          <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            Progress check recorded. Review any weak areas in your{" "}
            <a href="/dashboard/pathway/student/weekly-plan" className="font-semibold underline">
              weekly plan
            </a>
            .
          </p>
        )}
      </section>
    </PathwaySubPageShell>
  );
}
