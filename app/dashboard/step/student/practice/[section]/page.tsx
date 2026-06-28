"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StepMcqRunner from "@/components/step/StepMcqRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import type { StepMcqOption } from "@/lib/step/types";
import type { StepSectionId } from "@/lib/step/examModel";

export default function StepSectionPracticePage() {
  const params = useParams();
  const section = params.section as StepSectionId;
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{
    label: string;
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
    fetch(`/api/step/practice?section=${section}&count=5`)
      .then((r) => r.json())
      .then((json) => {
        setMeta(json);
        setLoading(false);
      });
  }, [section]);

  if (loading || !meta) return <PageSpinner />;

  return (
    <div className="p-4 md:p-8">
      <StepMcqRunner
        title={meta.label}
        subtitle="STEP section drill · scores update your estimate"
        questions={meta.questions}
        timeLimitMinutes={meta.timeLimitMinutes}
        onSubmit={async ({ answers, answerKey, durationMinutes }) => {
          const res = await fetch("/api/step/practice/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section,
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

          return {
            correct,
            attempted: Object.keys(answerKey).length,
            sectionScore: json.sectionScore,
            estimatedTotal: json.estimatedTotal,
          };
        }}
      />
    </div>
  );
}
