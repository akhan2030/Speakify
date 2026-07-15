/**
 * Live OpenAI generation + student marking for Classification practice.
 * Run: node scripts/classification-live-check.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { generatePassage } from "../lib/passageGenerator.js";
import { validateReadingPracticeContent } from "../lib/readingQuestionContent.js";
import { scoreReadingAttempt } from "../lib/readingScorer.js";

const studentId = `live-cl-${Date.now()}`;
console.log("Generating classification passage via OpenAI…");

const result = await generatePassage("classification", studentId, "practice");
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

// Simulate a mostly-correct student attempt (flip first answer wrong)
const studentAnswers = { ...correctAnswers };
const firstId = passage.questions[0].id;
const categoryKeys = (passage.categories ?? []).map((c) => c.key);
const wrong =
  categoryKeys.find((k) => k !== studentAnswers[firstId]) ?? "A";
studentAnswers[firstId] = wrong;

const scored = scoreReadingAttempt(studentAnswers, correctAnswers);

console.log("\n=== Classification — live student attempt ===\n");
console.log(`Passage: ${passage.title}`);
console.log(
  `Categories: ${(passage.categories ?? [])
    .map((c) => `${c.key}=${c.label}`)
    .join("; ")}`
);
console.log(`Questions: ${passage.questions.length}`);
console.log("");

for (const q of passage.questions) {
  const student = studentAnswers[q.id] ?? "";
  const correct = correctAnswers[q.id];
  const ok = String(student).toLowerCase() === String(correct).toLowerCase();
  console.log(`Q${q.id}: ${q.text.slice(0, 72)}${q.text.length > 72 ? "…" : ""}`);
  console.log(
    `  student=${student}  correct=${correct}  => ${ok ? "CORRECT" : "INCORRECT"}`
  );
}

console.log("");
console.log(
  `Score: ${scored.score}/${scored.total} (${scored.accuracy.toFixed(1)}%) · Est. Band ${scored.estimatedBand}`
);
console.log(`generated=${result.generated} bankId=${result.bankId}`);
console.log("\nLive classification check: PASS\n");
