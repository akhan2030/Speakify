import { FULL_MOCK_TEST } from "@/lib/readingMockTestContent";
import type { MockExamContent, ReadingPassage } from "./types";

/** Section readiness flags — no network required. */
export const EXAM_CONTENT = {
  listening: { ready: true },
  reading: { ready: true },
  writing: { ready: true },
  speaking: { ready: true },
} as const;

/** Full hardcoded reading passages for the mock exam (no OpenAI). */
export function getStaticExamContent(): MockExamContent {
  const passages: ReadingPassage[] = FULL_MOCK_TEST.passages.map((p, i) => ({
    id: p.id,
    index: p.index,
    title: p.title,
    difficulty: i === 0 ? "Band 5–6" : i === 1 ? "Band 6–7" : "Band 7–9",
    paragraphs: p.paragraphs.map((para) => ({
      id: para.id,
      label: para.label,
      text: para.text,
    })),
    questions: p.questions.map((q) => ({
      id: q.id,
      globalNumber: q.globalNumber,
      kind: q.kind,
      typeLabel: q.typeLabel ?? q.kind,
      text: q.text ?? "",
      correct: q.correct,
      options: q.options,
      headings: q.headings,
    })),
    startNumber: p.startNumber,
    endNumber: p.endNumber,
  }));

  return {
    version: 1,
    generatedAt: "static",
    reading: { passages, totalQuestions: 40 },
  };
}
