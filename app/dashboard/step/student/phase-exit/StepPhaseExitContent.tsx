"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StepMcqRunner from "@/components/step/StepMcqRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";
import type { StepMcqOption } from "@/lib/step/types";

export default function StepPhaseExitContent() {
  const searchParams = useSearchParams();
  const phase = Number(searchParams.get("phase") ?? 1);
  const router = useRouter();
  const [meta, setMeta] = useState<{
    title: string;
    exitScoreRequired: number;
    timeLimitMinutes: number;
    questions: Array<{
      id: string;
      number: number;
      stem: string;
      options: Record<StepMcqOption, string>;
      correct: StepMcqOption;
      explanation: string;
    }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/step/phase-exit?phase=${phase}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error);
        setMeta(json);
      })
      .catch((e) => setError(e.message));
  }, [phase]);

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>;
  }

  if (!meta) return <PageSpinner />;

  return (
    <div className="p-4 md:p-8">
      <StepMcqRunner
        title={`Phase ${phase} exit — ${meta.title}`}
        subtitle={`Need ${meta.exitScoreRequired}+ to advance automatically`}
        questions={meta.questions}
        timeLimitMinutes={meta.timeLimitMinutes}
        submitLabel="Submit phase exit"
        onSubmit={async ({ answers, answerKey, durationMinutes }) => {
          const res = await fetch("/api/step/practice/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers,
              answerKey,
              mode: "phase_exit",
              phase,
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
            phaseAdvanced: json.phaseAdvanced,
            newPhase: json.newPhase,
            estimatedTotal: json.estimatedTotal,
          };
        }}
        onComplete={(res) => {
          const r = res as { phaseAdvanced?: boolean };
          setTimeout(
            () => router.push(r.phaseAdvanced ? STEP_ROUTES.accelerator : STEP_ROUTES.home),
            2500
          );
        }}
      />
    </div>
  );
}
