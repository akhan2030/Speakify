"use client";

import { useMemo, useState } from "react";
import VocabCard from "./VocabCard";
import GrammarRuleBox from "./GrammarRuleBox";
import MCQBlock from "./MCQBlock";
import FillBlank from "./FillBlank";
import MatchingExercise from "./MatchingExercise";
import ListeningPlayer from "./ListeningPlayer";
import ReadingPassage from "./ReadingPassage";
import SpeakingPrompt from "./SpeakingPrompt";
import WritingTask from "./WritingTask";
import PosterTaskBuilder from "./PosterTaskBuilder";
import SelfReflection from "./SelfReflection";

export type LessonSectionInput = {
  sectionType?: string;
  type?: string;
  title?: string;
  content?: Record<string, unknown> | null;
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asNumber(value: unknown, fallback?: number): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function normalizeType(section: LessonSectionInput): string {
  return String(section.sectionType ?? section.type ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function DiscussionBlock({
  title,
  prompts,
  teacherNote,
}: {
  title?: string;
  prompts: string[];
  teacherNote?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        Discussion
      </p>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">
        {title ?? "Class discussion"}
      </h3>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] text-slate-700">
        {prompts.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      {teacherNote ? (
        <aside className="mt-4 rounded-xl border border-[#d4c4a0] bg-[#f7f4ef] px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-[#8a6a1f]">Teacher · </span>
          {teacherNote}
        </aside>
      ) : null}
    </section>
  );
}

function GenericTaskBlock({
  title,
  content,
  label,
}: {
  title?: string;
  content: Record<string, unknown>;
  label: string;
}) {
  const instruction = asString(
    content.instruction ?? content.prompt ?? content.description
  );
  const steps = asStringArray(content.steps ?? content.bullets ?? content.tasks);
  const checklist = asStringArray(content.checklist);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        {label}
      </p>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">
        {title ?? asString(content.title, label)}
      </h3>
      {instruction ? (
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
          {instruction}
        </p>
      ) : null}
      {steps.length > 0 ? (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : null}
      {checklist.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {checklist.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function LessonSectionRenderer({
  section,
  showAnswer = false,
}: {
  section: LessonSectionInput;
  showAnswer?: boolean;
}) {
  const type = normalizeType(section);
  const content = (section.content ?? {}) as Record<string, unknown>;
  const title =
    section.title || asString(content.title) || undefined;

  const body = useMemo(() => {
    switch (type) {
      case "vocab":
      case "vocabulary":
      case "wordlist": {
        const items = Array.isArray(content.items)
          ? content.items
          : Array.isArray(content.entries)
            ? content.entries
            : Array.isArray(content.words)
              ? content.words
              : [];
        const instruction = asString(content.instruction);

        return (
          <div className="space-y-4">
            {title ? (
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            ) : null}
            {instruction ? (
              <p className="text-slate-600">{instruction}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((raw, i) => {
                const item = (raw ?? {}) as Record<string, unknown>;
                const word = asString(item.word, `word-${i}`);
                return (
                  <VocabCard
                    key={`${word}-${i}`}
                    word={word}
                    definition={asString(item.definition) || undefined}
                    example={asString(item.example) || undefined}
                    arabicHint={asString(item.arabicHint) || undefined}
                    partOfSpeech={asString(item.partOfSpeech) || undefined}
                    collocation={asString(item.collocation) || undefined}
                  />
                );
              })}
            </div>
          </div>
        );
      }

      case "grammar": {
        const explanation = asStringArray(
          content.explanation ?? content.bullets ?? content.rules
        );
        const examples: { label?: string; text: string }[] = [];
        if (Array.isArray(content.examples)) {
          for (const ex of content.examples) {
            if (typeof ex === "string" && ex.trim()) {
              examples.push({ text: ex });
              continue;
            }
            const obj = (ex ?? {}) as Record<string, unknown>;
            if (typeof obj.text === "string") {
              examples.push({
                label: asString(obj.label) || undefined,
                text: obj.text,
              });
            } else if (typeof obj.simple === "string") {
              examples.push({
                label: "Simple / Continuous",
                text: `${obj.simple}${
                  typeof obj.continuous === "string"
                    ? ` · ${obj.continuous}`
                    : ""
                }`,
              });
            } else {
              const text = asString(obj.example ?? obj.sentence);
              if (text) examples.push({ text });
            }
          }
        }

        return (
          <GrammarRuleBox
            title={title ?? "Grammar"}
            explanation={explanation}
            examples={examples}
          />
        );
      }

      case "mcq":
      case "true_false": {
        const options =
          asStringArray(content.options).length > 0
            ? asStringArray(content.options)
            : type === "true_false"
              ? ["True", "False"]
              : [];
        const correctAnswer = asString(
          content.correctAnswer ?? content.answer ?? content.correct
        );
        return (
          <MCQBlock
            id={asString(content.id, title ?? "1")}
            prompt={asString(content.prompt ?? content.question, title ?? "")}
            options={options}
            correctAnswer={correctAnswer}
            showAnswer={showAnswer}
          />
        );
      }

      case "fill_blank":
      case "gap_fill": {
        const answerRaw = content.answer ?? content.correctAnswer ?? content.correct;
        const answer = Array.isArray(answerRaw)
          ? answerRaw.filter((a): a is string => typeof a === "string")
          : asString(answerRaw);
        return (
          <FillBlank
            id={content.id as string | number | undefined}
            prompt={asString(content.prompt ?? content.question, title ?? "")}
            answer={answer}
            blankToken={asString(content.blankToken, "______")}
            showAnswer={showAnswer}
          />
        );
      }

      case "matching": {
        const pairs = Array.isArray(content.pairs)
          ? content.pairs
              .map((p) => {
                const pair = (p ?? {}) as Record<string, unknown>;
                return {
                  left: asString(pair.left),
                  right: asString(pair.right),
                };
              })
              .filter((p) => p.left && p.right)
          : [];
        return (
          <MatchingExercise
            title={title ?? "Match the pairs"}
            pairs={pairs}
            showAnswer={showAnswer}
          />
        );
      }

      case "listening":
        return (
          <ListeningPlayer
            title={title ?? "Listening"}
            src={
              (content.src as string | null | undefined) ??
              (content.audioUrl as string | null | undefined) ??
              null
            }
            transcript={asString(content.transcript)}
            audioNote={asString(content.audioNote) || undefined}
          />
        );

      case "reading":
        return (
          <ReadingPassage
            title={title ?? "Reading"}
            passage={asString(content.passage ?? content.text)}
            wordCount={asNumber(content.wordCount)}
            glossary={
              Array.isArray(content.glossary)
                ? content.glossary
                    .map((g) => {
                      const entry = (g ?? {}) as Record<string, unknown>;
                      return {
                        word: asString(entry.word),
                        definition: asString(entry.definition),
                      };
                    })
                    .filter((g) => g.word && g.definition)
                : undefined
            }
          />
        );

      case "speaking": {
        const rolePlay =
          content.rolePlay && typeof content.rolePlay === "object"
            ? (content.rolePlay as Record<string, unknown>)
            : null;
        const pairWork =
          content.pairWork && typeof content.pairWork === "object"
            ? (content.pairWork as Record<string, unknown>)
            : null;
        const groupDiscussion =
          content.groupDiscussion && typeof content.groupDiscussion === "object"
            ? (content.groupDiscussion as Record<string, unknown>)
            : null;

        let roles: { name: string; description?: string; lines?: string[] }[] =
          [];
        const rolesSource = Array.isArray(content.roles)
          ? content.roles
          : Array.isArray(rolePlay?.roles)
            ? rolePlay.roles
            : [];
        for (const r of rolesSource) {
          if (typeof r === "string" && r.trim()) {
            roles.push({ name: r });
          } else if (r && typeof r === "object") {
            const obj = r as Record<string, unknown>;
            const name = asString(obj.name ?? obj.role);
            if (name) {
              roles.push({
                name,
                description: asString(obj.description) || undefined,
                lines: asStringArray(obj.lines),
              });
            }
          }
        }

        const modeRaw = asString(content.mode).toLowerCase();
        const mode =
          roles.length > 0
            ? "roleplay"
            : modeRaw === "group"
              ? "group"
              : "pair";

        return (
          <SpeakingPrompt
            title={
              title ||
              asString(rolePlay?.title ?? pairWork?.title, "Speaking")
            }
            mode={mode}
            prompt={asString(
              content.prompt ?? groupDiscussion?.prompt ?? groupDiscussion?.title
            )}
            steps={asStringArray(
              content.steps ?? pairWork?.steps ?? rolePlay?.steps
            )}
            roles={roles}
            successCriteria={asStringArray(
              content.successCriteria ?? rolePlay?.successCriteria
            )}
            teacherNote={asString(content.teacherNote) || undefined}
          />
        );
      }

      case "writing":
        return (
          <WritingTask
            title={title ?? "Writing"}
            prompt={asString(content.prompt ?? content.instruction)}
            targetWords={
              asNumber(content.targetWords) ??
              asNumber(
                typeof content.wordCount === "string"
                  ? String(content.wordCount).match(/\d+/)?.[0]
                  : content.wordCount,
                120
              )
            }
            teacherReviewNote={asString(content.teacherReviewNote) || undefined}
            checklist={asStringArray(
              content.checklist ?? content.markingChecklist
            )}
          />
        );

      case "task":
      case "pre_task":
      case "post_task": {
        const looksLikePoster =
          content.builder === "poster" ||
          content.kind === "poster" ||
          asString(content.taskType) === "poster" ||
          content.slogan !== undefined ||
          Array.isArray(content.bullets) ||
          asString(content.instruction).toLowerCase().includes("poster") ||
          asString(title).toLowerCase().includes("poster");

        if (looksLikePoster) {
          return (
            <PosterTaskBuilder
              title={title ?? "Poster task"}
              instruction={asString(content.instruction) || undefined}
              defaultSlogan={asString(content.slogan)}
              defaultBullets={asStringArray(content.bullets)}
            />
          );
        }

        const label =
          type === "pre_task"
            ? "Pre-task"
            : type === "post_task"
              ? "Post-task"
              : "Task";
        return (
          <GenericTaskBlock title={title} content={content} label={label} />
        );
      }

      case "reflection":
        return (
          <SelfReflection
            title={title ?? "Self-reflection"}
            instruction={asString(content.instruction) || undefined}
            prompt={asString(content.prompt) || undefined}
          />
        );

      case "discussion":
      case "warm_up":
        return (
          <DiscussionBlock
            title={title}
            prompts={asStringArray(
              content.prompts ??
                content.discussionPrompts ??
                content.questions ??
                content.steps
            )}
            teacherNote={asString(content.teacherNote) || undefined}
          />
        );

      default:
        return (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-[#f7f4ef] p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">
              {title || type || "Section"}
            </p>
            <p className="mt-2">
              This section type ({type || "unknown"}) is not mapped yet. Your
              teacher will guide this activity in class.
            </p>
          </section>
        );
    }
  }, [type, title, content, showAnswer]);

  return <div className="min-w-0">{body}</div>;
}
