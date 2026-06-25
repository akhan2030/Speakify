import { roundToHalfBand } from "@/lib/placement/scoring";
import type { StudentProfile } from "@/lib/course/studentProfile";
import { getProgramTrack } from "@/lib/course/programTracks";

export type ProjectedAchievement = {
  projectedDate: string;
  projectedDateLabel: string;
  weeksRemaining: number;
  daysRemaining: number;
  weeklyBandGain: number;
  onTrack: boolean;
  confidence: "high" | "medium" | "low";
  message: string;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Estimates weekly band improvement from study habits and course progress. */
export function estimateWeeklyBandGain(profile: StudentProfile): number {
  const band = profile.currentBand ?? profile.placementBand ?? 5;
  const gap = profile.bandGap;

  if (gap <= 0) return 0.25;

  let gain = 0.15;

  if (profile.weeklyStudyDays >= 5) gain += 0.08;
  else if (profile.weeklyStudyDays >= 3) gain += 0.04;
  else if (profile.weeklyStudyDays <= 1) gain -= 0.05;

  if (profile.studyStreak >= 7) gain += 0.05;
  else if (profile.studyStreak >= 3) gain += 0.02;

  if (profile.courseProgressPercent >= 50) gain += 0.04;
  else if (profile.courseProgressPercent >= 20) gain += 0.02;

  if (profile.recentActivityCount >= 5) gain += 0.03;

  if (band >= 7) gain *= 0.75;
  else if (band >= 6) gain *= 0.9;

  if (gap > 2) gain *= 0.85;

  return Math.max(0.08, Math.min(0.35, roundToHalfBand(gain * 4) / 4));
}

export function computeProjectedAchievement(
  profile: StudentProfile,
  fromDate: Date = new Date()
): ProjectedAchievement {
  const gap = profile.bandGap;

  if (gap <= 0) {
    const today = formatDateLabel(fromDate);
    return {
      projectedDate: fromDate.toISOString(),
      projectedDateLabel: today,
      weeksRemaining: 0,
      daysRemaining: 0,
      weeklyBandGain: 0,
      onTrack: true,
      confidence: "high",
      message: "You've reached your target band — focus on mock exams and consistency.",
    };
  }

  const weeklyBandGain = estimateWeeklyBandGain(profile);
  const weeksRemaining = Math.max(1, Math.ceil(gap / weeklyBandGain));
  const daysRemaining = weeksRemaining * 7;
  const projected = addDays(fromDate, daysRemaining);

  const track = profile.enrolledTrackSlug
    ? getProgramTrack(profile.enrolledTrackSlug)
    : null;
  const trackWeeks = track?.weekCount ?? 6;

  const onTrack = weeksRemaining <= trackWeeks + Math.ceil(gap * 2);

  let confidence: ProjectedAchievement["confidence"] = "medium";
  if (profile.weeklyStudyDays >= 4 && profile.studyStreak >= 3) confidence = "high";
  else if (profile.weeklyStudyDays <= 1 && profile.studyStreak === 0) confidence = "low";

  let message = `At your current pace (~${weeklyBandGain.toFixed(2)} band/week), you'll reach Band ${profile.targetBand} in about ${weeksRemaining} week${weeksRemaining === 1 ? "" : "s"}.`;
  if (!onTrack) {
    message += " Increase study days to 4+ per week to stay on track.";
  } else if (confidence === "high") {
    message += " Great momentum — keep it up!";
  }

  return {
    projectedDate: projected.toISOString(),
    projectedDateLabel: formatDateLabel(projected),
    weeksRemaining,
    daysRemaining,
    weeklyBandGain,
    onTrack,
    confidence,
    message,
  };
}
