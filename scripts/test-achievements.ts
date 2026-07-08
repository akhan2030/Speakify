import {
  evaluateAchievements,
  formatAchievementProgress,
  type AchievementContext,
} from "../lib/ielts/achievements.ts";

const emptyCtx: AchievementContext = {
  tasksCompleted: 0,
  streak: 0,
  mocksTaken: 0,
  currentBand: null,
  writingAttempts: 0,
  wordsMastered: 0,
  skillsAttempted: 0,
  trackProgressPercent: 0,
};

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const writing = formatAchievementProgress("writing-10", { ...emptyCtx, writingAttempts: 3 }, false);
assert(writing.statusLabel === "3 of 10 tasks submitted", "writing label");
assert(writing.progressPercent === 30, "writing percent");

const streak = formatAchievementProgress("streak-7", { ...emptyCtx, streak: 2 }, false);
assert(streak.statusLabel === "2 of 7 days", "streak label");

const vocab = formatAchievementProgress("vocab-100", { ...emptyCtx, wordsMastered: 12 }, false);
assert(vocab.statusLabel === "12 of 100 words", "vocab label");

const firstLesson = formatAchievementProgress("first-lesson", emptyCtx, false);
assert(
  firstLesson.statusLabel.includes("Not started"),
  "first lesson shows not started"
);

const earned = evaluateAchievements({
  ...emptyCtx,
  tasksCompleted: 1,
  writingAttempts: 10,
  wordsMastered: 100,
  skillsAttempted: 4,
  mocksTaken: 1,
  streak: 7,
  currentBand: 6.2,
  trackProgressPercent: 100,
});
assert(earned.length === 9, "all achievements unlock with real thresholds");

console.log("All achievement progress tests passed.");
