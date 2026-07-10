"use client";

import { useCallback, useState } from "react";
import {
  canSubmitWriting,
  submitLabelForWritingTask,
  writingWordLimitExceededMessage,
} from "@/lib/ielts/writingCriteria";
import { resolveWritingOverallBand } from "@/lib/ielts/writingBandScore";
import {
  setGeneralLetterById,
  setGeneralTask2ById,
  type GeneralLetterQuestion,
  type GeneralTask2Question,
} from "@/lib/ielts-general/writingTaskData";
import { recordGtPromptAttempt } from "@/lib/ielts-general/writingPromptAttempts";
import GeneralWritingPracticeForm from "@/components/ielts-general/writing/GeneralWritingPracticeForm";
import GeneralWritingPromptPicker from "@/components/ielts-general/writing/GeneralWritingPromptPicker";
import GeneralGtWritingFeedback from "@/components/ielts-general/writing/GeneralGtWritingFeedback";
import type { GtStructuredWritingFeedback } from "@/lib/ielts-general/gtWritingScoringSchema";
import type { LetterType } from "@/lib/ielts-general/writingTaskData";

export default function GeneralWritingPracticePanel({
  lockTaskType,
}: {
  lockTaskType: "task1" | "task2";
}) {
  const [selectedLetter, setSelectedLetter] = useState<GeneralLetterQuestion | null>(null);
  const [selectedEssay, setSelectedEssay] = useState<GeneralTask2Question | null>(null);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [structuredFeedback, setStructuredFeedback] =
    useState<GtStructuredWritingFeedback | null>(null);
  const [overallBand, setOverallBand] = useState<number | null>(null);

  const selectedPrompt = lockTaskType === "task1" ? selectedLetter : selectedEssay;
  const promptId = selectedPrompt?.id;

  const [questionMeta, setQuestionMeta] = useState<{
    questionPrompt: string;
    letterType?: LetterType;
    essayType?: string;
  }>({ questionPrompt: "" });

  const handleQuestionChange = useCallback(
    (meta: {
      questionPrompt: string;
      letterType?: LetterType;
      essayType?: string;
    }) => {
      setQuestionMeta(meta);
    },
    []
  );

  function handleSelectLetter(letter: GeneralLetterQuestion) {
    setSelectedLetter(letter);
    setGeneralLetterById(letter.id);
    setEssay("");
    setStructuredFeedback(null);
    setOverallBand(null);
    setError(null);
    setQuestionMeta({
      questionPrompt: letter.prompt,
      letterType: letter.letterType,
    });
  }

  function handleSelectEssay(task2: GeneralTask2Question) {
    setSelectedEssay(task2);
    setGeneralTask2ById(task2.id);
    setEssay("");
    setStructuredFeedback(null);
    setOverallBand(null);
    setError(null);
    setQuestionMeta({
      questionPrompt: task2.prompt,
      essayType: task2.essayType,
    });
  }

  function handleChangePrompt() {
    if (lockTaskType === "task1") setSelectedLetter(null);
    else setSelectedEssay(null);
    setEssay("");
    setStructuredFeedback(null);
    setOverallBand(null);
    setError(null);
    setQuestionMeta({ questionPrompt: "" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!essay.trim()) {
      setError("Please write your response first.");
      return;
    }

    if (!canSubmitWriting(essay, lockTaskType)) {
      setError(writingWordLimitExceededMessage(lockTaskType));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ielts-general/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay,
          taskType: lockTaskType,
          questionPrompt: questionMeta.questionPrompt,
          letterType: questionMeta.letterType,
          essayType: questionMeta.essayType,
          promptId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Evaluation failed. Try again.");
        return;
      }
      if (promptId) recordGtPromptAttempt(promptId);
      if (data.structuredFeedback) {
        setStructuredFeedback(data.structuredFeedback as GtStructuredWritingFeedback);
      }
      const resolvedOverall = resolveWritingOverallBand(
        data.bands,
        data.structuredFeedback?.evaluation ?? data.evaluation ?? "",
        lockTaskType
      );
      if (resolvedOverall != null) {
        setOverallBand(resolvedOverall);
      } else if (data.structuredFeedback?.overallBand != null) {
        setOverallBand(Number(data.structuredFeedback.overallBand));
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!selectedPrompt) {
    return (
      <GeneralWritingPromptPicker
        taskType={lockTaskType}
        onSelectLetter={handleSelectLetter}
        onSelectEssay={handleSelectEssay}
      />
    );
  }

  if (structuredFeedback && overallBand != null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
          IELTS General Training — {lockTaskType === "task1" ? "Task 1 Letter" : "Task 2 Essay"}
        </p>
        <GeneralGtWritingFeedback feedback={structuredFeedback} overallBand={overallBand} />
        <button
          type="button"
          onClick={() => {
            setStructuredFeedback(null);
            setEssay("");
            setOverallBand(null);
            setError(null);
          }}
          className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleChangePrompt}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Choose a different {lockTaskType === "task1" ? "letter" : "question"}
        </button>
        <span className="text-xs text-slate-500">{selectedPrompt.title}</span>
      </div>

      <GeneralWritingPracticeForm
        taskType={lockTaskType}
        essay={essay}
        onEssayChange={setEssay}
        loading={loading}
        error={error}
        onSubmit={onSubmit}
        formClassName="space-y-6"
        submitLabel={submitLabelForWritingTask(lockTaskType)}
        onQuestionChange={handleQuestionChange}
        hidePromptPicker
        letterQuestion={selectedLetter ?? undefined}
        task2Question={selectedEssay ?? undefined}
      />
    </div>
  );
}
