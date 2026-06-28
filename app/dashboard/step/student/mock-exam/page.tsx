"use client";

import { useEffect, useState } from "react";
import StepMcqRunner from "@/components/step/StepMcqRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import type { StepMcqOption } from "@/lib/step/types";

export default function StepMockExamPage() {
  const [meta, setMeta] = useState<{
    title: string;
    timeLimitMinutes: number;
    questions: Array<{
      id: string;
      number: number;
      stem: string;
      options: Record<StepMcqOption, string>;
      correct: StepMcqOption;
      explanation: string;
      section: string;
    }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/step/mock")
      .then((r) => r.json())
      .then(setMeta);
  }, []);

  if (!meta) return <PageSpinner />;

  return (
    <div className="p-4 md:p-8">
      <StepMcqRunner
        title={meta.title}
        subtitle="20-question practice mock · all four STEP sections"
        questions={meta.questions}
        timeLimitMinutes={meta.timeLimitMinutes}
        submitLabel="Finish mock"
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

          return {
            correct,
            attempted: Object.keys(answerKey).length,
            estimatedTotal: json.estimatedTotal,
          };
        }}
      />
    </div>
  );
}
