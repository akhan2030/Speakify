import type { ListeningExamPart } from "./listeningExam";
import { getTypeForQuestionNumber } from "../listeningSectionTypes";
import {
  defaultFormTitle,
  enrichBreakMessage,
} from "./mockListeningDisplay";
import { alignQuestionsToSectionPlan } from "./listeningQuestionAlign";
import {
  getSkillVariantsForMock,
  getListeningPartsForMock,
} from "./academicMockSkillVariants";
import {
  readingFromGeneratedPayload,
  mapAgentReadingKind,
} from "./resolveGeneratedContent";
import type {
  AcademicMockBundle,
  MockExamContent,
  ReadingPassage,
  ReadingQuestion,
  SpeakingPart,
  WritingTaskDef,
} from "./types";

function splitPassageContent(content: string): { label: string; text: string }[] {
  const chunks = String(content ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return chunks.map((chunk, i) => {
    const match = chunk.match(/^([A-Z])\.\s*([\s\S]*)$/);
    if (match) {
      return { label: match[1], text: match[2].trim() };
    }
    return { label: String.fromCharCode(65 + i), text: chunk };
  });
}

function resolveMcqCorrect(
  answer: string,
  options: { key: string; label: string }[]
): string {
  const trimmed = answer.trim();
  if (/^[A-D]$/i.test(trimmed)) {
    const letter = trimmed.toUpperCase();
    const match = options.find((o) => o.key.toUpperCase() === letter);
    if (match) return match.label;
  }
  return trimmed;
}

function mapPassageColumnQuestion(
  q: Record<string, unknown>,
  globalNumber: number
): ReadingQuestion {
  const kind = mapAgentReadingKind(String(q.type ?? q.kind ?? ""));
  const optionsRaw = Array.isArray(q.options) ? q.options : [];

  const base: ReadingQuestion = {
    id: String(q.id ?? `r-q${globalNumber}`),
    globalNumber,
    kind,
    typeLabel: String(q.typeLabel ?? q.type ?? kind).replace(/-/g, " "),
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
      const key = String(row.label ?? row.key ?? ["A", "B", "C", "D"][i] ?? "A")
        .trim()
        .charAt(0)
        .toUpperCase();
      const label = String(row.text ?? row.option ?? row.label ?? key);
      return { key, label };
    });
    base.correct = resolveMcqCorrect(base.correct ?? "", base.options);
  }

  return base;
}

function passageColumnToReadingPassage(
  raw: Record<string, unknown>,
  index: number,
  startNumber: number
): { passage: ReadingPassage; next: number } {
  const content = String(raw.content ?? raw.text ?? "");
  const paragraphs = splitPassageContent(content).map((p, pi) => ({
    id: `mock-p${index + 1}-${p.label}`,
    label: p.label,
    text: p.text,
  }));

  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  let n = startNumber;
  const questions = questionsRaw.map((q) => {
    const mapped = mapPassageColumnQuestion(q as Record<string, unknown>, n);
    n += 1;
    return mapped;
  });

  const difficulties = ["Band 5–6", "Band 6–7", "Band 7–9"];

  return {
    passage: {
      id: `reading-p${index + 1}`,
      index: index + 1,
      title: String(raw.title ?? `Passage ${index + 1}`),
      difficulty: String(raw.difficulty ?? difficulties[index] ?? `Passage ${index + 1}`),
      paragraphs,
      questions,
      startNumber: questions[0]?.globalNumber ?? startNumber,
      endNumber: questions[questions.length - 1]?.globalNumber ?? startNumber,
    },
    next: n,
  };
}

/** Build reading from legacy passage_1/2/3 columns. */
export function readingFromPassageColumns(row: Record<string, unknown>): MockExamContent["reading"] | null {
  const cols = [row.passage_1, row.passage_2, row.passage_3].filter(
    (p) => p && typeof p === "object"
  ) as Record<string, unknown>[];

  if (!cols.length) return null;

  const passages: ReadingPassage[] = [];
  let cursor = 1;
  cols.forEach((col, i) => {
    const built = passageColumnToReadingPassage(col, i, cursor);
    passages.push(built.passage);
    cursor = built.next;
  });

  const totalQuestions = passages.reduce((sum, p) => sum + p.questions.length, 0);
  if (!totalQuestions) return null;
  return { passages, totalQuestions };
}

function mapListeningType(type: string): import("./types").ListeningQuestion["type"] {
  const t = type.toLowerCase().replace(/-/g, "_");
  if (t.includes("form")) return "form";
  if (t.includes("note") || t.includes("sentence") || t.includes("summary")) return "note";
  if (t.includes("mcq") || t.includes("multiple")) return "mcq";
  if (t.includes("matching_features")) return "matching-features";
  if (t.includes("matching")) return "matching";
  return "form";
}

function resolveListeningVoice(part: Record<string, unknown>): string {
  const sp1 = part.speaker1 as Record<string, unknown> | undefined;
  const sp2 = part.speaker2 as Record<string, unknown> | undefined;
  const speaker = part.speaker as Record<string, unknown> | undefined;
  return String(
    sp1?.voice ?? sp2?.voice ?? speaker?.voice ?? part.voice ?? "onyx"
  );
}

