import {
  CEFR_SUB_LEVELS,
  defaultSubLevelForBand,
  getCefrLevel,
  normalizeCefrSlug,
} from "@/lib/course/cefrLevels";

export type PathwayLevelDisplay = {
  displayName: string;
  focusAreas: string;
  weekCount: number;
};

const DISPLAY: Record<string, PathwayLevelDisplay> = {
  "A1.1": {
    displayName: "Foundation I",
    focusAreas: "Greetings, numbers, present simple, everyday vocabulary",
    weekCount: 3,
  },
  "A1.2": {
    displayName: "Foundation II",
    focusAreas: "Daily routines, questions, short conversations, basic writing",
    weekCount: 3,
  },
  "A2.1": {
    displayName: "Elementary I",
    focusAreas: "Past tenses, shopping, travel, listening for gist",
    weekCount: 3,
  },
  "A2.2": {
    displayName: "Elementary II",
    focusAreas: "Future forms, opinions, paragraph writing, pronunciation",
    weekCount: 3,
  },
  "B1.1": {
    displayName: "Intermediate I",
    focusAreas: "Life experiences, opinions, everyday problem-solving, short presentations",
    weekCount: 5,
  },
  "B1.2": {
    displayName: "Intermediate II",
    focusAreas: "Essay structure, listening strategies, fluency building",
    weekCount: 3,
  },
  "B2.1": {
    displayName: "Upper-Intermediate I",
    focusAreas: "Coherence, argument essays, advanced reading techniques",
    weekCount: 3,
  },
  "B2.2": {
    displayName: "Upper-Intermediate II",
    focusAreas: "Timed tasks, collocation, integrated skills review",
    weekCount: 5,
  },
  "C1.1": {
    displayName: "Advanced I",
    focusAreas: "Nuanced grammar, academic writing, advanced discussion skills",
    weekCount: 5,
  },
  "C1.2": {
    displayName: "Advanced Mastery",
    focusAreas: "Professional communication, complex texts, graduation readiness",
    weekCount: 5,
  },
};

export function getPathwayLevelDisplay(code: string, description?: string) {
  const meta = DISPLAY[code];
  if (meta) return meta;
  const fallback = CEFR_SUB_LEVELS.find((l) => l.code === code);
  return {
    displayName: fallback?.name ?? code,
    focusAreas: description ?? fallback?.description ?? "",
    weekCount: fallback?.weekCount ?? 3,
  };
}

export function cefrCodeToSlug(code: string | null | undefined): string {
  if (!code?.trim()) return "b1-1";
  const trimmed = code.trim();
  if (/^[abc][12]$/i.test(trimmed)) {
    return getCefrLevel(trimmed)?.slug ?? `${trimmed.toLowerCase()}-1`;
  }
  return trimmed.toLowerCase().replace(".", "-");
}

export function normalizeCefrCode(value: string | null | undefined): string {
  if (!value?.trim()) return "B1.1";
  const v = value.trim().toUpperCase();
  if (/^[ABC][12]\.[12]$/.test(v)) return v;
  if (/^[ABC][12]$/.test(v)) {
    return defaultSubLevelForBand(v)?.code ?? "B1.1";
  }
  const match = getCefrLevel(normalizeCefrSlug(v));
  return match?.code ?? "B1.1";
}
