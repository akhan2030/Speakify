import { roundToHalfBand } from "@/lib/placement/scoring";
import { bandToProgramTrackSlug, getProgramTrack } from "@/lib/course/programTracks";
import { bandToCefrSubLevelSlug, getCefrLevel } from "@/lib/course/cefrLevels";
import type { PlacementResult } from "@/lib/placement/types";

export type SkillBandMap = {
  writing: number | null;
  speaking: number | null;
  reading: number | null;
  listening: number | null;
  vocabulary: number | null;
  grammar: number | null;
};

export type StudentProfile = {
  studentId: string;
  currentBand: number | null;
  targetBand: number;
  bandGap: number;
  skillBands: SkillBandMap;
  weakAreas: string[];
  strongAreas: string[];
  placementBand: number | null;
  enrolledTrackSlug: string | null;
  enrolledTrackName: string | null;
  courseProgressPercent: number;
  lessonsCompleted: number;
  totalLessons: number;
  studyStreak: number;
  weeklyStudyDays: number;
  recentActivityCount: number;
  lastActivityDate: string | null;
};

const SKILL_KEYS = [
  "writing",
  "speaking",
  "reading",
  "listening",
  "vocabulary",
  "grammar",
] as const;

const SKILL_LABELS: Record<string, string> = {
  writing: "Writing",
  speaking: "Speaking",
  reading: "Reading",
  listening: "Listening",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
};

export function averageBand(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function identifyWeakStrongAreas(
  skillBands: SkillBandMap,
  overallBand: number | null
): { weakAreas: string[]; strongAreas: string[] } {
  const baseline = overallBand ?? 5;
  const weakAreas: string[] = [];
  const strongAreas: string[] = [];

  for (const key of SKILL_KEYS) {
    const band = skillBands[key];
    if (band == null) continue;
    if (band < baseline - 0.5) weakAreas.push(key);
    if (band >= baseline + 0.5) strongAreas.push(key);
  }

  if (weakAreas.length === 0 && baseline < 7) {
    weakAreas.push("balanced practice across all skills");
  }
  if (strongAreas.length === 0) {
    strongAreas.push("consistent effort");
  }

  return { weakAreas, strongAreas };
}

export function buildStudentProfile(input: {
  studentId: string;
  skillBands: SkillBandMap;
  targetBand?: number | null;
  placementBand?: number | null;
  enrolledTrackSlug?: string | null;
  enrolledTrackName?: string | null;
  lessonsCompleted?: number;
  totalLessons?: number;
  studyStreak?: number;
  weeklyStudyDays?: number;
  recentActivityCount?: number;
  lastActivityDate?: string | null;
}): StudentProfile {
  const targetBand = input.targetBand ?? 7;
  const currentBand = averageBand([
    input.skillBands.writing,
    input.skillBands.speaking,
    input.skillBands.reading,
    input.skillBands.listening,
    input.skillBands.vocabulary,
    input.skillBands.grammar,
    input.placementBand,
  ]);

  const bandGap =
    currentBand != null
      ? Math.max(0, roundToHalfBand(targetBand - currentBand))
      : targetBand;

  const { weakAreas, strongAreas } = identifyWeakStrongAreas(
    input.skillBands,
    currentBand
  );

  const totalLessons = input.totalLessons ?? 0;
  const lessonsCompleted = input.lessonsCompleted ?? 0;
  const courseProgressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((lessonsCompleted / totalLessons) * 100))
      : 0;

  return {
    studentId: input.studentId,
    currentBand,
    targetBand,
    bandGap,
    skillBands: input.skillBands,
    weakAreas,
    strongAreas,
    placementBand: input.placementBand ?? null,
    enrolledTrackSlug: input.enrolledTrackSlug ?? null,
    enrolledTrackName: input.enrolledTrackName ?? null,
    courseProgressPercent,
    lessonsCompleted,
    totalLessons,
    studyStreak: input.studyStreak ?? 0,
    weeklyStudyDays: input.weeklyStudyDays ?? 0,
    recentActivityCount: input.recentActivityCount ?? 0,
    lastActivityDate: input.lastActivityDate ?? null,
  };
}

export function getSkillLabel(skill: string) {
  return SKILL_LABELS[skill] ?? skill.replace(/_/g, " ");
}

export function getRecommendedTrackSlug(profile: StudentProfile): string {
  if (profile.enrolledTrackSlug) return profile.enrolledTrackSlug;
  const band = profile.currentBand ?? profile.placementBand ?? 5;
  return bandToProgramTrackSlug(band);
}

export function getRecommendedCefrSlug(profile: StudentProfile): string {
  const band = profile.currentBand ?? profile.placementBand ?? 5;
  return bandToCefrSubLevelSlug(band);
}

export function getTrackMeta(slug: string) {
  return getProgramTrack(slug) ?? getCefrLevel(slug);
}

export function buildProfileFromPlacement(
  result: PlacementResult,
  targetBand?: number
): StudentProfile {
  const bands = result.skillBands;
  return buildStudentProfile({
    studentId: "placement",
    skillBands: {
      writing: bands.writing_prompt ?? bands.writing ?? null,
      speaking: bands.speaking ?? null,
      reading: bands.reading ?? null,
      listening: bands.listening ?? null,
      vocabulary: bands.vocabulary ?? null,
      grammar: bands.grammar ?? null,
    },
    targetBand: targetBand ?? Math.min(9, roundToHalfBand(result.overallBand + 1)),
    placementBand: result.overallBand,
    weeklyStudyDays: 0,
    studyStreak: 0,
  });
}
