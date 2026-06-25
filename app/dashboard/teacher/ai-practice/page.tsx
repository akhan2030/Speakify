"use client";

import { useCallback, useEffect, useState } from "react";

type TaskContent = Record<string, unknown>;
type AnswerKey = Record<string, unknown> | null;

type PracticeTask = {
  id: string;
  skill?: string;
  title?: string;
  status?: string;
  topic?: string;
  cefr_level?: string;
  cefrLevel?: string;
  content?: TaskContent;
  answer_key?: AnswerKey;
  answerKey?: AnswerKey;
};

type StatusFilter = "all" | "draft" | "published" | "rejected";

const STATUS_FILTERS: { id: StatusFilter; label: string; hint?: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft", hint: "needs review" },
  { id: "published", label: "Published", hint: "already live" },
  { id: "rejected", label: "Rejected" },
];

function getTaskStatus(task: PracticeTask) {
  return (task.status ?? "draft").toLowerCase();
}

function matchesStatusFilter(task: PracticeTask, filter: StatusFilter) {
  const status = getTaskStatus(task);
  if (filter === "all") return true;
  if (filter === "draft") {
    return status === "draft" || status === "approved";
  }
  return status === filter;
}

function getLevel(task: PracticeTask) {
  return task.cefr_level ?? task.cefrLevel ?? "—";
}

function getAnswerKey(task: PracticeTask) {
  return task.answer_key ?? task.answerKey ?? null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#0d1b35]">
        {title}
      </h3>
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        {children}
      </div>
    </div>
  );
}

function VocabularyPreview({ content }: { content: TaskContent }) {
  const quiz = content.mini_quiz as Record<string, unknown> | undefined;
  return (
    <>
      <Section title="Word">
        <p className="text-2xl font-bold text-[#0d1b35]">{String(content.word ?? "")}</p>
        {content.part_of_speech ? (
          <p className="mt-1 italic text-slate-500">{String(content.part_of_speech)}</p>
        ) : null}
        {content.pronunciation_ipa ? (
          <p className="mt-1 font-mono text-[#0d9488]">{String(content.pronunciation_ipa)}</p>
        ) : null}
      </Section>
      <Section title="Definition">
        <p>{String(content.definition ?? "")}</p>
        {content.definition_arabic ? (
          <p className="mt-2 text-right font-medium text-[#0d1b35]" dir="rtl">
            {String(content.definition_arabic)}
          </p>
        ) : null}
      </Section>
      {content.example_sentence ? (
        <Section title="Example">
          <p className="italic">&ldquo;{String(content.example_sentence)}&rdquo;</p>
        </Section>
      ) : null}
      {content.ielts_example ? (
        <Section title="IELTS example">
          <p className="italic">&ldquo;{String(content.ielts_example)}&rdquo;</p>
        </Section>
      ) : null}
      {content.saudi_context ? (
        <Section title="Saudi context">
          <p>{String(content.saudi_context)}</p>
        </Section>
      ) : null}
      {quiz?.question ? (
        <Section title="Mini quiz">
          <p className="font-medium">{String(quiz.question)}</p>
          {Array.isArray(quiz.options) ? (
            <ul className="mt-2 list-inside list-disc space-y-1">
              {(quiz.options as string[]).map((opt, i) => (
                <li key={i}>{opt}</li>
              ))}
            </ul>
          ) : null}
        </Section>
      ) : null}
    </>
  );
}