function isEngineListeningParts(value: unknown): value is ListeningExamPart[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof (value[0] as ListeningExamPart).partNumber === "number"
  );
}

function enrichStoredListeningParts(parts: ListeningExamPart[]): ListeningExamPart[] {
  return parts.map((part) => ({
    ...part,
    questions: alignQuestionsToSectionPlan(part.questions, part.partNumber),
    blocks: part.blocks.map((block, blockIndex) => {
      const questionType =
        block.questionType ??
        getTypeForQuestionNumber(part.partNumber, block.questionStart);
      const formTitle =
        block.formTitle ??
        (questionType === "form-completion"
          ? defaultFormTitle(part.partNumber)
          : undefined);
      const tableHeaders =
        block.tableHeaders ??
        (questionType === "table-completion" ? ["Item", "Detail"] : undefined);
      let breakMessage = block.breakMessage;
      if (blockIndex > 0 && breakMessage) {
        breakMessage = enrichBreakMessage(
          { ...block, questionType },
          part.partNumber,
          breakMessage
        );
      }
      return {
        ...block,
        questionType,
        formTitle,
        tableHeaders,
        breakMessage,
      };
    }),
  }));
}

function listeningFromStoredRow(listening: unknown): ListeningExamPart[] | null {
  if (!listening || typeof listening !== "object") return null;
  const root = listening as Record<string, unknown>;
  if (isEngineListeningParts(root.parts)) {
    return enrichStoredListeningParts(root.parts);
  }
  return listeningFromGeneratedPayload(listening);
}

/** Convert agent listening JSON into engine-ready parts. */
export function listeningFromGeneratedPayload(listening: unknown): ListeningExamPart[] | null {
  if (!listening || typeof listening !== "object") return null;
  const root = listening as Record<string, unknown>;
  const partsRaw = root.parts;
  if (!Array.isArray(partsRaw) || partsRaw.length === 0) return null;

  const partNums = [1, 2, 3, 4] as const;

  return partNums.map((partNumber) => {
    const partRaw = partsRaw.find(
      (p) => Number((p as Record<string, unknown>).part) === partNumber
    ) as Record<string, unknown> | undefined;

    if (!partRaw) {
      return {
        partNumber,
        introText: `Section ${partNumber} of 4 — Listening.`,
        blocks: [],
        questions: [],
      };
    }

    const transcript = String(
      partRaw.transcript ?? partRaw.audio_script ?? partRaw.script ?? ""
    );
    const voice = resolveListeningVoice(partRaw);
    const questionsRaw = Array.isArray(partRaw.questions) ? partRaw.questions : [];

    const questions = questionsRaw.map((q) => {
      const row = q as Record<string, unknown>;
      const num = Number(row.number ?? row.questionNumber ?? 0);
      const type = mapListeningType(String(row.type ?? "form"));
      const options = Array.isArray(row.options)
        ? row.options.map((o) => String(o))
        : undefined;
      let correct = String(row.answer ?? row.correct ?? "");
      if (type === "mcq" && options && /^[A-D]$/i.test(correct)) {
        const idx = correct.toUpperCase().charCodeAt(0) - 65;
        correct = options[idx] ?? correct;
      }
      return {
        id: `mock-l${partNumber}-q${num}`,
        number: num,
        section: partNumber,
        type,
        prompt: String(row.question ?? row.prompt ?? row.text ?? ""),
        correct,
        options,
      };
    });

    const nums = questions.map((q) => q.number).filter(Boolean);
    const minQ = Math.min(...nums);
    const maxQ = Math.max(...nums);

    const blocks: ListeningExamPart["blocks"] = [];
    if (transcript && nums.length) {
      const mid = nums.length > 5 ? nums[Math.floor(nums.length / 2)] : maxQ;
      const firstEnd = nums.length > 5 ? mid : maxQ;
      blocks.push({
        questionStart: minQ,
        questionEnd: firstEnd,
        prepMessage:
          partNumber === 1
            ? `You have 30 seconds to look at Questions ${minQ} to ${Math.min(minQ + 4, firstEnd)}.`
            : `You have 30 seconds to look at Questions ${minQ} to ${firstEnd}.`,
        transcript,
        sectionNumber: partNumber,
        voice,
      });
      if (firstEnd < maxQ) {
        blocks.push({
          questionStart: firstEnd + 1,
          questionEnd: maxQ,
          breakMessage: `You now have 30 seconds to look at Questions ${firstEnd + 1} to ${maxQ}.`,
          transcript,
          sectionNumber: partNumber,
          voice,
        });
      }
    }

    const introTexts: Record<number, string> = {
      1: "Section 1 of 4 — Listening. You will hear a conversation between two people.",
      2: "Section 2 of 4 — Listening. You will hear one speaker giving information.",
      3: "Section 3 of 4 — Listening. You will hear a discussion between several people.",
      4: "Section 4 of 4 — Listening. You will hear an academic lecture.",
    };

    return {
      partNumber,
      introText: introTexts[partNumber],
      blocks,
      questions,
    };
  });
}

