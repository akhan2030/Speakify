export const IELTS_ACHIEVEMENTS = [
  { id: "first-lesson", title: "First lesson completed", icon: "📘", desc: "Complete your first study task" },
  { id: "streak-7", title: "7-day streak", icon: "🔥", desc: "Study 7 days in a row" },
  { id: "first-mock", title: "First mock exam", icon: "📝", desc: "Complete a full mock exam" },
  { id: "band-6", title: "First Band 6 estimate", icon: "⭐", desc: "Reach Band 6.0 overall estimate" },
  { id: "writing-10", title: "Writing ×10", icon: "✍", desc: "Submit 10 writing tasks" },
  { id: "vocab-100", title: "100 words mastered", icon: "📚", desc: "Master 100 vocabulary words" },
  { id: "all-skills", title: "All 4 skills practiced", icon: "🎯", desc: "Practice Writing, Speaking, Reading & Listening" },
  { id: "track-50", title: "Track 50% complete", icon: "🗺", desc: "Reach halfway on your accelerator track" },
  { id: "graduate", title: "Track graduate", icon: "🏆", desc: "Complete your full accelerator track" },
] as const;

export type AchievementId = (typeof IELTS_ACHIEVEMENTS)[number]["id"];

export type AchievementContext = {
  tasksCompleted: number;
  streak: number;
  mocksTaken: number;
  currentBand: number | null;
  writingAttempts: number;
  wordsMastered: number;
  skillsAttempted: number;
  trackProgressPercent: number;
};

export type AchievementProgressKind = "count" | "percent" | "band" | "requirement";

export type AchievementProgress = {
  kind: AchievementProgressKind;
  statusLabel: string;
  current?: number;
  target?: number;
  progressPercent?: number;
};

export function evaluateAchievements(ctx: AchievementContext): string[] {
  const earned: string[] = [];
  if (ctx.tasksCompleted > 0) earned.push("first-lesson");
  if (ctx.streak >= 7) earned.push("streak-7");
  if (ctx.mocksTaken >= 1) earned.push("first-mock");
  if (ctx.currentBand != null && ctx.currentBand >= 6) earned.push("band-6");
  if (ctx.writingAttempts >= 10) earned.push("writing-10");
  if (ctx.wordsMastered >= 100) earned.push("vocab-100");
  if (ctx.skillsAttempted >= 4) earned.push("all-skills");
  if (ctx.trackProgressPercent >= 50) earned.push("track-50");
  if (ctx.trackProgressPercent >= 100) earned.push("graduate");
  return earned;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countProgressLabel(current: number, target: number, unit: string): AchievementProgress {
  const progressPercent = clampPercent((current / target) * 100);
  return {
    kind: "count",
    current,
    target,
    progressPercent,
    statusLabel: `${current} of ${target} ${unit}`,
  };
}

export function formatAchievementProgress(
  achievementId: AchievementId,
  ctx: AchievementContext,
  earned: boolean
): AchievementProgress {
  if (earned) {
    return { kind: "requirement", statusLabel: "Earned" };
  }

  switch (achievementId) {
    case "writing-10":
      return countProgressLabel(ctx.writingAttempts, 10, "tasks submitted");
    case "streak-7":
      return countProgressLabel(ctx.streak, 7, "days");
    case "vocab-100":
      return countProgressLabel(ctx.wordsMastered, 100, "words");
    case "all-skills":
      return countProgressLabel(ctx.skillsAttempted, 4, "skills practiced");
    case "track-50":
      return {
        kind: "percent",
        current: ctx.trackProgressPercent,
        target: 50,
        progressPercent: clampPercent((ctx.trackProgressPercent / 50) * 100),
        statusLabel: `${ctx.trackProgressPercent}% of track (need 50%)`,
      };
    case "graduate":
      return {
        kind: "percent",
        current: ctx.trackProgressPercent,
        target: 100,
        progressPercent: clampPercent(ctx.trackProgressPercent),
        statusLabel: `${ctx.trackProgressPercent}% of track (need 100%)`,
      };
    case "band-6":
      if (ctx.currentBand == null) {
        return {
          kind: "band",
          statusLabel: "No band estimate yet — complete a mock or skill practice",
        };
      }
      return {
        kind: "band",
        current: ctx.currentBand,
        target: 6,
        progressPercent: clampPercent((ctx.currentBand / 6) * 100),
        statusLabel: `Band ${ctx.currentBand.toFixed(1)} (need 6.0)`,
      };
    case "first-lesson":
      return {
        kind: "requirement",
        statusLabel:
          ctx.tasksCompleted > 0
            ? "Complete your first study task"
            : "Not started — complete any task from Today's Mission",
      };
    case "first-mock":
      return {
        kind: "requirement",
        statusLabel:
          ctx.mocksTaken > 0
            ? "Complete a full mock exam"
            : "Not started — take a full mock exam",
      };
    default:
      return { kind: "requirement", statusLabel: "In progress" };
  }
}
