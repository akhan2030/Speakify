import { parseBankContent, passagePlainText } from "../bankContent";
import {
  FALLBACK_COMPOSITIONAL_ITEMS,
  FALLBACK_LISTENING_RECORDINGS,
  FALLBACK_READING_PASSAGES,
  FALLBACK_STRUCTURE_ITEMS,
} from "../fallbackQuestions";
import { getStepSupabase } from "../enrollmentService";
import type { StepMcqQuestion, StepMcqOption } from "../types";
import type { StepSectionId } from "../examModel";
import {
  MOCK_SECTION_COUNTS,
  MOCK_SECTION_ORDER,
} from "./constants";
import type { MockExamPayload, MockExamQuestion } from "./types";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cyclePool<T>(pool: T[], count: number): T[] {
  if (pool.length === 0) return [];
  const out: T[] = [];
  const shuffled = shuffle(pool);
  let i = 0;
  while (out.length < count) {
    out.push(shuffled[i % shuffled.length]);
    i++;
  }
  return out;
}

async function loadBankPool(section: StepSectionId): Promise<StepMcqQuestion[]> {
  const supabase = getStepSupabase();
  const { data } = await supabase
    .from("step_practice_bank")
    .select("content")
    .eq("section", section)
    .order("created_at", { ascending: false })
    .limit(15);

  const all: StepMcqQuestion[] = [];
  for (const row of data ?? []) {
    const parsed = parseBankContent(section, row.content);
    if (!parsed) continue;
    if (parsed.kind === "reading") {
      for (const p of parsed.passages) {
        for (const q of p.questions ?? []) {
          all.push({ ...q, passageRef: passagePlainText(p) });
        }
      }
    } else if (parsed.kind === "listening") {
      for (const r of parsed.recordings) {
        for (const q of r.questions ?? []) {
          all.push({
            ...q,
            recordingNumber: r.recordingNumber,
          });
        }
      }
    } else {
      all.push(...parsed.items);
    }
  }
  return all;
}

function loadFallbackReading(): Array<StepMcqQuestion & { passageText: string; passageId: string }> {
  const out: Array<StepMcqQuestion & { passageText: string; passageId: string }> = [];
  for (const p of FALLBACK_READING_PASSAGES) {
    const text = passagePlainText(p);
    for (const q of p.questions ?? []) {
      out.push({ ...q, passageText: text, passageId: p.id });
    }
  }
  return out;
}

function loadFallbackListening(): Array<
  StepMcqQuestion & { transcript: string; recordingId: string; recordingNumber: number }
> {
  const out: Array<
    StepMcqQuestion & { transcript: string; recordingId: string; recordingNumber: number }
  > = [];
  for (const r of FALLBACK_LISTENING_RECORDINGS) {
    for (const q of r.questions ?? []) {
      out.push({
        ...q,
        transcript: r.transcript,
        recordingId: r.id,
        recordingNumber: r.recordingNumber,
      });
    }
  }
  return out;
}

function toMockQuestion(
  raw: StepMcqQuestion & {
    passageText?: string;
    passageId?: string;
    transcript?: string;
    recordingId?: string;
    recordingNumber?: number;
    passageRef?: string;
  },
  section: StepSectionId,
  mockNumber: number,
  index: number
): MockExamQuestion {
  const id = `mock-${mockNumber}-${section}-${index}`;
  const passage = raw.passageText ?? raw.passageRef;
  const recordingId = raw.recordingId ?? `rec-${raw.recordingNumber ?? 1}`;

  return {
    id,
    section,
    stem: raw.stem,
    options: raw.options,
    correct: raw.correct,
    explanation: raw.explanation,
    questionType: raw.questionType,
    grammarPoint: "grammarPoint" in raw ? (raw as { grammarPoint?: string }).grammarPoint : undefined,
    passage,
    passageId: raw.passageId,
    sentence: section === "structure" ? raw.stem : undefined,
    transcript: raw.transcript,
    recordingId,
    recordingNumber: raw.recordingNumber ?? 1,
  };
}

function excludeUsed<T extends { id: string }>(pool: T[], usedIds: Set<string>): T[] {
  const fresh = pool.filter((q) => !usedIds.has(q.id));
  return fresh.length > 0 ? fresh : pool;
}

