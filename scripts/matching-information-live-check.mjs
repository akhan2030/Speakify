/**
 * Live marking walkthrough for Matching Information practice.
 * Run: node scripts/matching-information-live-check.mjs
 */
import assert from "node:assert/strict";
import { getPracticeContent } from "../lib/readingPracticeSamples.js";
import {
  finalizeMatchingInformationContent,
  validateReadingPracticeContent,
} from "../lib/readingQuestionContent.js";
import { bankPassageToPracticeContent } from "../lib/passageContentAdapter.js";
import { scoreReadingAttempt } from "../lib/readingScorer.js";

const sample = getPracticeContent("matching-information");
assert.ok(sample, "sample missing");

const validated = validateReadingPracticeContent(sample);
assert.ok(validated.valid, validated.errors.join("; "));

const content = validated.content ?? sample;
const correctAnswers = Object.fromEntries(
  content.questions.map((q) => [q.id, q.correct])
);

// Simulated student attempt: 4/5 correct (mi3 deliberately wrong)
const studentAnswers = {
  mi1: "B",
  mi2: "C",
  mi3: "A",
  mi4: "D",
  mi5: "E",
};

const scored = scoreReadingAttempt(studentAnswers, correctAnswers);

console.log("\n=== Matching Information — live student attempt ===\n");
console.log(`Passage: ${content.title}`);
console.log(
  `Paragraphs: ${content.paragraphs.map((p) => p.label).join(", ")}`
);
console.log(`Questions: ${content.questions.length}`);
console.log("");

for (const q of content.questions) {
  const student = studentAnswers[q.id] ?? "";
  const correct = correctAnswers[q.id];
  const ok = student.toLowerCase() === String(correct).toLowerCase();
  console.log(
    `Q${q.id}: "${q.text.slice(0, 64)}${q.text.length > 64 ? "…" : ""}"`
  );
  console.log(
    `  student=${student || "(blank)"}  correct=${correct}  => ${
      ok ? "CORRECT" : "INCORRECT"
    }`
  );
}

console.log("");
console.log(
  `Score: ${scored.score}/${scored.total} (${scored.accuracy.toFixed(1)}%) · Est. Band ${scored.estimatedBand}`
);

assert.equal(scored.score, 4);
assert.equal(scored.total, 5);

// Bank adapter path (what generatePassage uses)
const bankContent = bankPassageToPracticeContent(
  {
    id: "live-mi-1",
    title: content.title,
    content: content.paragraphs
      .map((p) => `${p.label}. ${p.text}`)
      .join("\n\n"),
    difficulty: "medium",
    questions: content.questions.map((q, i) => ({
      id: i + 1,
      text: q.text,
      answer: q.correct,
      evidence: q.evidence,
    })),
  },
  "matching-information"
);
const bankCheck = validateReadingPracticeContent(
  finalizeMatchingInformationContent(bankContent)
);
assert.ok(bankCheck.valid, bankCheck.errors.join("; "));

console.log("\nBank adapter + validation: PASS");
console.log("Live marking check: PASS\n");
