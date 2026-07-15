/**
 * Live OpenAI generation + student marking for Diagram Completion.
 * Run: node scripts/diagram-completion-live-check.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { generatePassage } from "../lib/passageGenerator.js";
import { validateReadingPracticeContent } from "../lib/readingQuestionContent.js";
import {
  answersMatchFlexible,
  scoreReadingAttempt,
} from "../lib/readingScorer.js";

const studentId = `live-dc-${Date.now()}`;
console.log("Generating diagram-completion passage via OpenAI…");

const result = await generatePassage(
  "diagram-completion",
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
const alternativesById = Object.fromEntries(
  passage.questions.map((q) => [q.id, q.alternatives ?? []])
);

const studentAnswers = { ...correctAnswers };
const firstId = passage.questions[0].id;
studentAnswers[firstId] = "wrong label";

const scored = scoreReadingAttempt(studentAnswers, correctAnswers, {
  alternativesById,
});

console.log("\n=== Diagram Completion — live student attempt ===\n");
console.log(`Passage: ${passage.title}`);
console.log(`Diagram: ${passage.diagram?.title ?? "(untitled)"}`);
console.log("\nNodes:");
for (const node of passage.diagram?.nodes ?? []) {
  if (node.kind === "fixed") {
    console.log(`  [fixed] ${node.text}`);
  } else {
    console.log(`  [blank ${node.id}] answer=${node.answer ?? correctAnswers[node.id]}`);
  }
}

console.log("\nMarking:");
for (const q of passage.questions) {
  const student = studentAnswers[q.id] ?? "";
  const correct = correctAnswers[q.id];
  const ok = answersMatchFlexible(student, correct, q.alternatives);
  console.log(`Q${q.id}: student="${student}" correct="${correct}" => ${ok ? "CORRECT" : "INCORRECT"}`);
}

console.log("");
console.log(
  `Score: ${scored.score}/${scored.total} (${scored.accuracy.toFixed(1)}%) · Est. Band ${scored.estimatedBand}`
);
console.log(`generated=${result.generated} bankId=${result.bankId}`);
console.log("\nLive diagram-completion check: PASS\n");
