import type { MockExamContent, ReadingPassage, ReadingQuestion } from "./types";
import { getStaticExamContent } from "./staticExamContent";
import { readingFromPassageColumns } from "./resolveFullMockContent";

export function mapAgentReadingKind(type: string): string {
  const t = String(type ?? "").toLowerCase().replace(/-/g, "_");
  if (t.includes("true") && t.includes("false")) return "true-false-not-given";
  if (t.includes("yes") && t.includes("no")) return "yes-no-not-given";
  if (t === "multiple_choice" || t === "mcq") return "multiple-choice";
  if (t.includes("matching") && t.includes("heading")) return "matching-headings";
  if (t.includes("summary")) return "summary-completion";
  return "short-answer";
}

function mapAgentQuestion(q: Record<string, unknown>, index: number): ReadingQuestion {
  const globalNumber = Number(q.number ?? q.globalNumber ?? index + 1);
  const kind = mapAgentReadingKind(String(q.type ?? q.kind ?? ""));
  const optionsRaw = Array.isArray(q.options) ? q.options : [];

  const base: ReadingQuestion = {
    id: String(q.id ?? `r-q${globalNumber}`),
    globalNumber,
    kind,
    typeLabel: String(q.typeLabel ?? q.type ?? kind).replace(/_/g, " "),
    text: String(q.question ?? q.text ?? q.prompt ?? ""),
    correct: String(q.answer ?? q.correct ?? ""),
  };

  if (kind === "multiple-choice" && optionsRaw.length) {
    base.options = optionsRaw.map((opt, i) => {
      if (typeof opt === "string") {
        const key = opt.trim().charAt(0).toUpperCase();
        return { key, label: opt };
      }
      const row = opt as Record<string, unknown>;
      const key = String(row.key ?? ["A", "B", "C", "D"][i] ?? "A");
      const label = String(row.label ?? row.text ?? row.option ?? key);
      return { key, label };
    });
  }

  if (kind === "matching-headings" && optionsRaw.length) {
    base.headings = optionsRaw.map((opt, i) => {
      if (typeof opt === "string") {
        return { key: String(i + 1), label: opt };
      }
      const row = opt as Record<string, unknown>;
      return {
        key: String(row.key ?? i + 1),
        label: String(row.label ?? row.heading ?? row.text ?? ""),
      };
    });
  }

  if (Array.isArray(q.wordBank)) {
    base.wordBank = q.wordBank.map((w) => String(w));
  }

  return base;
}

/** Convert agent-generated reading JSON into engine-ready passages. */
export function readingFromGeneratedPayload(
  reading: unknown
): MockExamContent["reading"] | null {
  if (!reading || typeof reading !== "object") return null;
  const root = reading as Record<string, unknown>;
  const passagesRaw = root.passages;
  if (!Array.isArray(passagesRaw) || passagesRaw.length === 0) return null;

  const passages: ReadingPassage[] = passagesRaw.map((raw, i) => {
    const p = raw as Record<string, unknown>;
    const questionsRaw = Array.isArray(p.questions) ? p.questions : [];
    const questions = questionsRaw.map((q, qi) =>
      mapAgentQuestion(q as Record<string, unknown>, qi)
    );
    const body = String(p.text ?? "");
    const paragraphs = Array.isArray(p.paragraphs)
      ? (p.paragraphs as Array<Record<string, unknown>>).map((para, pi) => ({
          id: String(para.id ?? `p${i + 1}-${pi}`),
          label: String(para.label ?? ""),
          text: String(para.text ?? ""),
        }))
      : [{ id: `p${i + 1}-0`, label: "A", text: body }];

    const startNumber = questions[0]?.globalNumber ?? 1;
    const endNumber = questions[questions.length - 1]?.globalNumber ?? startNumber;

    return {
      id: String(p.id ?? `reading-p${i + 1}`),
      index: Number(p.number ?? p.index ?? i + 1),
      title: String(p.title ?? `Passage ${i + 1}`),
      difficulty: String(p.difficulty ?? `Passage ${i + 1}`),
      paragraphs,
      questions,
      startNumber,
      endNumber,
    };
  });

  const totalQuestions = passages.reduce((sum, p) => sum + p.questions.length, 0);
  if (!totalQuestions) return null;

  return { passages, totalQuestions };
}

/** Prefer generated reading from stored mock row; fall back to static academic content. */
export function resolveAcademicExamContent(
  stored?: Record<string, unknown> | null
): MockExamContent {
  const base = getStaticExamContent();
  if (!stored) return base;

  const reading =
    readingFromPassageColumns(stored) ??
    readingFromGeneratedPayload(stored.reading);

  if (!reading) return base;

  return {
    ...base,
    reading,
    generatedAt: String(stored.topic ?? stored.generatedAt ?? "generated"),
  };
}
