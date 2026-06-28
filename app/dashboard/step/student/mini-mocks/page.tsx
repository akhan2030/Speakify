"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StepMcqRunner from "@/components/step/StepMcqRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";
import type { StepMcqOption } from "@/lib/step/types";

/** Friday mini mock — 40 questions from all sections (uses 20 sample + duplicate rotation) */
export default function StepMiniMocksPage() {
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
    const sections = ["reading", "structure", "listening", "compositional_analysis"];
    Promise.all(
      sections.map((s) =>
        fetch(`/api/step/practice?section=${s}&count=10`).then((r) => r.json())
      )
    ).then((results) => {
      const all = results.flatMap((r) => r.questions ?? []).slice(0, 40);
      setQuestions(all);
    });
  }, []);

  if (!questions.length) return <PageSpinner />;

  return (
    <div className="p-4 md:p-8">
      <Link href={STEP_ROUTES.home} className="mb-4 inline-block text-sm text-[#c9972c]">
        ← Dashboard
      </Link>
      <StepMcqRunner
        title="Mini Mock"
        subtitle="40 questions timed · mixed STEP sections"
        questions={questions}
        timeLimitMinutes={60}
        submitLabel="Submit mini mock"
        onSubmit={async ({ answers, answerKey, durationMinutes }) => {
          const res = await fetch("/api/step/practice/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers,
              answerKey,
              mode: "mock",
              durationMinutes,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          let correct = 0;
          for (const id of Object.keys(answerKey)) {
            if (answers[id] === answerKey[id]) correct++;
          }
          return { correct, attempted: Object.keys(answerKey).length, estimatedTotal: json.estimatedTotal };
        }}
      />
    </div>
  );
}
