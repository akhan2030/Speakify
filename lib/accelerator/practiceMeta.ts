import type { AcceleratorTrackId } from "./tracks";

export type AcceleratorSectionId = "listening" | "reading" | "writing" | "speaking";

export type SectionPracticeMeta = {
  id: AcceleratorSectionId;
  name: string;
  questionTypes: string[];
  estimatedMinutes: number;
  difficulty: string;
};

const FOUNDATION_SECTIONS: SectionPracticeMeta[] = [
  {
    id: "listening",
    name: "Listening",
    questionTypes: ["Form completion", "Multiple choice", "Matching", "Note completion"],
    estimatedMinutes: 30,
    difficulty: "Band 5.0–5.5",
  },
  {
    id: "reading",
    name: "Reading",
    questionTypes: ["True / False / Not Given", "Sentence completion", "Multiple choice"],
    estimatedMinutes: 40,
    difficulty: "Band 5.0–5.5",
  },
  {
    id: "writing",
    name: "Writing",
    questionTypes: ["Task 1 — chart/table", "Task 2 — opinion essay"],
    estimatedMinutes: 60,
    difficulty: "Band 5.0–5.5",
  },
  {
    id: "speaking",
    name: "Speaking",
    questionTypes: ["Part 1 personal", "Part 2 cue card", "Part 3 discussion"],
    estimatedMinutes: 15,
    difficulty: "Band 5.0–5.5",
  },
];

const PLUS_SECTIONS: SectionPracticeMeta[] = [
  {
    id: "listening",
    name: "Listening",
    questionTypes: ["Academic discussion", "Campus map", "Matching", "Lecture notes"],
    estimatedMinutes: 35,
    difficulty: "Band 6.0–6.5",
  },
  {
    id: "reading",
    name: "Reading",
    questionTypes: ["Matching headings", "Yes / No / Not Given", "Summary completion"],
    estimatedMinutes: 45,
    difficulty: "Band 6.0–6.5",
  },
  {
    id: "writing",
    name: "Writing",
    questionTypes: ["Task 1 — graph combo", "Task 2 — balanced discussion"],
    estimatedMinutes: 60,
    difficulty: "Band 6.0–6.5",
  },
  {
    id: "speaking",
    name: "Speaking",
    questionTypes: ["Extended Part 1", "Cue card with examples", "Abstract Part 3"],
    estimatedMinutes: 15,
    difficulty: "Band 6.0–6.5",
  },
];

const ELITE_SECTIONS: SectionPracticeMeta[] = [
  {
    id: "listening",
    name: "Listening",
    questionTypes: ["Fast lecture", "Multi-speaker panel", "Complex note completion"],
    estimatedMinutes: 40,
    difficulty: "Band 7.0+",
  },
  {
    id: "reading",
    name: "Reading",
    questionTypes: ["All question types", "Inference", "Author attitude"],
    estimatedMinutes: 50,
    difficulty: "Band 7.0+",
  },
  {
    id: "writing",
    name: "Writing",
    questionTypes: ["Task 1 — complex data", "Task 2 — sophisticated argument"],
    estimatedMinutes: 60,
    difficulty: "Band 7.0+",
  },
  {
    id: "speaking",
    name: "Speaking",
    questionTypes: ["Idiomatic Part 1", "Nuanced cue card", "Speculation in Part 3"],
    estimatedMinutes: 15,
    difficulty: "Band 7.0+",
  },
];

export const SECTION_META_BY_TRACK: Record<
  AcceleratorTrackId,
  SectionPracticeMeta[]
> = {
  foundation: FOUNDATION_SECTIONS,
  plus: PLUS_SECTIONS,
  elite: ELITE_SECTIONS,
};

export const TARGET_BAND_LABEL: Record<AcceleratorTrackId, string> = {
  foundation: "5.0–5.5",
  plus: "6.0–6.5",
  elite: "7.0+",
};

export const FULL_MOCK_MINUTES = 165;

export function getSectionMeta(
  track: AcceleratorTrackId,
  section: AcceleratorSectionId
): SectionPracticeMeta {
  return (
    SECTION_META_BY_TRACK[track].find((s) => s.id === section) ??
    SECTION_META_BY_TRACK.foundation[0]
  );
}
