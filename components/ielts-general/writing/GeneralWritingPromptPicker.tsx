"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GT_LETTER_CATEGORIES,
  GT_LETTER_PROMPT_BANK,
  GT_TASK2_CATEGORIES,
  GT_TASK2_PROMPT_BANK,
  LETTER_TYPE_LABELS,
  type GeneralLetterQuestion,
  type GeneralTask2Question,
} from "@/lib/ielts-general/writingTaskData";
import {
  mergeGtAttemptedIds,
  pickRecommendedGtLetter,
  pickRecommendedGtTask2,
  getLocalGtAttemptedPromptIds,
} from "@/lib/ielts-general/writingPromptRecommendation";
import { fetchGtAttemptedPromptIds } from "@/lib/ielts-general/writingPromptAttempts";

const LETTER_ICONS: Record<GeneralLetterQuestion["letterType"], string> = {
  formal: "📄",
  semi_formal: "✉️",
  informal: "💌",
};

const ESSAY_ICONS: Record<GeneralTask2Question["essayType"], string> = {
  Opinion: "💭",
  Discussion: "⚖️",
  "Cause & Effect": "🔗",
  "Problem & Solution": "🔧",
  "Advantages & Disadvantages": "↔️",
  "Two-Part Question": "❓",
};

type Props = {
  taskType: "task1" | "task2";
  onSelectLetter: (letter: GeneralLetterQuestion) => void;
  onSelectEssay: (essay: GeneralTask2Question) => void;
};

function PromptCard({
  icon,
  title,
  summary,
  attempted,
  onClick,
}: {
  icon: string;
  title: string;
  summary: string;
  attempted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#c9972c]/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        {attempted ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Done
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm font-bold text-[#0d1b35] group-hover:text-[#c9972c]">{title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{summary}</p>
    </button>
  );
}

export default function GeneralWritingPromptPicker({
  taskType,
  onSelectLetter,
  onSelectEssay,
}: Props) {
  const [attemptedIds, setAttemptedIds] = useState<string[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    letter?: GeneralLetterQuestion;
    essay?: GeneralTask2Question;
    reason: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const serverIds = await fetchGtAttemptedPromptIds(taskType);
      const localIds = getLocalGtAttemptedPromptIds();
      const merged = mergeGtAttemptedIds(serverIds, localIds);
      if (!cancelled) {
        setAttemptedIds(merged);
        setLoadingAttempts(false);

        if (taskType === "task1") {
          const rec = pickRecommendedGtLetter(merged);
          if (rec) setRecommendation({ letter: rec.prompt, reason: rec.reason });
        } else {
          const rec = pickRecommendedGtTask2(merged);
          if (rec) setRecommendation({ essay: rec.prompt, reason: rec.reason });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [taskType]);

  const attemptedSet = useMemo(() => new Set(attemptedIds), [attemptedIds]);

  const heading =
    taskType === "task1" ? "Choose your Task 1 letter" : "Choose your Task 2 question";

  const quickStartLabel =
    taskType === "task1"
      ? "Start today's recommended letter"
      : "Start today's recommended question";

  const recTitle =
    taskType === "task1" ? recommendation?.letter?.title : recommendation?.essay?.title;
  const recSummary =
    taskType === "task1" ? recommendation?.letter?.summary : recommendation?.essay?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0d1b35]">{heading}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {taskType === "task1"
            ? "Pick a letter type and scenario, or let Speakify choose based on what you haven't practised yet. GT Task 1 is always a letter — never a graph or chart."
            : "Pick an essay type and topic, or let Speakify choose based on what you haven't tried yet. Topics are everyday and workplace-relevant."}
        </p>
      </div>

      {recommendation && !showBrowse ? (
        <div className="rounded-2xl border border-[#c9972c]/30 bg-gradient-to-br from-[#c9972c]/10 to-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
            Speakify recommends
          </p>
          <p className="mt-2 text-base font-bold text-[#0d1b35]">{recTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{recSummary}</p>
          {taskType === "task1" && recommendation.letter ? (
            <p className="mt-2 text-xs font-medium text-[#0d9488]">
              {LETTER_TYPE_LABELS[recommendation.letter.letterType]} letter
            </p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">{recommendation.reason}</p>
          <button
            type="button"
            onClick={() => {
              if (taskType === "task1" && recommendation.letter) {
                onSelectLetter(recommendation.letter);
              } else if (recommendation.essay) {
                onSelectEssay(recommendation.essay);
              }
            }}
            disabled={loadingAttempts}
            className="mt-4 w-full rounded-xl bg-[#c9972c] py-3 text-sm font-bold text-[#0d1b35] shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {quickStartLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowBrowse(true)}
            className="mt-3 w-full text-center text-sm font-semibold text-[#0d9488] hover:underline"
          >
            Or browse all prompts →
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {showBrowse && recommendation ? (
            <button
              type="button"
              onClick={() => setShowBrowse(false)}
              className="text-sm font-semibold text-[#0d9488] hover:underline"
            >
              ← Back to recommended
            </button>
          ) : null}

          {taskType === "task1"
            ? GT_LETTER_CATEGORIES.map((category) => {
                const letters = GT_LETTER_PROMPT_BANK.filter(
                  (q) => q.letterType === category.id
                );
                return (
                  <section key={category.id}>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-[#0d1b35]">{category.label}</h3>
                      <p className="text-xs text-slate-500">{category.description}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {letters.map((letter) => (
                        <PromptCard
                          key={letter.id}
                          icon={LETTER_ICONS[letter.letterType]}
                          title={letter.title}
                          summary={letter.summary}
                          attempted={attemptedSet.has(letter.id)}
                          onClick={() => onSelectLetter(letter)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            : GT_TASK2_CATEGORIES.map((category) => {
                const essays = GT_TASK2_PROMPT_BANK.filter(
                  (q) => q.essayType === category.id
                );
                return (
                  <section key={category.id}>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-[#0d1b35]">{category.label}</h3>
                      <p className="text-xs text-slate-500">{category.description}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {essays.map((essay) => (
                        <PromptCard
                          key={essay.id}
                          icon={ESSAY_ICONS[essay.essayType]}
                          title={essay.title}
                          summary={essay.summary}
                          attempted={attemptedSet.has(essay.id)}
                          onClick={() => onSelectEssay(essay)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
        </div>
      )}

      {showBrowse && recommendation ? (
        <button
          type="button"
          onClick={() => {
            if (taskType === "task1" && recommendation.letter) {
              onSelectLetter(recommendation.letter);
            } else if (recommendation.essay) {
              onSelectEssay(recommendation.essay);
            }
          }}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
        >
          {quickStartLabel}
        </button>
      ) : null}
    </div>
  );
}
