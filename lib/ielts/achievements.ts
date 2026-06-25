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
