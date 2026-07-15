"use client";

import { useState } from "react";
import SectionTypePicker from "./SectionTypePicker";
import type { SectionType } from "@/lib/classroom/types";

export type UnitEditorInitial = {
  title?: string;
  theme?: string;
  grammarPoint1?: string;
  grammarPoint2?: string;
  objectives?: string[];
  status?: "draft" | "published" | "archived" | "placeholder";
  lessonTitles?: string[];
  sectionJson?: string;
};

export default function UnitEditor({
  levelSlug,
  unitSlug,
  initial,
}: {
  levelSlug: string;
  unitSlug: string;
  initial?: UnitEditorInitial;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [g1, setG1] = useState(initial?.grammarPoint1 ?? "");
  const [g2, setG2] = useState(initial?.grammarPoint2 ?? "");
  const [objectives, setObjectives] = useState(
    (initial?.objectives ?? []).join("\n")
  );
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [lessonTitles, setLessonTitles] = useState(
    (initial?.lessonTitles ?? [
      "Lesson 1",
      "Lesson 2",
      "Lesson 3",
      "Lesson 4",
      "Lesson 5",
    ]).join("\n")
  );
  const [sectionType, setSectionType] = useState<SectionType>("warm_up");
  const [sectionJson, setSectionJson] = useState(
    initial?.sectionJson ?? '{\n  "text": ""\n}'
  );
  const [savedNote, setSavedNote] = useState<string | null>(null);

  function save() {
    setSavedNote(
      `Draft saved locally for ${levelSlug}/${unitSlug} (${status}). Persist API coming next.`
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Unit metadata</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Theme</span>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Grammar point 1</span>
            <input
              value={g1}
              onChange={(e) => setG1(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Grammar point 2</span>
            <input
              value={g2}
              onChange={(e) => setG2(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Objectives (one per line)</span>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Status</span>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as typeof status)
              }
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Lesson titles (one per line)</span>
            <textarea
              value={lessonTitles}
              onChange={(e) => setLessonTitles(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Section JSON (light edit)</h2>
        <div className="mt-4 grid gap-3">
          <SectionTypePicker value={sectionType} onChange={setSectionType} />
          <label className="block text-sm">
            <span className="text-slate-600">
              Content for {sectionType.replace(/_/g, " ")}
            </span>
            <textarea
              value={sectionJson}
              onChange={(e) => setSectionJson(e.target.value)}
              rows={8}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Save draft
      </button>
      {savedNote ? (
        <p className="text-sm text-emerald-800">{savedNote}</p>
      ) : null}
    </div>
  );
}
