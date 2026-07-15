"use client";

import { useMemo, useState } from "react";
import type { ClassroomUnitContent } from "@/lib/classroom/b1-1-unit1";
import {
  SECTION_LABELS,
  SECTION_ORDER,
  type ClassroomSectionType,
} from "@/lib/classroom/levels";
import ClassroomQuiz from "./ClassroomQuiz";

function SectionNav({
  active,
  onSelect,
  showAnswerKey,
}: {
  active: ClassroomSectionType;
  onSelect: (t: ClassroomSectionType) => void;
  showAnswerKey?: boolean;
}) {
  return (
    <aside className="print:hidden sticky top-24 space-y-1 rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Unit sections
      </p>
      {SECTION_ORDER.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
            active === type
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          {SECTION_LABELS[type]}
        </button>
      ))}
      {showAnswerKey ? (
        <p className="mt-3 border-t border-slate-100 px-2 pt-3 text-xs text-amber-700">
          Teacher answer key is visible
        </p>
      ) : null}
    </aside>
  );
}

export default function UnitReader({
  unit,
  showAnswerKey = false,
}: {
  unit: ClassroomUnitContent;
  showAnswerKey?: boolean;
}) {
  const [active, setActive] = useState<ClassroomSectionType>("objectives");
  const section = unit.sections[active];

  const content = useMemo(() => {
    switch (active) {
      case "objectives": {
        const s = section as {
          intro: string;
          canDo: string[];
        };
        return (
          <div className="space-y-4">
            <p className="text-lg leading-relaxed text-slate-700">{s.intro}</p>
            <h3 className="text-base font-semibold">Learning objectives</h3>
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              {unit.learningObjectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <h3 className="text-base font-semibold">Can-do statements</h3>
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              {s.canDo.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        );
      }
      case "warm_up": {
        const s = section as {
          title: string;
          discussionPrompts: string[];
          predictionTask: string;
        };
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <ol className="list-decimal space-y-2 pl-5 text-slate-700">
              {s.discussionPrompts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Prediction
              </p>
              <p className="mt-1">{s.predictionTask}</p>
            </div>
          </div>
        );
      }
      case "reading": {
        const s = section as {
          title: string;
          wordCount: number;
          passage: string;
        };
        return (
          <article className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-2xl font-semibold tracking-tight">{s.title}</h3>
              <span className="text-xs text-slate-500">{s.wordCount} words</span>
            </div>
            <div className="space-y-4 text-[17px] leading-8 text-slate-800">
              {s.passage.split(/\n\n+/).map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>
          </article>
        );
      }
      case "comprehension": {
        const s = section as {
          instruction: string;
          questions: { id: number; kind: string; prompt: string; answer: string }[];
        };
        return (
          <div className="space-y-5">
            <p className="text-slate-600">{s.instruction}</p>
            {s.questions.map((q) => (
              <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Q{q.id} · {q.kind}
                </p>
                <p className="mt-1 font-medium text-slate-900">{q.prompt}</p>
                <textarea
                  className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Write your answer…"
                />
                {showAnswerKey ? (
                  <p className="mt-2 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    <span className="font-semibold">Answer: </span>
                    {unit.answerKey.comprehension[String(q.id)] ?? q.answer}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        );
      }
      case "vocabulary": {
        const s = section as {
          instruction: string;
          entries: {
            word: string;
            definition: string;
            example: string;
            collocation: string;
            arabicHint: string;
          }[];
        };
        return (
          <div className="space-y-4">
            <p className="text-slate-600">{s.instruction}</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Word</th>
                    <th className="px-3 py-2">Definition</th>
                    <th className="px-3 py-2">Example</th>
                    <th className="px-3 py-2">Collocation</th>
                    <th className="px-3 py-2">Arabic hint</th>
                  </tr>
                </thead>
                <tbody>
                  {s.entries.map((e) => (
                    <tr key={e.word} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-3 font-semibold">{e.word}</td>
                      <td className="px-3 py-3 text-slate-700">{e.definition}</td>
                      <td className="px-3 py-3 text-slate-700">{e.example}</td>
                      <td className="px-3 py-3 text-slate-700">{e.collocation}</td>
                      <td className="px-3 py-3 text-slate-700" dir="rtl">
                        {e.arabicHint}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      case "grammar": {
        const s = section as {
          title: string;
          explanation: string[];
          examples: { simple: string; continuous: string }[];
          exercises: {
            type: string;
            title: string;
            items?: { id: string; prompt: string; answer: string }[];
            prompt?: string;
            checklist?: string[];
          }[];
        };
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              {s.explanation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              {s.examples.map((ex) => (
                <div
                  key={ex.simple}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                >
                  <p>
                    <span className="font-semibold">Simple: </span>
                    {ex.simple}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">Continuous: </span>
                    {ex.continuous}
                  </p>
                </div>
              ))}
            </div>
            {s.exercises.map((ex) => (
              <div key={ex.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold">{ex.title}</h4>
                {ex.prompt ? <p className="mt-2 text-slate-700">{ex.prompt}</p> : null}
                {ex.checklist ? (
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                    {ex.checklist.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ) : null}
                {ex.items?.map((item) => (
                  <div key={item.id} className="mt-3">
                    <p className="text-sm text-slate-800">{item.prompt}</p>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Answer"
                    />
                    {showAnswerKey ? (
                      <p className="mt-1 text-xs text-emerald-700">
                        Key:{" "}
                        {Array.isArray(unit.answerKey.grammar[item.id])
                          ? (unit.answerKey.grammar[item.id] as string[]).join(" / ")
                          : String(unit.answerKey.grammar[item.id] ?? item.answer)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      case "listening": {
        const s = section as {
          title: string;
          audioNote: string;
          audioUrl: string | null;
          transcript: string;
          tasks: {
            prediction: string[];
            whileListening: { id: string; prompt: string; answer: string }[];
            postListening: string[];
          };
        };
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="text-sm text-slate-600">{s.audioNote}</p>
            {s.audioUrl ? (
              <audio controls className="w-full" src={s.audioUrl}>
                Your browser does not support audio.
              </audio>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Audio placeholder — upload via Classroom Admin when recording is ready.
              </div>
            )}
            <div>
              <h4 className="font-semibold">Prediction</h4>
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {s.tasks.prediction.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">While listening</h4>
              {s.tasks.whileListening.map((q) => (
                <div key={q.id} className="mt-3">
                  <p className="text-sm">{q.prompt}</p>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Answer"
                  />
                  {showAnswerKey ? (
                    <p className="mt-1 text-xs text-emerald-700">
                      Key: {unit.answerKey.listening[q.id] ?? q.answer}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold">Post-listening</h4>
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {s.tasks.postListening.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            {showAnswerKey ? (
              <details className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold">
                  Transcript (teacher)
                </summary>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {s.transcript}
                </pre>
              </details>
            ) : (
              <p className="text-xs text-slate-500">
                Transcript is hidden from students during the first plays (teacher controls reveal).
              </p>
            )}
          </div>
        );
      }
      case "speaking": {
        const s = section as {
          pairWork: { title: string; steps: string[] };
          groupDiscussion: { title: string; prompt: string };
          rolePlay: {
            title: string;
            roles: string[];
            successCriteria: string[];
          };
        };
        return (
          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">{s.pairWork.title}</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
                {s.pairWork.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">{s.groupDiscussion.title}</h3>
              <p className="mt-2 text-slate-700">{s.groupDiscussion.prompt}</p>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">{s.rolePlay.title}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                {s.rolePlay.roles.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-semibold text-slate-800">Success criteria</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                {s.rolePlay.successCriteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          </div>
        );
      }
      case "writing": {
        const s = section as {
          title: string;
          wordCount: string;
          prompt: string;
          modelAnswer: string;
          markingChecklist: string[];
        };
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="text-sm text-slate-500">Target: {s.wordCount}</p>
            <p className="text-slate-700">{s.prompt}</p>
            <textarea
              className="min-h-[180px] w-full rounded-lg border border-slate-200 bg-white p-3 text-sm"
              placeholder="Write your profile here…"
            />
            <div>
              <p className="font-semibold">Marking checklist</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {s.markingChecklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            {showAnswerKey ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-900">Model answer (teacher)</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
                  {s.modelAnswer}
                </p>
              </div>
            ) : null}
          </div>
        );
      }
      case "quiz":
        return (
          <ClassroomQuiz
            levelCode={unit.levelCode}
            unitNumber={unit.unitNumber}
            title={unit.quiz.title}
            questions={unit.quiz.questions}
            showAnswerKey={showAnswerKey}
            answerKey={unit.answerKey.quiz}
          />
        );
      case "cultural_bridge": {
        const s = section as {
          title: string;
          context: string;
          task: string[];
          reflectionPrompt: string;
        };
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="leading-7 text-slate-700">{s.context}</p>
            <ol className="list-decimal space-y-2 pl-5 text-slate-700">
              {s.task.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <p className="rounded-lg border border-slate-200 bg-white p-4 italic text-slate-700">
              {s.reflectionPrompt}
            </p>
          </div>
        );
      }
      case "reflection": {
        const s = section as {
          title: string;
          instruction: string;
          skills: string[];
          prompt: string;
        };
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="text-slate-600">{s.instruction}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {s.skills.map((skill) => (
                <label
                  key={skill}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-sm capitalize"
                >
                  {skill}
                  <select className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p className="text-slate-700">{s.prompt}</p>
            <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
        );
      }
      default:
        return null;
    }
  }, [active, section, showAnswerKey, unit]);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <SectionNav
        active={active}
        onSelect={setActive}
        showAnswerKey={showAnswerKey}
      />
      <div className="classroom-print-area min-w-0 rounded-2xl border border-slate-200 bg-[#fcfbf8] p-5 sm:p-8">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
            Speakify · {unit.levelCode} · Unit {unit.unitNumber}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {unit.theme}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Grammar focus: {unit.grammarFocus}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-800">
            {SECTION_LABELS[active]}
          </p>
        </div>
        {content}
      </div>
    </div>
  );
}
