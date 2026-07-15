/**
 * Live OpenAI generation + student marking for Matching Sentence Endings.
 * Run: node scripts/matching-sentence-endings-live-check.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { generatePassage } from "../lib/passageGenerator.js";
import { validateReadingPracticeContent } from "../lib/readingQuestionContent.js";
import { scoreReadingAttempt } from "../lib/readingScorer.js";

const studentId = `live-mse-${Date.now()}`;
console.log("Generating matching-sentence-endings passage via OpenAI…");

const result = await generatePassage(
  "matching-sentence-endings",
  studentId,
  "practice"
);
const content = result.content;
const check = validateReadingPracticeContent(content);

if (!check.valid) {
  console.error("Validation failed:", check.errors);
  process.exit(1);
}

const passage = check.content ?? content;
const correctAnswers = Object.fromEntries(
  passage.questions.map((q) => [q.id, q.correct])
);

const studentAnswers = { ...correctAnswers };
const firstId = passage.questions[0].id;
const endingKeys = (passage.endings ?? []).map((e) => e.key);
const wrong =
  endingKeys.find((k) => k !== studentAnswers[firstId] && !Object.values(studentAnswers).includes(k)) ??
  endingKeys.find((k) => k !== studentAnswers[firstId]) ??
  "A";
studentAnswers[firstId] = wrong;

const scored = scoreReadingAttempt(studentAnswers, correctAnswers);

console.log("\n=== Matching Sentence Endings — live student attempt ===\n");
console.log(`Passage: ${passage.title}`);
console.log("\nEndings:");
for (const e of passage.endings ?? []) {
  console.log(`  ${e.key}. ${e.label}`);
}
console.log("\nBeginnings + marking:");
for (const q of passage.questions) {
  const student = studentAnswers[q.id] ?? "";
  const correct = correctAnswers[q.id];
  const ok = String(student).toLowerCase() === String(correct).toLowerCase();
  console.log(`Q${q.id}: ${q.text}`);
  console.log(
    `  student=${student}  correct=${correct}  => ${ok ? "CORRECT" : "INCORRECT"}`
  );
}

console.log("");
console.log(
  `Score: ${scored.score}/${scored.total} (${scored.accuracy.toFixed(1)}%) · Est. Band ${scored.estimatedBand}`
);
console.log(`generated=${result.generated} bankId=${result.bankId}`);
console.log("\nLive matching-sentence-endings check: PASS\n");
