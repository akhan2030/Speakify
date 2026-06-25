import { bandToCefrSubLevelSlug, getCefrLevel } from "@/lib/course/cefrLevels";
import { getProgramTrack, type ProgramTrack } from "@/lib/course/programTracks";
import {
  type StudentProfile,
  getRecommendedTrackSlug,
  getSkillLabel,
  buildStudentProfile,
} from "@/lib/course/studentProfile";

export type CourseRecommendation = {
  trackSlug: string;
  trackCode: string;
  trackName: string;
  weekCount: number;
  reason: string;
  confidence: number;
  href: string;
  cefrSubLevel: string;
};

export type SkillRecommendation = {
  skill: string;
  label: string;
  priority: number;
  reason: string;
  href: string;
  currentBand: number | null;
  gapToTarget: number;
};

export type RecommendationBundle = {
  course: CourseRecommendation;
  focusSkills: SkillRecommendation[];
  nextAction: string;
  weeklyFocus: string;
  summary: string;
};

const SKILL_HREFS: Record<string, string> = {
  writing: "/dashboard/student/writing",
  speaking: "/dashboard/student/speaking",
  reading: "/dashboard/student/reading",
  listening: "/dashboard/student/listening",
  vocabulary: "/dashboard/student/vocabulary",
  grammar: "/dashboard/student/grammar",
};

function buildCourseReason(profile: StudentProfile, track: ProgramTrack | undefined): string {
  const band = profile.currentBand ?? profile.placementBand;
  if (profile.enrolledTrackSlug) {
    return `You're enrolled in ${profile.enrolledTrackName ?? track?.name}. Continue your ${track?.weekCount ?? 6}-week pathway.`;
  }
  if (band == null) {
    return `Start the ${track?.code ?? "Foundation"} track to build structured progress toward Band ${profile.targetBand}.`;
  }
  return `Based on Band ${band.toFixed(1)}, the ${track?.code ?? "recommended"} track (${track?.weekCount ?? 6} weeks) matches your current level and target of Band ${profile.targetBand}.`;
}

function computeCourseConfidence(profile: StudentProfile): number {
  let confidence = 70;
  if (profile.placementBand != null) confidence += 15;
  if (profile.currentBand != null) confidence += 10;
  if (profile.enrolledTrackSlug) confidence += 5;
  return Math.min(98, confidence);
}

export function recommendCourse(profile: StudentProfile): CourseRecommendation {
  const trackSlug = getRecommendedTrackSlug(profile);
  const track = getProgramTrack(trackSlug);
  const band = profile.currentBand ?? profile.placementBand ?? 5;
  const cefrLevel = getCefrLevel(bandToCefrSubLevelSlug(band));

  return {
    trackSlug,
    trackCode: track?.code ?? trackSlug,
    trackName: track?.name ?? profile.enrolledTrackName ?? "Speakify Track",
    weekCount: track?.weekCount ?? 6,
    reason: buildCourseReason(profile, track),
    confidence: computeCourseConfidence(profile),
    href: `/dashboard/student/course/${trackSlug}`,
    cefrSubLevel: cefrLevel?.code ?? "—",
  };
}

export function recommendFocusSkills(
  profile: StudentProfile,
  limit = 4
): SkillRecommendation[] {
  const skills = Object.entries(profile.skillBands)
    .map(([skill, band]) => {
      const gapToTarget =
        band != null
          ? Math.max(0, Math.round((profile.targetBand - band) * 10) / 10)
          : profile.bandGap;
      const priority =
        band != null
          ? gapToTarget * 10 + (profile.weakAreas.includes(skill) ? 20 : 0)
          : profile.weakAreas.includes(skill)
            ? 50
            : 30;

      let reason = `Build toward Band ${profile.targetBand}`;
      if (band != null && band < profile.targetBand - 0.5) {
        reason = `${getSkillLabel(skill)} at Band ${band.toFixed(1)} — ${gapToTarget.toFixed(1)} below target`;
      } else if (band == null) {
        reason = `No ${getSkillLabel(skill).toLowerCase()} data yet — start practicing`;
      } else if (profile.strongAreas.includes(skill)) {
        reason = `Maintain your strength in ${getSkillLabel(skill).toLowerCase()}`;
      }

      return {
        skill,
        label: getSkillLabel(skill),
        priority,
        reason,
        href: SKILL_HREFS[skill] ?? "/dashboard/student",
        currentBand: band,
        gapToTarget,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  return skills.slice(0, limit);
}

export function buildRecommendations(profile: StudentProfile): RecommendationBundle {
  const course = recommendCourse(profile);
  const focusSkills = recommendFocusSkills(profile);
  const topSkill = focusSkills[0];

  let nextAction = "Take the placement test to unlock your personalized pathway";
  if (profile.enrolledTrackName && profile.courseProgressPercent < 100) {
    nextAction = `Continue ${profile.enrolledTrackName} — ${profile.courseProgressPercent}% complete`;
  } else if (topSkill?.currentBand != null) {
    nextAction = `Focus on ${topSkill.label} — ${topSkill.reason}`;
  } else if (topSkill) {
    nextAction = `Start ${topSkill.label} practice`;
  }

  const weeklyFocus =
    profile.weakAreas[0] && profile.weakAreas[0] !== "balanced practice across all skills"
      ? `This week: intensive ${getSkillLabel(profile.weakAreas[0]).toLowerCase()} drills + course lessons`
      : `This week: balanced skill rotation on the ${course.trackCode} track`;

  const summary =
    profile.currentBand != null
      ? `Band ${profile.currentBand.toFixed(1)} → ${profile.targetBand.toFixed(1)} via ${course.trackName}`
      : `Target Band ${profile.targetBand} — enroll in ${course.trackName}`;

  return {
    course,
    focusSkills,
    nextAction,
    weeklyFocus,
    summary,
  };
}

export { buildStudentProfile };
