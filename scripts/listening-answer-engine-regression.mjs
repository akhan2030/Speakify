/**
 * Automated tests for the IELTS Listening answer validation & feedback engine.
 * Run: node scripts/listening-answer-engine-regression.mjs
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  validateListeningAnswer,
  scoreListeningAnswersWithFeedback,
  parseWordLimit,
  checkListeningAnswer,
} = (() => {
  const engine = require("../lib/listeningAnswerEngine.js");
  const check = require("../lib/checkListeningAnswer.js");
  return {
    validateListeningAnswer: engine.validateListeningAnswer,
    scoreListeningAnswersWithFeedback: engine.scoreListeningAnswersWithFeedback,
    parseWordLimit: engine.parseWordLimit,
    checkListeningAnswer: check.checkListeningAnswer,
  };
})();

let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

test("equivalent number / word forms are accepted", () => {
  assert.equal(checkListeningAnswer("65", "65/sixty-five"), true);
  assert.equal(checkListeningAnswer("sixty-five", "65/sixty-five"), true);
  assert.equal(checkListeningAnswer("sixty five", "65/sixty-five"), true);
  assert.equal(checkListeningAnswer("SIXTY-FIVE", "65/sixty-five"), true);
});

test("currency and measurement variants are accepted", () => {
  assert.equal(
    checkListeningAnswer("30 pounds", "£30/30 pounds/thirty pounds"),
    true
  );
  assert.equal(
    checkListeningAnswer("£30", "£30/30 pounds/thirty pounds"),
    true
  );
  assert.equal(checkListeningAnswer("1.25 m", "1.25 metres/1.25 m"), true);
  assert.equal(checkListeningAnswer("1.25 meters", "1.25 metres/1.25 m"), true);
});

test("articles, plurals, spacing variants are accepted", () => {
  assert.equal(checkListeningAnswer("manuscript", "(the) manuscript"), true);
  assert.equal(checkListeningAnswer("the manuscript", "(the) manuscript"), true);
  assert.equal(checkListeningAnswer("keywords", "key words/keywords"), true);
  assert.equal(checkListeningAnswer("key words", "key words/keywords"), true);
});

test("capitalisation is ignored", () => {
  assert.equal(checkListeningAnswer("Library", "library"), true);
  assert.equal(checkListeningAnswer("b", "B"), true);
});

test("word limits are parsed from official instructions", () => {
  assert.equal(parseWordLimit("ONE WORD ONLY").maxWords, 1);
  assert.equal(parseWordLimit("ONE WORD ONLY").allowNumber, false);
  assert.equal(parseWordLimit("NO MORE THAN TWO WORDS AND/OR A NUMBER").maxWords, 2);
  assert.equal(parseWordLimit("NO MORE THAN THREE WORDS").maxWords, 3);
});

test("word limits are enforced while still accepting valid variants", () => {
  const ok = validateListeningAnswer({
    studentAnswer: "parking",
    correctAnswer: "parking",
    wordLimit: "ONE WORD ONLY",
  });
  assert.equal(ok.correct, true);

  const tooMany = validateListeningAnswer({
    studentAnswer: "free parking area",
    correctAnswer: "parking",
    wordLimit: "ONE WORD ONLY",
  });
  assert.equal(tooMany.correct, false);
  assert.equal(tooMany.category, "word_limit");
  assert.ok(tooMany.feedback?.whyIncorrect);
  assert.ok(tooMany.feedback?.coachingNote);
});

test("ONE WORD ONLY rejects numeric answers", () => {
  const r = validateListeningAnswer({
    studentAnswer: "12",
    correctAnswer: "twelve/12",
    wordLimit: "ONE WORD ONLY",
  });
  assert.equal(r.correct, false);
  assert.equal(r.category, "word_limit");
});

test("Choose TWO either-order groups ignore answer order", () => {
  const scored = scoreListeningAnswersWithFeedback(
    ["E", "D"],
    ["D", "E"],
    [
      { eitherOrderGroup: "pair", wordLimit: null },
      { eitherOrderGroup: "pair", wordLimit: null },
    ]
  );
  assert.equal(scored.score, 2);
  assert.equal(scored.results[0].correct, true);
  assert.equal(scored.results[1].correct, true);

  const partial = scoreListeningAnswersWithFeedback(
    ["D", "A"],
    ["D", "E"],
    [
      { eitherOrderGroup: "pair" },
      { eitherOrderGroup: "pair" },
    ]
  );
  assert.equal(partial.score, 1);
});

test("incorrect answers generate meaningful feedback (not generic Incorrect)", () => {
  const r = validateListeningAnswer({
    studentAnswer: "Monday",
    correctAnswer: "Tuesday",
    wordLimit: "ONE WORD ONLY",
    explanation: "The speaker first said Monday then corrected to Tuesday.",
    transcript:
      "We'll meet on Monday — sorry, I mean Tuesday at the main entrance.",
  });
  assert.equal(r.correct, false);
  assert.ok(r.feedback);
  assert.notEqual(r.feedback.whyIncorrect?.toLowerCase(), "incorrect");
  assert.ok(r.feedback.correctAnswer);
  assert.ok(r.feedback.explanation);
  assert.ok(r.feedback.coachingNote);
  assert.ok(r.feedback.lossReason);
  assert.ok(r.feedback.skillTested || r.feedback.studyTip);
});

test("spelling mistakes that change meaning are marked incorrect with spelling category", () => {
  const r = validateListeningAnswer({
    studentAnswer: "libary",
    correctAnswer: "library",
    wordLimit: "ONE WORD ONLY",
  });
  assert.equal(r.correct, false);
  assert.ok(["spelling", "content"].includes(r.category));
  assert.ok(r.feedback?.whyIncorrect);
});

test("blank answers get blank feedback category", () => {
  const r = validateListeningAnswer({
    studentAnswer: "",
    correctAnswer: "library",
  });
  assert.equal(r.correct, false);
  assert.equal(r.category, "blank");
  assert.ok(r.feedback?.whyIncorrect);
});

console.log(failed ? `\n${failed} check(s) failed.\n` : "\nAll checks passed.\n");
process.exit(failed ? 1 : 0);
