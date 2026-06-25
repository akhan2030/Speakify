import { roundToHalfBand } from "@/lib/placement/scoring";

export type ProgramTrack = {
  slug: string;
  code: string;
  name: string;
  description: string;
  weekCount: number;
  trackType: "program";
  minBand: number;
  maxBand: number;
  sortOrder: number;
  targetBands: string;
};

export const PROGRAM_TRACKS: ProgramTrack[] = [
  {
    slug: "foundation",
    code: "Foundation",
    name: "Speakify Foundation Track",
    description:
      "6-week core build: vocabulary, grammar foundations, listening and reading basics for bands below 5.5.",
    weekCount: 6,
    trackType: "program",
    minBand: 0,
    maxBand: 5.5,
    sortOrder: 1,
    targetBands: "Band 0 – 5.0",
  },
  {
    slug: "plus",
    code: "Plus",
    name: "Speakify Plus Track",
    description:
      "6-week intermediate IELTS prep: essay structure, listening strategies, speaking fluency for bands 5.5–7.0.",
    weekCount: 6,
    trackType: "program",
    minBand: 5.5,
    maxBand: 7.0,
    sortOrder: 2,
    targetBands: "Band 5.5 – 6.5",
  },
  {
    slug: "elite",
    code: "Elite",
    name: "Speakify Elite Track",
    description:
      "4-week intensive accelerator: timed tasks, advanced writing, mock sections for bands 7.0+.",
    weekCount: 4,
    trackType: "program",
    minBand: 7.0,
    maxBand: 9.0,
    sortOrder: 3,
    targetBands: "Band 7.0+",
  },
];

export function getProgramTrack(slug: string) {
  return PROGRAM_TRACKS.find((t) => t.slug === slug);
}

export function bandToProgramTrackSlug(band: number): string {
  const b = roundToHalfBand(band);
  if (b < 5.5) return "foundation";
  if (b < 7.0) return "plus";
  return "elite";
}

export function getNextProgramTrackSlug(slug: string): string | null {
  const idx = PROGRAM_TRACKS.findIndex((t) => t.slug === slug);
  if (idx < 0 || idx >= PROGRAM_TRACKS.length - 1) return null;
  return PROGRAM_TRACKS[idx + 1].slug;
}

export function isValidProgramTrackSlug(slug: string): boolean {
  return PROGRAM_TRACKS.some((t) => t.slug === slug);
}

/** Weeks 1..N are open; weeks N+1..end require mid-level pass (N = floor(weekCount/2)). */
export function getMidLevelUnlockWeek(weekCount: number): number {
  return Math.floor(weekCount / 2);
}