export async function buildFullMockExam(
  mockNumber: number,
  excludeQuestionIds: string[] = []
): Promise<{ questions: MockExamQuestion[]; payload: MockExamPayload }> {
  const used = new Set(excludeQuestionIds);
  const allQuestions: MockExamQuestion[] = [];

  const counts = {
    reading: MOCK_SECTION_COUNTS[0],
    structure: MOCK_SECTION_COUNTS[1],
    listening: MOCK_SECTION_COUNTS[2],
    compositional_analysis: MOCK_SECTION_COUNTS[3],
  };

  // Reading
  const bankReading = await loadBankPool("reading");
  const fbReading = loadFallbackReading();
  const readingPool = excludeUsed(
    [
      ...bankReading.map((q) => ({
        ...q,
        passageText: q.passageRef,
        passageId: q.id.split("-")[0],
      })),
      ...fbReading,
    ],
    used
  );
  const readingPicked = cyclePool(readingPool, counts.reading);
  readingPicked.forEach((q, i) => {
    allQuestions.push(toMockQuestion(q, "reading", mockNumber, i));
  });

  // Structure
  const bankStructure = await loadBankPool("structure");
  const structurePool = excludeUsed([...bankStructure, ...FALLBACK_STRUCTURE_ITEMS], used);
  const structurePicked = cyclePool(structurePool, counts.structure);
  structurePicked.forEach((q, i) => {
    allQuestions.push(toMockQuestion(q, "structure", mockNumber, 40 + i));
  });

  // Listening
  const bankListening = await loadBankPool("listening");
  const fbListening = loadFallbackListening();
  const listeningPool = excludeUsed(
    [
      ...bankListening.map((q) => {
        const rec = FALLBACK_LISTENING_RECORDINGS.find((r) =>
          r.questions?.some((x) => x.id === q.id)
        );
        return {
          ...q,
          transcript: rec?.transcript ?? FALLBACK_LISTENING_RECORDINGS[0].transcript,
          recordingId: rec?.id ?? `rec-${q.recordingNumber ?? 1}`,
        };
      }),
      ...fbListening,
    ],
    used
  );
  const listeningPicked = cyclePool(listeningPool, counts.listening);
  const recordingIds = [...new Set(listeningPicked.map((q) => q.recordingId ?? "rec-1"))];
  const totalRecordings = recordingIds.length;
  listeningPicked.forEach((q, i) => {
    const mq = toMockQuestion(q, "listening", mockNumber, 70 + i);
    mq.totalRecordings = totalRecordings;
    mq.recordingNumber =
      recordingIds.indexOf(mq.recordingId ?? "rec-1") + 1 || 1;
    allQuestions.push(mq);
  });

  // Compositional
  const bankComp = await loadBankPool("compositional_analysis");
  const compPool = excludeUsed([...bankComp, ...FALLBACK_COMPOSITIONAL_ITEMS], used);
  const compPicked = cyclePool(compPool, counts.compositional_analysis);
  compPicked.forEach((q, i) => {
    allQuestions.push(toMockQuestion(q, "compositional_analysis", mockNumber, 90 + i));
  });

  const payload: MockExamPayload = {
    reading: allQuestions
      .filter((q) => q.section === "reading")
      .map(stripForClient),
    structure: allQuestions
      .filter((q) => q.section === "structure")
      .map(stripForClient),
    listening: allQuestions
      .filter((q) => q.section === "listening")
      .map(stripForClient),
    compositional: allQuestions
      .filter((q) => q.section === "compositional_analysis")
      .map(stripForClient),
  };

  return { questions: allQuestions, payload };
}

function stripForClient(q: MockExamQuestion) {
  const { correct: _c, explanation: _e, ...rest } = q;
  return rest;
}

export function gradeMockExam(
  questions: MockExamQuestion[],
  answers: Record<string, string>
): {
  readingScore: number;
  structureScore: number;
  listeningScore: number;
  compositionalScore: number;
  totalScore: number;
  results: Array<{
    id: string;
    section: StepSectionId;
    stem: string;
    options: Record<StepMcqOption, string>;
    chosen: string | null;
    correct: StepMcqOption;
    isCorrect: boolean;
    explanation: string;
    questionType?: string;
    grammarPoint?: string;
  }>;
} {
  let readingScore = 0;
  let structureScore = 0;
  let listeningScore = 0;
  let compositionalScore = 0;

  const results = questions.map((q) => {
    const chosen = answers[q.id] ?? null;
    const isCorrect = chosen === q.correct;
    if (isCorrect) {
      if (q.section === "reading") readingScore++;
      else if (q.section === "structure") structureScore++;
      else if (q.section === "listening") listeningScore++;
      else compositionalScore++;
    }
    return {
      id: q.id,
      section: q.section,
      stem: q.stem,
      options: q.options,
      chosen,
      correct: q.correct,
      isCorrect,
      explanation: q.explanation,
      questionType: q.questionType,
      grammarPoint: q.grammarPoint,
    };
  });

  return {
    readingScore,
    structureScore,
    listeningScore,
    compositionalScore,
    totalScore: readingScore + structureScore + listeningScore + compositionalScore,
    results,
  };
}

export function weakestSectionFromScores(scores: {
  reading: number;
  structure: number;
  listening: number;
  compositional: number;
}): StepSectionId {
  const entries: [StepSectionId, number, number][] = [
    ["reading", scores.reading, 40],
    ["structure", scores.structure, 30],
    ["listening", scores.listening, 20],
    ["compositional_analysis", scores.compositional, 10],
  ];
  let worst: StepSectionId = "structure";
  let worstPct = 1;
  for (const [id, score, max] of entries) {
    const pct = score / max;
    if (pct < worstPct) {
      worstPct = pct;
      worst = id;
    }
  }
  return worst;
}

export function practicePathForSection(section: StepSectionId): string {
  const map: Record<StepSectionId, string> = {
    reading: "/dashboard/step/student/reading",
    structure: "/dashboard/step/student/structure",
    listening: "/dashboard/step/student/listening",
    compositional_analysis: "/dashboard/step/student/compositional",
  };
  return map[section];
}

export function sectionDisplayName(section: StepSectionId): string {
  const map: Record<StepSectionId, string> = {
    reading: "Reading",
    structure: "Structure",
    listening: "Listening",
    compositional_analysis: "Compositional",
  };
  return map[section];
}
