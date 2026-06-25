import type { StudentProfile } from "@/lib/course/studentProfile";
import { getSkillLabel } from "@/lib/course/studentProfile";
import type { RecommendationBundle } from "@/lib/course/recommendationEngine";
import type { ProjectedAchievement } from "@/lib/course/projectedAchievement";
import { computeProjectedAchievement } from "@/lib/course/projectedAchievement";

export type SkillReadiness = {
  skill: string;
  label: string;
  band: number | null;
  target: number;
  percent: number;
};

export type ReadinessMeterData = {
  readinessPercent: number;
  statusLabel: string;
  statusColor: "red" | "amber" | "gold" | "teal";
  currentBand: number | null;
  targetBand: number | null;
  bandGap: number;
  courseProgressPercent: number;
  activityScore: number;
  skills: SkillReadiness[];
  nextAction: string;
  enrolledLevel: string | null;
  projectedAchievement: ProjectedAchievement;
  recommendations: RecommendationBundle | null;
  weeklyStudyDays: number;
  studyStreak: number;
  weeklyBandGain: number;
  hoursStudied: number;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function bandToPercent(band: number | null, target: number) {
  if (band == null || !Number.isFinite(band) || target <= 0) return 0;
  return clampPercent((band / target) * 100);
}

export function computeReadinessMeter(
  profile: StudentProfile,
  recommendations?: RecommendationBundle | null
): ReadinessMeterData {
  const targetBand = profile.targetBand;
  const skills: SkillReadiness[] = (
    ["writing", "speaking", "reading", "listening", "vocabulary", "grammar"] as const
  ).map((skill) => ({
    skill,
    label: getSkillLabel(skill),
    band: profile.skillBands[skill],
    target: targetBand,
    percent: bandToPercent(profile.skillBands[skill], targetBand),
  }));

  const currentBand = profile.currentBand;
  const bandGap = profile.bandGap;

  const trackedSkills = skills.filter((s) => s.band != null);
  const skillAverage =
    trackedSkills.length > 0
      ? trackedSkills.reduce((sum, s) => sum + s.percent, 0) / trackedSkills.length
      : profile.placementBand != null
        ? clampPercent((profile.placementBand / targetBand) * 100)
        : 0;

  const courseProgressPercent = profile.courseProgressPercent;

  const streak = profile.studyStreak;
  const weeklyDays = profile.weeklyStudyDays;
  const activityScore = clampPercent(
    Math.min(streak * 10, 50) + Math.min(weeklyDays * 7, 35) + Math.min(profile.recentActivityCount * 3, 15)
  );

  const projectedAchievement = computeProjectedAchievement(profile);

  const paceBonus =
    projectedAchievement.confidence === "high"
      ? 8
      : projectedAchievement.confidence === "low"
        ? -5
        : 0;

  const readinessPercent = clampPercent(
    skillAverage * 0.5 + courseProgressPercent * 0.25 + activityScore * 0.15 + paceBonus + 10
  );

  let statusLabel = "Getting started";
  let statusColor: ReadinessMeterData["statusColor"] = "red";
  if (readinessPercent >= 85) {
    statusLabel = "Exam ready";
    statusColor = "teal";
  } else if (readinessPercent >= 65) {
    statusLabel = "On track";
    statusColor = "gold";
  } else if (readinessPercent >= 40) {
    statusLabel = "Building momentum";
    statusColor = "amber";
  }

  const nextAction =
    recommendations?.nextAction ??
    (trackedSkills.length
      ? `Focus on ${[...trackedSkills].sort((a, b) => a.percent - b.percent)[0]?.label ?? "skills"}`
      : "Take the placement test to unlock your pathway");

  return {
    readinessPercent,
    statusLabel,
    statusColor,
    currentBand,
    targetBand,
    bandGap,
    courseProgressPercent,
    activityScore,
    skills,
    nextAction,
    enrolledLevel: profile.enrolledTrackName,
    projectedAchievement,
    recommendations: recommendations ?? null,
    weeklyStudyDays: weeklyDays,
    studyStreak: streak,
    weeklyBandGain: projectedAchievement.weeklyBandGain,
    hoursStudied: Math.round(((profile.lessonsCompleted ?? 0) * 45) / 60 * 10) / 10,
  };
}
