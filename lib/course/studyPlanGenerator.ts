import type { StudentProfile } from "@/lib/course/studentProfile";
import { getSkillLabel } from "@/lib/course/studentProfile";
import { bandToProgramTrackSlug, getProgramTrack } from "@/lib/course/programTracks";
import { recommendFocusSkills } from "@/lib/course/recommendationEngine";

export type StudyPlanActivity = {
  label: string;
  durationMinutes: number;
  href?: string;
  type: "course" | "skill" | "review" | "mock";
};

export type StudyPlanWeek = {
  week: number;
  phase: string;
  focus: string;
  skill: string;
  activities: StudyPlanActivity[];
  estimatedHours: number;
};

export type PersonalizedStudyPlan = {
  totalWeeks: number;
  trackSlug: string;
  trackName: string;
  targetBand: number;
  currentBand: number | null;
  weeks: StudyPlanWeek[];
  dailyRecommendation: string;
};

const SKILL_HREFS: Record<string, string> = {
  writing: "/dashboard/student/writing",
  speaking: "/dashboard/student/speaking",
  reading: "/dashboard/student/reading",
  listening: "/dashboard/student/listening",
  vocabulary: "/dashboard/student/vocabulary",
  grammar: "/dashboard/student/grammar",
};

const PHASES_6 = ["Foundation", "Build", "Strengthen", "Integrate", "Accelerate", "Exam prep"];
const PHASES_4 = ["Intensive review", "Timed practice", "Mock sections", "Exam polish"];

function pickFocusSkills(profile: StudentProfile, weekCount: number): string[] {
  const prioritized = recommendFocusSkills(profile, 6).map((s) => s.skill);
  const rotation = [...prioritized];
  while (rotation.length < weekCount) {
    rotation.push(prioritized[rotation.length % Math.max(prioritized.length, 1)] ?? "reading");
  }
  return rotation.slice(0, weekCount);
}

function buildWeekActivities(
  skill: string,
  week: number,
  trackSlug: string,
  isLastWeek: boolean
): StudyPlanActivity[] {
  const label = getSkillLabel(skill);
  const activities: StudyPlanActivity[] = [
    {
      label: `${label} practice session (45 min)`,
      durationMinutes: 45,
      href: SKILL_HREFS[skill],
      type: "skill",
    },
    {
      label: `Course Week ${week} lessons (70/30)`,
      durationMinutes: 60,
      href: `/dashboard/student/course/${trackSlug}/week/${week}`,
      type: "course",
    },
    {
      label: "Vocabulary flashcards (20 min)",
      durationMinutes: 20,
      href: "/dashboard/student/vocabulary",
      type: "review",
    },
  ];

  if (week % 2 === 0) {
    activities.push({
      label: "Timed mini-mock section (30 min)",
      durationMinutes: 30,
      type: "mock",
    });
  }

  if (isLastWeek) {
    activities.push({
      label: "Full mock IELTS or graduation exam",
      durationMinutes: 120,
      href: `/dashboard/student/course/${trackSlug}/test/graduation`,
      type: "mock",
    });
  }

  return activities;
}

export function generatePersonalizedStudyPlan(profile: StudentProfile): PersonalizedStudyPlan {
  const trackSlug =
    profile.enrolledTrackSlug ??
    (profile.currentBand != null
      ? bandToProgramTrackSlug(profile.currentBand)
      : "foundation");

  const track = getProgramTrack(trackSlug);
  const weekCount = track?.weekCount ?? (trackSlug === "elite" ? 4 : 6);
  const phases = weekCount === 4 ? PHASES_4 : PHASES_6;
  const focusSkills = pickFocusSkills(profile, weekCount);

  const weeks: StudyPlanWeek[] = focusSkills.map((skill, index) => {
    const week = index + 1;
    const activities = buildWeekActivities(skill, week, trackSlug, week === weekCount);
    const estimatedHours =
      Math.round((activities.reduce((sum, a) => sum + a.durationMinutes, 0) / 60) * 10) / 10;

    return {
      week,
      phase: phases[index] ?? `Week ${week}`,
      focus: `${getSkillLabel(skill)} — ${phases[index] ?? "Practice"}`,
      skill,
      activities,
      estimatedHours,
    };
  });

  const topWeak = profile.weakAreas[0];
  const dailyRecommendation =
    topWeak && topWeak !== "balanced practice across all skills"
      ? `Daily: 30 min ${getSkillLabel(topWeak).toLowerCase()} + 1 course lesson`
      : "Daily: 45 min mixed skills + 1 course lesson";

  return {
    totalWeeks: weekCount,
    trackSlug,
    trackName: track?.name ?? "Speakify Track",
    targetBand: profile.targetBand,
    currentBand: profile.currentBand,
    weeks,
    dailyRecommendation,
  };
}
