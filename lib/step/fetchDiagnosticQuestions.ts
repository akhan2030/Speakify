import type { SupabaseClient } from "@supabase/supabase-js";
import { parseBankContent } from "./bankContent";
import type { StepSectionId } from "./examModel";
import {
  FALLBACK_COMPOSITIONAL_ITEMS,
  FALLBACK_LISTENING_RECORDINGS,
  FALLBACK_READING_PASSAGES,
  FALLBACK_STRUCTURE_ITEMS,
} from "./fallbackQuestions";
import type { StepMcqQuestion, StepReadingPassage } from "./types";

function passageForDisplay(passage: StepReadingPassage): string {
  return passage.paragraphs.map((p) => `${p.number}. ${p.text}`).join("\n\n");
}

function passageTextFromBank(passage: StepReadingPassage): string {
  return passageForDisplay(passage);
}

const DIAGNOSTIC_SECTIONS: StepSectionId[] = [
  "reading",
  "structure",
  "listening",
  "compositional_analysis",
];

const PER_SECTION = 10;

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
  const shuffled = shuffle(pool);
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(shuffled[i % shuffled.length]);
  return out;
}

type EnrichedQuestion = StepMcqQuestion & {
  passageRef?: string;
  passageTitle?: string;
  transcript?: string;
  recordingId?: string;
};

async function pullReadingWithPassages(
  supabase: SupabaseClient,
  count: number
): Promise<EnrichedQuestion[]> {
  const pairs: EnrichedQuestion[] = [];
  const seen = new Set<string>();

  const { data: rows } = await supabase
    .from("step_practice_bank")
    .select("content")
    .eq("section", "reading")
    .order("created_at", { ascending: false })
    .limit(8);

  for (const row of rows ?? []) {
    const parsed = parseBankContent("reading", row.content);
    if (!parsed || parsed.kind !== "reading") continue;
    for (const passage of parsed.passages) {
      const text = passageTextFromBank(passage);
      for (const q of passage.questions ?? []) {
        const key = q.stem.trim();
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({
          ...q,
          section: "reading",
          passageRef: text,
          passageTitle: passage.id ? `Passage` : undefined,
        });
      }
    }
  }

  for (const passage of FALLBACK_READING_PASSAGES) {
      const text = passageTextFromBank(passage);
    for (const q of passage.questions ?? []) {
      const key = q.stem.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({
        ...q,
        section: "reading",
        passageRef: text,
        passageTitle: "Reading Passage",
      });
    }
  }

  return cyclePool(pairs, count).map((q, i) => ({
    ...q,
    id: q.id || `diag-reading-${i + 1}`,
  }));
}

async function pullListeningWithTranscripts(
  supabase: SupabaseClient,
  count: number
): Promise<EnrichedQuestion[]> {
  const pairs: EnrichedQuestion[] = [];
  const seen = new Set<string>();

  const { data: rows } = await supabase
    .from("step_practice_bank")
    .select("content")
    .eq("section", "listening")
    .order("created_at", { ascending: false })
    .limit(8);

  for (const row of rows ?? []) {
    const parsed = parseBankContent("listening", row.content);
    if (!parsed || parsed.kind !== "listening") continue;
    for (const rec of parsed.recordings) {
      for (const q of rec.questions ?? []) {
        const key = q.stem.trim();
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({
          ...q,
          section: "listening",
          transcript: rec.transcript,
          recordingId: rec.id,
          recordingNumber: rec.recordingNumber,
        });
      }
    }
  }

  for (const rec of FALLBACK_LISTENING_RECORDINGS) {
    for (const q of rec.questions ?? []) {
      const key = q.stem.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({
        ...q,
        section: "listening",
        transcript: rec.transcript,
        recordingId: rec.id,
        recordingNumber: rec.recordingNumber,
      });
    }
  }

  return cyclePool(pairs, count).map((q, i) => ({
    ...q,
    id: q.id || `diag-listening-${i + 1}`,
  }));
}

function pullStructure(count: number): EnrichedQuestion[] {
  return cyclePool(FALLBACK_STRUCTURE_ITEMS, count).map((q, i) => ({
    ...q,
    section: "structure" as const,
    id: q.id || `diag-structure-${i + 1}`,
  }));
}

function pullCompositional(count: number): EnrichedQuestion[] {
  return cyclePool(FALLBACK_COMPOSITIONAL_ITEMS, count).map((q, i) => ({
    ...q,
    section: "compositional_analysis" as const,
    id: q.id || `diag-comp-${i + 1}`,
  }));
}

/** 40 diagnostic MCQs — 10 per section with passages/transcripts where required */
export async function fetchDiagnosticQuestions(
  supabase: SupabaseClient
): Promise<EnrichedQuestion[]> {
  const [reading, structure, listening, compositional] = await Promise.all([
    pullReadingWithPassages(supabase, PER_SECTION),
    Promise.resolve(pullStructure(PER_SECTION)),
    pullListeningWithTranscripts(supabase, PER_SECTION),
    Promise.resolve(pullCompositional(PER_SECTION)),
  ]);

  const ordered = [reading, structure, listening, compositional].flat();
  return ordered.map((q, i) => ({
    ...q,
    number: i + 1,
  }));
}

export async function loadOrCreateDiagnosticSnapshot(
  supabase: SupabaseClient,
  studentId: string
): Promise<EnrichedQuestion[]> {
  const { data: enrollment } = await supabase
    .from("step_enrollments")
    .select("diagnostic_snapshot, diagnostic_score")
    .eq("student_id", studentId)
    .maybeSingle();

  const snapshot = enrollment?.diagnostic_snapshot;
  if (enrollment?.diagnostic_score == null && Array.isArray(snapshot) && snapshot.length > 0) {
    const readingItems = snapshot.filter((q) => q.section === "reading");
    const readingHasPassages =
      readingItems.length === 0 ||
      readingItems.every(
        (q) => typeof q.passageRef === "string" && q.passageRef.length > 50
      );
    if (readingHasPassages) {
      return snapshot as EnrichedQuestion[];
    }
  }

  const questions = await fetchDiagnosticQuestions(supabase);

  const { error } = await supabase
    .from("step_enrollments")
    .update({ diagnostic_snapshot: questions })
    .eq("student_id", studentId);

  if (error?.message?.includes("diagnostic_snapshot")) {
    return questions;
  }

  return questions;
}

export const DIAGNOSTIC_TIME_MINUTES = 45;
export const DIAGNOSTIC_QUESTION_COUNT = DIAGNOSTIC_SECTIONS.length * PER_SECTION;
