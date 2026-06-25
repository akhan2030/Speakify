import type { PathwaySkill } from "@/lib/programs/terminology";
import type { SkillProgressMap } from "@/lib/programs/types";

type PathwayProgressInput = {
  grammar?: { categories?: Array<{ percentComplete: number }>; overallPercent?: number };
  vocabulary?: { percentComplete?: number };
  reading?: {
    accuracyPercent?: number | null;
    typesMastered?: number;
    typesTotal?: number;
  };
  listening?: {
    accuracyPercent?: number | null;
    sectionsCompleted?: number;
    sectionsTotal?: number;
  };
  speaking?: { percentComplete?: number | null; attemptCount?: number };
  writing?: { percentComplete?: number | null; attemptCount?: number };
  pronunciation?: { percentComplete?: number | null; attemptCount?: number };
};

function attemptsToPercent(count: number | undefined, cap = 10): number {
  if (!count || count <= 0) return 0;
  return Math.min(100, Math.round((count / cap) * 100));
}

/** Pathway skill progress uses CEFR completion % — never IELTS band scores. */
export function computePathwaySkillPercents(
  input: PathwayProgressInput
): SkillProgressMap {
  let grammar = 0;
  if (typeof input.grammar?.overallPercent === "number") {
    grammar = input.grammar.overallPercent;
  } else if (input.grammar?.categories?.length) {
    grammar = Math.round(
      input.grammar.categories.reduce((a, c) => a + c.percentComplete, 0) /
        input.grammar.categories.length
    );
  }

  const vocabulary = input.vocabulary?.percentComplete ?? 0;

  let reading = input.reading?.accuracyPercent ?? null;
  if (reading == null && input.reading?.typesTotal) {
    reading = Math.round(
      ((input.reading.typesMastered ?? 0) / input.reading.typesTotal) * 100
    );
  }

  let listening = input.listening?.accuracyPercent ?? null;
  if (listening == null && input.listening?.sectionsTotal) {
    listening = Math.round(
      ((input.listening.sectionsCompleted ?? 0) / input.listening.sectionsTotal) *
        100
    );
  }

  const speaking =
    input.speaking?.percentComplete ??
    attemptsToPercent(input.speaking?.attemptCount, 8);

  const writing =
    input.writing?.percentComplete ??
    attemptsToPercent(input.writing?.attemptCount, 6);

  const pronunciation =
    input.pronunciation?.percentComplete ??
    attemptsToPercent(input.pronunciation?.attemptCount, 6);

  return {
    grammar,
    vocabulary,
    reading: reading ?? 0,
    listening: listening ?? 0,
    speaking,
    writing,
    pronunciation,
  };
}

export function averageSkillProgress(map: SkillProgressMap): number {
  const values = Object.values(map);
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
