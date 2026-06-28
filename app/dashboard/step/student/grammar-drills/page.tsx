"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StepMcqRunner from "@/components/step/StepMcqRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";
import type { StepMcqOption } from "@/lib/step/types";

export default function StepGrammarDrillsPage() {
  const [questions, setQuestions] = useState<
    Array<{
      id: string;
      stem: string;
      options: Record<StepMcqOption, string>;
      correct: StepMcqOption;
      explanation: string;
    }>
  >([]);

  useEffect(() => {
    fetch("/api/step/practice?section=structure&count=10")
      .then((r) => r.json())
      .then((json) => setQuestions(json.questions ?? []));
  }, []);

  if (!questions.length) return <PageSpinner />;

  return (
    <div className="p-4 md:p-8">
      <Link href={STEP_ROUTES.home} className="mb-4 inline-block text-sm text-[#c9972c]">
        ← Dashboard
      </Link>
      <StepMcqRunner
        title="Structure & Grammar Drills"
        subtitle="Tuesday mission · tenses, prepositions, S–V agreement"
        questions={questions}
        timeLimitMinutes={35}
        onSubmit={async ({ answers, answerKey, durationMinutes }) => {
          const res = await fetch("/api/step/practice/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section: "structure",
              answers,
              answerKey,
              mode: "practice",
              durationMinutes,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          let correct = 0;
          for (const id of Object.keys(answerKey)) {
            if (answers[id] === answerKey[id]) correct++;
          }
          return { correct, attempted: Object.keys(answerKey).length };
        }}
      />
    </div>
  );
}
