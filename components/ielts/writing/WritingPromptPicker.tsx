"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TASK1_CATEGORIES,
  TASK1_PROMPT_BANK,
  TASK2_CATEGORIES,
  TASK2_PROMPT_BANK,
  type Task1Question,
  type Task2Question,
} from "@/lib/ielts/writingTaskData";
import {
  mergeAttemptedIds,
  pickRecommendedTask1,
  pickRecommendedTask2,
  getLocalAttemptedPromptIds,
} from "@/lib/ielts/writingPromptRecommendation";
import { fetchAttemptedPromptIds } from "@/lib/ielts/writingPromptAttempts";

const VISUAL_ICONS: Record<Task1Question["visualType"], string> = {
  bar: "📊",
  line: "📈",
  pie: "🥧",
  table: "📋",
  map: "🗺️",
  process: "📐",
};

const ESSAY_ICONS: Record<Task2Question["essayType"], string> = {
  Opinion: "💭",
  Discussion: "⚖️",
  "Cause & Effect": "🔗",
  "Problem & Solution": "🔧",
  "Advantages & Disadvantages": "↔️",
  "Two-Part Question": "❓",
};

type Props = {
  taskType: "task1" | "task2";
  onSelectPrompt: (prompt: Task1Question | Task2Question) => void;
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

export default function WritingPromptPicker({ taskType, onSelectPrompt }: Props) {
  const [attemptedIds, setAttemptedIds] = useState<string[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    prompt: Task1Question | Task2Question;
    reason: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const serverIds = await fetchAttemptedPromptIds(taskType);
      const localIds = getLocalAttemptedPromptIds();
      const merged = mergeAttemptedIds(serverIds, localIds);
      if (!cancelled) {
        setAttemptedIds(merged);
        setLoadingAttempts(false);

        if (taskType === "task1") {
          const rec = pickRecommendedTask1(merged);
          if (rec) setRecommendation({ prompt: rec.prompt, reason: rec.reason });
        } else {
          const rec = pickRecommendedTask2(merged);
          if (rec) setRecommendation({ prompt: rec.prompt, reason: rec.reason });
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
    taskType === "task1" ? "Choose your Task 1 prompt" : "Choose your Task 2 question";

  const quickStartLabel =
    taskType === "task1" ? "Start today's recommended prompt" : "Start today's recommended question";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0d1b35]">{heading}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {taskType === "task1"
            ? "Pick a visual type and topic, or let Speakify choose based on what you haven't practised yet."
            : "Pick an essay type and topic, or let Speakify choose based on what you haven't tried yet."}
        </p>
      </div>

      {recommendation && !showBrowse ? (
        <div className="rounded-2xl border border-[#c9972c]/30 bg-gradient-to-br from-[#c9972c]/10 to-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
            Speakify recommends
          </p>
          <p className="mt-2 text-base font-bold text-[#0d1b35]">
            {taskType === "task1"
              ? (recommendation.prompt as Task1Question).title
              : (recommendation.prompt as Task2Question).title}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {taskType === "task1"
              ? (recommendation.prompt as Task1Question).summary
              : (recommendation.prompt as Task2Question).summary}
          </p>
          <p className="mt-2 text-xs text-slate-500">{recommendation.reason}</p>
          <button
            type="button"
            onClick={() => onSelectPrompt(recommendation.prompt)}
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
          {!showBrowse && recommendation ? null : (
            <button
              type="button"
              onClick={() => setShowBrowse(false)}
              className="text-sm font-semibold text-[#0d9488] hover:underline"
            >
              ← Back to recommended
            </button>
          )}

          {taskType === "task1"
            ? TASK1_CATEGORIES.map((category) => {
                const prompts = TASK1_PROMPT_BANK.filter((q) => q.visualType === category.id);
                return (
                  <section key={category.id}>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-[#0d1b35]">{category.label}</h3>
                      <p className="text-xs text-slate-500">{category.description}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {prompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          icon={VISUAL_ICONS[prompt.visualType]}
                          title={prompt.title}
                          summary={prompt.summary}
                          attempted={attemptedSet.has(prompt.id)}
                          onClick={() => onSelectPrompt(prompt)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            : TASK2_CATEGORIES.map((category) => {
                const prompts = TASK2_PROMPT_BANK.filter((q) => q.essayType === category.id);
                return (
                  <section key={category.id}>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-[#0d1b35]">{category.label}</h3>
                      <p className="text-xs text-slate-500">{category.description}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {prompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          icon={ESSAY_ICONS[prompt.essayType]}
                          title={prompt.title}
                          summary={prompt.summary}
                          attempted={attemptedSet.has(prompt.id)}
                          onClick={() => onSelectPrompt(prompt)}
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
          onClick={() => recommendation && onSelectPrompt(recommendation.prompt)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
        >
          {quickStartLabel}
        </button>
      ) : null}
    </div>
  );
}