export function writingFromGeneratedPayload(writing: unknown): {
  task1: WritingTaskDef;
  task2: WritingTaskDef;
} | null {
  if (!writing || typeof writing !== "object") return null;
  const w = writing as Record<string, unknown>;
  const t1 = w.task1 as Record<string, unknown> | undefined;
  const t2 = w.task2 as Record<string, unknown> | undefined;
  if (!t1?.prompt || !t2?.prompt) return null;

  const task1: WritingTaskDef = {
    id: "mock-gen-t1",
    title: "Task 1",
    prompt: String(t1.prompt),
    minWords: Number(t1.word_limit ?? t1.minWords ?? 150),
  };

  const data = t1.data as Record<string, unknown> | undefined;
  if (data && Array.isArray(data.values)) {
    task1.chartData = {
      title: String(data.title ?? "Chart"),
      countries: (data.labels as string[]) ?? (data.countries as string[]) ?? [],
      years: (data.years as number[]) ?? [2020, 2024],
      values: data.values as number[][],
    };
  }

  return {
    task1,
    task2: {
      id: "mock-gen-t2",
      title: "Task 2",
      prompt: String(t2.prompt),
      minWords: Number(t2.word_limit ?? t2.minWords ?? 250),
    },
  };
}

export function speakingFromGeneratedPayload(speaking: unknown): SpeakingPart[] | null {
  if (!speaking || typeof speaking !== "object") return null;
  const s = speaking as Record<string, unknown>;
  const p1 = s.part1 as Record<string, unknown> | undefined;
  const p2 = s.part2 as Record<string, unknown> | undefined;
  const p3 = s.part3 as Record<string, unknown> | undefined;
  if (!p1?.questions || !p2 || !p3?.questions) return null;

  const bullets = Array.isArray(p2.bullet_points)
    ? p2.bullet_points.map((b) => String(b))
    : [];

  return [
    {
      part: 1,
      answerSeconds: 60,
      questions: (p1.questions as string[]).map(String),
    },
    {
      part: 2,
      prepSeconds: Number(p2.prep_seconds ?? 60),
      answerSeconds: Number(p2.talk_seconds ?? 120),
      questions: [],
      cueCard: {
        topic: String(p2.cue_card ?? p2.topic ?? "Describe a topic"),
        bullets: bullets.length
          ? bullets
          : ["what it was", "when it happened", "why it matters", "and explain your feelings"],
      },
    },
    {
      part: 3,
      answerSeconds: 90,
      questions: (p3.questions as string[]).map(String),
    },
  ];
}

export function resolveMockNumber(
  row?: Record<string, unknown> | null,
  fallback = 1
): number {
  const n = Number(row?.mock_number ?? row?.test_number ?? fallback);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Resolve a complete academic mock bundle from a generated_mock_tests row
 * or exam_content stored on an attempt.
 */
export function resolveAcademicMockBundle(
  source?: Record<string, unknown> | null
): AcademicMockBundle {
  const mockNumber = resolveMockNumber(source);
  const generatedMockTestId =
    source?.generatedMockTestId != null
      ? Number(source.generatedMockTestId)
      : source?.id != null
        ? Number(source.id)
        : null;

  const topic =
    (typeof source?.topic === "string" && source.topic) ||
    (Array.isArray(source?.topics) && source.topics[0]) ||
    null;

  const readingPayload =
    readingFromPassageColumns(source ?? {}) ??
    readingFromGeneratedPayload(source?.reading) ??
    readingFromGeneratedPayload({
      passages: [source?.passage_1, source?.passage_2, source?.passage_3].filter(Boolean),
    });

  const reading: MockExamContent = readingPayload
    ? {
        version: 1,
        reading: readingPayload,
        generatedAt: String(topic ?? `mock-${mockNumber}`),
      }
    : {
        version: 1,
        reading: { passages: [], totalQuestions: 0 },
        generatedAt: "missing",
      };

  const skillFallback = getSkillVariantsForMock(mockNumber);

  const listening =
    skillFallback.listening.length > 0
      ? skillFallback.listening
      : (Array.isArray(source?.listeningParts)
          ? enrichStoredListeningParts(source.listeningParts as ListeningExamPart[])
          : null) ??
        listeningFromStoredRow(source?.listening) ??
        skillFallback.listening;

  const writing =
    (source?.writingTasks as { task1: WritingTaskDef; task2: WritingTaskDef } | undefined) ??
    writingFromGeneratedPayload(source?.writing) ??
    skillFallback.writing;

  const speaking =
    (Array.isArray(source?.speakingParts)
      ? (source.speakingParts as SpeakingPart[])
      : null) ??
    speakingFromGeneratedPayload(source?.speaking) ??
    skillFallback.speaking;

  return {
    mockNumber,
    generatedMockTestId,
    topic,
    reading,
    listening,
    writing,
    speaking,
  };
}

export function getAllListeningQuestionsFromParts(
  parts: ListeningExamPart[]
): import("./types").ListeningQuestion[] {
  return parts.flatMap((p) => p.questions);
}

export { getListeningPartsForMock };
