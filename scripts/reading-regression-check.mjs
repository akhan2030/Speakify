/**
 * Reading practice content regression checks (run: npm run test:reading)
 */
import assert from "node:assert/strict";
import { bankPassageToPracticeContent } from "../lib/passageContentAdapter.js";
import { getPracticeContent } from "../lib/readingPracticeSamples.js";
import {
  finalizeMatchingHeadingsContent,
  hasTrivialSequentialMatchingHeadingsPattern,
  isGenericMatchingHeadingsPrompt,
  READING_INCOMPLETE_UI_TYPES,
  shuffleMatchingHeadingsMapping,
  validateMatchingHeadingsContent,
  validateReadingPracticeContent,
  validateTfngAnswerBalance,
} from "../lib/readingQuestionContent.js";

let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

console.log("Reading regression checks\n");

test("sample matching-headings has visible heading list and per-paragraph items", () => {
  const sample = getPracticeContent("matching-headings");
  assert.ok(sample);
  const check = validateReadingPracticeContent(sample);
  assert.ok(check.valid, check.errors.join("; "));
  assert.ok((check.content?.headings?.length ?? 0) >= 4);
  assert.ok((check.content?.questions?.length ?? 0) >= 3);
});

test("reject generic matching-headings shell without headings list", () => {
  const bad = finalizeMatchingHeadingsContent({
    slug: "matching-headings",
    paragraphs: [
      { id: "pA", label: "A", text: "Para A" },
      { id: "pB", label: "B", text: "Para B" },
    ],
    questions: [
      {
        id: "q1",
        kind: "matching-headings",
        text: "Match the headings to the appropriate paragraphs",
        correct: "i",
      },
    ],
  });
  const check = validateMatchingHeadingsContent(bad);
  assert.ok(!check.valid);
  assert.ok(isGenericMatchingHeadingsPrompt(bad.questions[0].text));
});

test("propagate shared headings from first question to all paragraph items", () => {
  const headings = [
    { key: "i", label: "Historical context" },
    { key: "ii", label: "Modern policy" },
    { key: "iii", label: "Future outlook" },
    { key: "iv", label: "Unused distractor" },
  ];
  const content = finalizeMatchingHeadingsContent({
    slug: "matching-headings",
    paragraphs: [
      { id: "pA", label: "A", text: "Text A" },
      { id: "pB", label: "B", text: "Text B" },
    ],
    questions: [
      {
        id: "h1",
        kind: "matching-headings",
        text: "Paragraph A",
        paragraphId: "pA",
        headings,
        correct: "i",
      },
      {
        id: "h2",
        kind: "matching-headings",
        text: "Paragraph B",
        paragraphId: "pB",
        correct: "ii",
      },
    ],
  });
  const check = validateMatchingHeadingsContent(content);
  assert.ok(check.valid, check.errors.join("; "));
  assert.equal(content.questions[1].headings?.length, 4);
});

test("bank adapter coalesces passage-level headings array", () => {
  const content = bankPassageToPracticeContent(
    {
      id: 99,
      title: "Test Passage",
      content: "A. First paragraph.\n\nB. Second paragraph.",
      difficulty: "medium",
      headings: [
        { key: "i", label: "Early developments" },
        { key: "ii", label: "Recent reforms" },
        { key: "iii", label: "Economic impact" },
        { key: "iv", label: "Distractor heading" },
      ],
      questions: [
        {
          id: 1,
          text: "Paragraph A",
          answer: "i",
          paragraphId: "pA",
        },
        {
          id: 2,
          text: "Paragraph B",
          answer: "ii",
          paragraphId: "pB",
        },
      ],
    },
    "matching-headings"
  );
  const check = validateReadingPracticeContent(content);
  assert.ok(check.valid, check.errors.join("; "));
  assert.ok(content.headings?.length >= 4);
});

