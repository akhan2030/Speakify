import { parseBankContent, passagePlainText } from "../bankContent";
import {
  FALLBACK_COMPOSITIONAL_ITEMS,
  FALLBACK_LISTENING_RECORDINGS,
  FALLBACK_READING_PASSAGES,
  FALLBACK_STRUCTURE_ITEMS,
} from "../fallbackQuestions";
import { getStepSupabase } from "../enrollmentService";
import type { StepMcqQuestion } from "../types";
import type { StepSectionId } from "../examModel";
import type { MockExamPayload, MockExamQuestion } from "../mockExam/types";

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
    .limit(20);

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
          all.push({ ...q, recordingNumber: r.recordingNumber });
        }
      }
    } else {
      all.push(...parsed.items);
    }
  }
  return all;
}

function loadFallbackReading() {
  const out: Array<StepMcqQuestion & { passageText: string; passageId: string }> = [];
  for (const p of FALLBACK_READING_PASSAGES) {
    const text = passagePlainText(p);
    for (const q of p.questions ?? []) {
      out.push({ ...q, passageText: text, passageId: p.id });
    }
  }
  return out;
}

function loadFallbackListening() {
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
  const id = `mini-${mockNumber}-${section}-${index}`;
  return {
    id,
    section,
    stem: raw.stem,
    options: raw.options,
    correct: raw.correct,
    explanation: raw.explanation,
    questionType: raw.questionType,
    passage: raw.passageText ?? raw.passageRef,
    passageId: raw.passageId,
    transcript: raw.transcript,
    recordingId: raw.recordingId ?? `rec-${raw.recordingNumber ?? 1}`,
    recordingNumber: raw.recordingNumber ?? 1,
  };
}

function excludeUsed<T extends { id: string }>(pool: T[], usedIds: Set<string>): T[] {
  const fresh = pool.filter((q) => !usedIds.has(q.id));
  return fresh.length > 0 ? fresh : pool;
}

function stripForClient(q: MockExamQuestion) {
  const { correct: _c, explanation: _e, ...rest } = q;
  return rest;
}

export async function buildMiniMockExam(
  mockNumber: number,
  excludeQuestionIds: string[] = []
): Promise<{ questions: MockExamQuestion[]; payload: MockExamPayload }> {
  const used = new Set(excludeQuestionIds);
  const allQuestions: MockExamQuestion[] = [];
  const counts = {
    reading: 5,
    structure: 5,
    listening: 5,
    compositional_analysis: 5,
  };

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
  cyclePool(readingPool, counts.reading).forEach((q, i) => {
    allQuestions.push(toMockQuestion(q, "reading", mockNumber, i));
  });

  const bankStructure = await loadBankPool("structure");
  const structurePool = excludeUsed([...bankStructure, ...FALLBACK_STRUCTURE_ITEMS], used);
  cyclePool(structurePool, counts.structure).forEach((q, i) => {
    allQuestions.push(toMockQuestion(q, "structure", mockNumber, counts.reading + i));
  });

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
  listeningPicked.forEach((q, i) => {
    const mq = toMockQuestion(
      q,
      "listening",
      mockNumber,
      counts.reading + counts.structure + i
    );
    mq.totalRecordings = recordingIds.length;
    mq.recordingNumber = recordingIds.indexOf(mq.recordingId ?? "rec-1") + 1 || 1;
    allQuestions.push(mq);
  });

  const bankComp = await loadBankPool("compositional_analysis");
  const compPool = excludeUsed([...bankComp, ...FALLBACK_COMPOSITIONAL_ITEMS], used);
  cyclePool(compPool, counts.compositional_analysis).forEach((q, i) => {
    allQuestions.push(
      toMockQuestion(
        q,
        "compositional_analysis",
        mockNumber,
        counts.reading + counts.structure + counts.listening + i
      )
    );
  });

  const payload: MockExamPayload = {
    reading: allQuestions.filter((q) => q.section === "reading").map(stripForClient),
    structure: allQuestions.filter((q) => q.section === "structure").map(stripForClient),
    listening: allQuestions.filter((q) => q.section === "listening").map(stripForClient),
    compositional: allQuestions
      .filter((q) => q.section === "compositional_analysis")
      .map(stripForClient),
  };

  return { questions: allQuestions, payload };
}
