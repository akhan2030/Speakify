"use client";

import { useState } from "react";
import type {
  NormalizedListeningSection,
  NormalizedReadingPassage,
} from "@/lib/accelerator/normalizePracticeContent";

type DebugPayload = {
  testId?: string;
  track?: string;
  section?: string;
  rawContent?: unknown;
  listeningSections?: NormalizedListeningSection[];
  readingPassages?: NormalizedReadingPassage[];
};

export default function PracticeDebugPanel({ payload }: { payload: DebugPayload }) {
  const [open, setOpen] = useState(true);

  const sections = payload.listeningSections ?? [];
  const readingQuestions = (payload.readingPassages ?? []).flatMap((p) =>
    p.questions.map((q) => ({
      passageId: p.id,
      questionId: q.key,
      type: q.questionType ?? q.type,
      questionText: q.questionText ?? q.label,
      optionCount: q.options.length,
      audioUrl: q.audioUrl,
      validationErrors: q.validationErrors,
      raw: q.raw,
    }))
  );

  const listeningQuestions = sections.flatMap((s) =>
    s.questions.map((q) => ({
      sectionId: s.id,
      questionId: q.key,
      type: q.questionType ?? q.type,
      questionText: q.questionText ?? q.label,
      optionCount: q.options.length,
      audioUrl: q.audioUrl ?? s.audioUrl,
      validationErrors: q.validationErrors,
      raw: q.raw,
    }))
  );

  const allQuestions = [...listeningQuestions, ...readingQuestions];

  return (
    <div className="mb-6 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-bold text-purple-800"
      >
        {open ? "▼" : "▶"} Debug Panel (temporary)
      </button>

      {open ? (
        <div className="mt-3 space-y-3 text-xs font-mono text-purple-950">
          <p>Test ID: {payload.testId ?? "—"}</p>
          <p>
            Track: {payload.track ?? "—"} | Section: {payload.section ?? "—"}
          </p>

          {sections.map((s) => (
            <div key={s.id} className="rounded border border-purple-200 bg-white p-2">
              <p className="font-bold">
                Listening Section {s.id} | audio_url: {s.audioUrl ?? "(TTS)"} | transcript:{" "}
                {s.transcript.length} chars
              </p>
            </div>
          ))}

          {allQuestions.map((q) => (
            <div
              key={`${"sectionId" in q ? q.sectionId : q.passageId}-${q.questionId}`}
              className="rounded border border-purple-100 bg-white p-2"
            >
              <p>
                <strong>ID: {q.questionId}</strong> | Type: {q.type} | Options: {q.optionCount}
              </p>
              <p>Question Text: {q.questionText?.slice(0, 140) || "(empty)"}</p>
              <p>Audio URL: {q.audioUrl ?? "—"}</p>
              {q.validationErrors.length ? (
                <p className="text-red-600">Errors: {q.validationErrors.join(", ")}</p>
              ) : null}
            </div>
          ))}

          <details>
            <summary className="cursor-pointer font-bold">Raw API payload</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-2 text-[10px] text-green-300">
              {JSON.stringify(payload.rawContent ?? {}, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