test("incomplete UI types are blocked with clear message", () => {
  for (const slug of READING_INCOMPLETE_UI_TYPES) {
    const check = validateReadingPracticeContent({
      slug,
      paragraphs: [{ id: "pA", label: "A", text: "Text" }],
      questions: [{ id: "q1", text: "Sample", correct: "A" }],
    });
    assert.ok(!check.valid, slug);
    assert.ok(check.errors[0]?.includes("not fully built"));
  }
});

test("detect trivial sequential matching-headings pattern", () => {
  const trivial = {
    paragraphs: [
      { id: "pA", label: "A", text: "A" },
      { id: "pB", label: "B", text: "B" },
      { id: "pC", label: "C", text: "C" },
    ],
    questions: [
      { id: "1", text: "Paragraph A", paragraphId: "pA", correct: "i" },
      { id: "2", text: "Paragraph B", paragraphId: "pB", correct: "ii" },
      { id: "3", text: "Paragraph C", paragraphId: "pC", correct: "iii" },
    ],
    headings: [
      { key: "i", label: "One" },
      { key: "ii", label: "Two" },
      { key: "iii", label: "Three" },
      { key: "iv", label: "Distractor" },
    ],
  };
  assert.ok(hasTrivialSequentialMatchingHeadingsPattern(trivial));
});

test("shuffle matching-headings breaks positional answer pattern", () => {
  const trivial = {
    passageId: "test-seq",
    paragraphs: [
      { id: "pA", label: "A", text: "A" },
      { id: "pB", label: "B", text: "B" },
      { id: "pC", label: "C", text: "C" },
      { id: "pD", label: "D", text: "D" },
      { id: "pE", label: "E", text: "E" },
    ],
    questions: [
      { id: "1", text: "Paragraph A", paragraphId: "pA", correct: "i" },
      { id: "2", text: "Paragraph B", paragraphId: "pB", correct: "ii" },
      { id: "3", text: "Paragraph C", paragraphId: "pC", correct: "iii" },
      { id: "4", text: "Paragraph D", paragraphId: "pD", correct: "iv" },
      { id: "5", text: "Paragraph E", paragraphId: "pE", correct: "v" },
    ],
    headings: [
      { key: "i", label: "Heading A topic" },
      { key: "ii", label: "Heading B topic" },
      { key: "iii", label: "Heading C topic" },
      { key: "iv", label: "Heading D topic" },
      { key: "v", label: "Heading E topic" },
      { key: "vi", label: "Distractor 1" },
      { key: "vii", label: "Distractor 2" },
      { key: "viii", label: "Distractor 3" },
    ],
  };
  const shuffled = finalizeMatchingHeadingsContent({
    slug: "matching-headings",
    ...trivial,
  });
  assert.ok(!hasTrivialSequentialMatchingHeadingsPattern(shuffled));
  const check = validateMatchingHeadingsContent(shuffled);
  assert.ok(check.valid, check.errors.join("; "));
  assert.deepEqual(
    shuffled.headings.map((h) => h.key),
    ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"]
  );
});

test("TFNG sample uses TRUE, FALSE, and NOT GIVEN", () => {
  const sample = getPracticeContent("true-false-not-given");
  assert.ok(sample);
  const check = validateReadingPracticeContent(sample);
  assert.ok(check.valid, check.errors.join("; "));
});

test("reject TFNG passage skewed to only TRUE and FALSE", () => {
  const check = validateReadingPracticeContent({
    slug: "true-false-not-given",
    questions: [
      { id: "q1", correct: "TRUE" },
      { id: "q2", correct: "FALSE" },
      { id: "q3", correct: "TRUE" },
      { id: "q4", correct: "FALSE" },
    ],
  });
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => e.includes("NOT GIVEN")));
});

test("validateTfngAnswerBalance accepts balanced set", () => {
  const check = validateTfngAnswerBalance([
    { correct: "TRUE" },
    { correct: "FALSE" },
    { correct: "NOT GIVEN" },
    { correct: "TRUE" },
  ]);
  assert.ok(check.valid, check.errors.join("; "));
});

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll checks passed.");
