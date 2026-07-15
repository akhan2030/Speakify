/**
 * Live OpenAI generation + student marking for Matching Features.
 * Run: node scripts/matching-features-live-check.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { generatePassage } from "../lib/passageGenerator.js";
import { validateReadingPracticeContent } from "../lib/readingQuestionContent.js";
import { scoreReadingAttempt } from "../lib/readingScorer.js";

const studentId = `live-mf-${Date.now()}`;
console.log("Generating matching-features passage via OpenAI…");

const result = await generatePassage("matching-features", studentId, "practice");
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
const featureKeys = (passage.features ?? []).map((f) => f.key);
const wrong =
  featureKeys.find((k) => k !== studentAnswers[firstId]) ?? "A";
studentAnswers[firstId] = wrong;

const scored = scoreReadingAttempt(studentAnswers, correctAnswers);

console.log("\n=== Matching Features — live student attempt ===\n");
console.log(`Passage: ${passage.title}`);
console.log("\nFeatures:");
for (const f of passage.features ?? []) {
  console.log(`  ${f.key}. ${f.label}`);
}
console.log("\nStatements + marking:");
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
console.log("\nLive matching-features check: PASS\n");