function QuestionsList({
  questions,
}: {
  questions: Array<Record<string, unknown>>;
}) {
  if (!questions.length) return <p className="text-slate-400">No questions</p>;
  return (
    <ol className="list-decimal space-y-3 pl-5">
      {questions.map((q, i) => (
        <li key={String(q.id ?? i)}>
          <p className="font-medium">
            {String(q.question ?? q.text ?? q.stem ?? `Question ${i + 1}`)}
          </p>
          {Array.isArray(q.options) && q.options.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-slate-600">
              {(q.options as string[]).map((opt, j) => (
                <li key={j}>{String(opt)}</li>
              ))}
            </ul>
          ) : null}
          {q.correct_answer || q.answer ? (
            <p className="mt-1 text-xs text-[#0d9488]">
              Answer: {String(q.correct_answer ?? q.answer)}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function ReadingPreview({ content }: { content: TaskContent }) {
  return (
    <>
      {content.passage ? (
        <Section title="Passage">
          {content.title ? (
            <p className="mb-2 font-semibold text-[#0d1b35]">{String(content.title)}</p>
          ) : null}
          <p className="whitespace-pre-wrap leading-relaxed">{String(content.passage)}</p>
        </Section>
      ) : null}
      {Array.isArray(content.questions) ? (
        <Section title="Questions">
          <QuestionsList questions={content.questions as Array<Record<string, unknown>>} />
        </Section>
      ) : null}
    </>
  );
}

function ListeningPreview({ content }: { content: TaskContent }) {
  const hasAudio = Boolean(content.audio_base64);
  return (
    <>
      {hasAudio ? (
        <p className="mb-3 rounded-lg bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
          Audio included ({content.audio_type ? String(content.audio_type) : "audio/mpeg"})
        </p>
      ) : null}
      {content.transcript ? (
        <Section title="Transcript">
          <p className="whitespace-pre-wrap leading-relaxed">{String(content.transcript)}</p>
        </Section>
      ) : null}
      {Array.isArray(content.questions) ? (
        <Section title="Questions">
          <QuestionsList questions={content.questions as Array<Record<string, unknown>>} />
        </Section>
      ) : null}
    </>
  );
}

function WritingPreview({ content }: { content: TaskContent }) {
  return (
    <>
      {content.prompt ? (
        <Section title="Prompt">
          <p className="whitespace-pre-wrap">{String(content.prompt)}</p>
        </Section>
      ) : null}
      {content.visual_data ? (
        <Section title="Visual data">
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(content.visual_data, null, 2)}
          </pre>
        </Section>
      ) : null}
      {content.model_answer_band_6 ? (
        <Section title="Model answer — Band 6">
          <p className="whitespace-pre-wrap">
            {String(
              (content.model_answer_band_6 as Record<string, unknown>).text ??
                content.model_answer_band_6
            )}
          </p>
        </Section>
      ) : null}
      {content.model_answer_band_7 ? (
        <Section title="Model answer — Band 7">
          <p className="whitespace-pre-wrap">
            {String(
              (content.model_answer_band_7 as Record<string, unknown>).text ??
                content.model_answer_band_7
            )}
          </p>
        </Section>
      ) : null}
    </>
  );
}

function GrammarPreview({ content }: { content: TaskContent }) {
  const lesson = content.lesson as Record<string, unknown> | undefined;
  return (
    <>
      {content.grammar_rule ? (
        <Section title="Grammar rule">
          <p>{String(content.grammar_rule)}</p>
        </Section>
      ) : null}
      {lesson?.rule_explanation ? (
        <Section title="Explanation">
          <p className="whitespace-pre-wrap">{String(lesson.rule_explanation)}</p>
        </Section>
      ) : null}
      {Array.isArray(lesson?.examples) ? (
        <Section title="Examples">
          <ul className="space-y-2">
            {(lesson.examples as Array<Record<string, unknown>>).map((ex, i) => (
              <li key={i}>
                <p className="font-medium">{String(ex.sentence ?? "")}</p>
                {ex.explanation ? (
                  <p className="text-xs text-slate-500">{String(ex.explanation)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {Array.isArray(content.practice_questions) ? (
        <Section title="Practice questions">
          <QuestionsList
            questions={content.practice_questions as Array<Record<string, unknown>>}
          />
        </Section>
      ) : null}
      {content.ielts_example ? (
        <Section title="IELTS example">
          <p className="italic">
            {String((content.ielts_example as Record<string, unknown>).sentence ?? "")}
          </p>
        </Section>
      ) : null}
    </>
  );
}

function TaskPreviewContent({ task }: { task: PracticeTask }) {
  const content = task.content ?? {};
  const skill = (task.skill ?? "").toLowerCase();

  if (skill === "vocabulary") return <VocabularyPreview content={content} />;
  if (skill === "reading") return <ReadingPreview content={content} />;
  if (skill === "listening") return <ListeningPreview content={content} />;
  if (skill === "writing") return <WritingPreview content={content} />;
  if (skill === "grammar") return <GrammarPreview content={content} />;

  return (
    <Section title="Content">
      <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
        {JSON.stringify(content, null, 2)}
      </pre>
    </Section>
  );
}

function AnswerKeyPreview({ answerKey }: { answerKey: AnswerKey }) {
  if (!answerKey) return null;

  const questions = answerKey.questions as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(questions) && questions.length > 0) {
    return (
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
        <h3 className="mb-2 font-bold text-green-800">Answer Key</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-green-800">
          {questions.map((q, i) => (
            <li key={String(q.id ?? i)}>
              {String(q.correct_answer ?? q.answer ?? JSON.stringify(q))}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (answerKey.correct_index !== undefined) {
    return (
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
        <h3 className="mb-2 font-bold text-green-800">Answer Key</h3>
        <p className="text-sm text-green-700">
          Correct option index: {String(answerKey.correct_index)}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <h3 className="mb-2 font-bold text-green-800">Answer Key</h3>
      <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-green-700">
        {JSON.stringify(answerKey, null, 2)}
      </pre>
    </div>
  );
}

export default function AIPracticePage() {
  const [tasks, setTasks] = useState<PracticeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTask, setPreviewTask] = useState<PracticeTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/ai-practice", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load tasks");
      setTasks(data.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function updateStatus(taskId: string, status: string) {
    const body: Record<string, string> = { status };
    if (status === "rejected") {
      body.rejectionReason = "Rejected by teacher";
    }

    const res = await fetch(`/api/teacher/ai-practice/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Update failed");
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    setPreviewTask((prev) =>
      prev?.id === taskId ? { ...prev, status } : prev
    );
  }

  const filteredTasks = tasks.filter((task) => matchesStatusFilter(task, statusFilter));
  const filterCounts = STATUS_FILTERS.reduce(
    (acc, { id }) => {
      acc[id] = tasks.filter((task) => matchesStatusFilter(task, id)).length;
      return acc;
    },
    {} as Record<StatusFilter, number>
  );

  async function handleStatusFromModal(taskId: string, status: string) {
    await updateStatus(taskId, status);
    setPreviewTask(null);
  }

  if (loading) {
    return <div className="p-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-[#0d1b35]">AI Practice Bank</h1>
      <p className="mb-6 text-gray-500">Review and publish AI-generated content</p>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {tasks.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ id, label, hint }) => {
            const active = statusFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#0d1b35] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#c9972c]/40 hover:text-[#0d1b35]"
                }`}
              >
                {label}
                {hint ? (
                  <span className={active ? "text-white/70" : "text-slate-400"}>
                    {" "}
                    ({hint})
                  </span>
                ) : null}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {filterCounts[id]}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <p className="text-gray-400">No tasks found. Run the agents first.</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-gray-400">No tasks match this filter.</p>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const level = getLevel(task);
            const isPublished = getTaskStatus(task) === "published";
            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewTask(task)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setPreviewTask(task);
                }}
                className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition hover:border-[#c9972c]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#c9972c]">
                      {task.skill}
                    </span>
                    <h3 className="mt-1 font-bold text-[#0d1b35]">{task.title}</h3>
                    <p className="text-sm text-gray-500">
                      {level} · {task.status}
                      {task.topic ? ` · ${task.topic}` : ""}
                    </p>
                  </div>
                  <div
                    className="flex shrink-0 flex-wrap gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewTask(task)}
                      className="rounded bg-[#0d1b35] px-3 py-1 text-sm text-white"
                    >
                      Preview
                    </button>
                    {isPublished ? (
                      <span className="rounded bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                        ✓ Published
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(task.id, "approved")}
                          className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(task.id, "published")}
                          className="rounded bg-[#c9972c] px-3 py-1 text-sm text-white"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(task.id, "rejected")}
                          className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewTask ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewTask(null)}
          role="presentation"
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-[#c9972c]">
                  {previewTask.skill}
                </span>
                <h2 id="preview-title" className="mt-1 text-xl font-bold text-[#0d1b35]">
                  {previewTask.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {getLevel(previewTask)}
                  {previewTask.topic ? ` · ${previewTask.topic}` : ""}
                  {previewTask.status ? ` · ${previewTask.status}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTask(null)}
                className="text-2xl font-bold text-gray-400 hover:text-gray-600"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <TaskPreviewContent task={previewTask} />
            </div>

            <AnswerKeyPreview answerKey={getAnswerKey(previewTask)} />

            <div className="mt-4 flex flex-wrap gap-3">
              {getTaskStatus(previewTask) === "published" ? (
                <span className="flex-1 rounded-lg bg-green-100 py-2 text-center font-bold text-green-700">
                  ✓ Published
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusFromModal(previewTask.id, "published")}
                    className="flex-1 rounded-lg bg-[#c9972c] py-2 font-bold text-white"
                  >
                    ✓ Approve & Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFromModal(previewTask.id, "approved")}
                    className="flex-1 rounded-lg bg-green-600 py-2 font-bold text-white"
                  >
                    Approve Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFromModal(previewTask.id, "rejected")}
                    className="flex-1 rounded-lg bg-red-600 py-2 font-bold text-white"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setPreviewTask(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 font-bold text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
