/**
 * Reading practice content regression checks (run: npm run test:reading)
 */
import assert from "node:assert/strict";
import { bankPassageToPracticeContent } from "../lib/passageContentAdapter.js";
import { getPracticeContent } from "../lib/readingPracticeSamples.js";
import {
  READING_INCOMPLETE_UI_TYPES,
  validateMatchingHeadingsContent,
  validateMatchingInformationContent,
  validateClassificationContent,
  validateMatchingSentenceEndingsContent,
  validateMatchingFeaturesContent,
  validateDiagramCompletionContent,
  validateReadingPracticeContent,
  validateTfngAnswerBalance,
  finalizeMatchingHeadingsContent,
  finalizeMatchingInformationContent,
  finalizeClassificationContent,
  finalizeMatchingSentenceEndingsContent,
  finalizeMatchingFeaturesContent,
  finalizeDiagramCompletionContent,
  hasTrivialSequentialMatchingHeadingsPattern,
  isGenericMatchingHeadingsPrompt,
  isWithinIeltsWordLimit,
  statementSupportedByParagraph,
} from "../lib/readingQuestionContent.js";
import {
  answersMatchFlexible,
  scoreReadingAttempt,
} from "../lib/readingScorer.js";

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

test("sample matching-information validates and allows letter reuse", () => {
  const sample = getPracticeContent("matching-information");
  assert.ok(sample);
  const check = validateReadingPracticeContent(sample);
  assert.ok(check.valid, check.errors.join("; "));
  const answers = (check.content?.questions ?? []).map((q) => q.correct);
  assert.ok(answers.filter((a) => a === "B").length >= 2, "expects letter reuse");
  assert.ok(!answers.includes("A"), "paragraph A unused");
});

test("reject matching-information when answer letter not in passage", () => {
  const check = validateMatchingInformationContent({
    slug: "matching-information",
    paragraphs: [
      { id: "pA", label: "A", text: "Alpha content about rivers and rainfall patterns across valleys." },
      { id: "pB", label: "B", text: "Beta content about bridges and transport engineering challenges." },
      { id: "pC", label: "C", text: "Gamma content about museums and cultural heritage funding." },
    ],
    questions: [
      {
        id: "q1",
        text: "A mention of bridges and transport engineering challenges",
        correct: "D",
        evidence: "bridges and transport engineering challenges",
      },
      {
        id: "q2",
        text: "A reference to cultural heritage funding",
        correct: "C",
        evidence: "museums and cultural heritage funding",
      },
      {
        id: "q3",
        text: "Details about rainfall patterns across valleys",
        correct: "A",
        evidence: "rivers and rainfall patterns across valleys",
      },
    ],
  });
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => e.includes('answer "D"')));
});

test("reject matching-information when evidence does not match answer paragraph", () => {
  const check = validateMatchingInformationContent(
    finalizeMatchingInformationContent({
      slug: "matching-information",
      paragraphs: [
        { id: "pA", label: "A", text: "Alpha content about rivers and rainfall patterns across valleys." },
        { id: "pB", label: "B", text: "Beta content about bridges and transport engineering challenges." },
        { id: "pC", label: "C", text: "Gamma content about museums and cultural heritage funding." },
      ],
      questions: [
        {
          id: "q1",
          text: "A mention of bridges and transport engineering",
          correct: "A",
          evidence: "bridges and transport engineering challenges",
        },
        {
          id: "q2",
          text: "A reference to cultural heritage funding programmes",
          correct: "C",
          evidence: "museums and cultural heritage funding",
        },
        {
          id: "q3",
          text: "Details about rainfall patterns across valleys",
          correct: "A",
          evidence: "rivers and rainfall patterns across valleys",
        },
      ],
    })
  );
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => e.includes("not supported by paragraph")));
});

test("reject forced 1-to-1 matching-information mapping", () => {
  const check = validateMatchingInformationContent(
    finalizeMatchingInformationContent({
      slug: "matching-information",
      paragraphs: [
        { id: "pA", label: "A", text: "Solar panels reduced household electricity bills substantially after installation." },
        { id: "pB", label: "B", text: "Wind turbines generated surplus power during winter storms across coasts." },
        { id: "pC", label: "C", text: "Battery storage helped communities keep lights on during blackouts overnight." },
      ],
      questions: [
        {
          id: "q1",
          text: "Household electricity bills fell after panels were installed",
          correct: "A",
          evidence: "Solar panels reduced household electricity bills substantially after installation",
        },
        {
          id: "q2",
          text: "Surplus power came from coastal wind turbines in winter",
          correct: "B",
          evidence: "Wind turbines generated surplus power during winter storms across coasts",
        },
        {
          id: "q3",
          text: "Communities used battery storage during overnight blackouts",
          correct: "C",
          evidence: "Battery storage helped communities keep lights on during blackouts overnight",
        },
      ],
    })
  );
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => e.includes("1-to-1")));
});

test("matching-information scoring marks correct and incorrect letters", () => {
  const sample = getPracticeContent("matching-information");
  assert.ok(sample);
  const correctAnswers = Object.fromEntries(
    sample.questions.map((q) => [q.id, q.correct])
  );
  const studentAnswers = {
    mi1: "B",
    mi2: "C",
    mi3: "A",
    mi4: "D",
    mi5: "E",
  };
  const scored = scoreReadingAttempt(studentAnswers, correctAnswers);
  assert.equal(scored.total, 5);
  assert.equal(scored.score, 4);
  assert.ok(statementSupportedByParagraph(
    sample.questions[0].text,
    sample.paragraphs.find((p) => p.label === "B").text,
    sample.questions[0].evidence
  ));
});

test("sample classification validates with reusable categories", () => {
  const sample = getPracticeContent("classification");
  assert.ok(sample);
  const check = validateReadingPracticeContent(sample);
  assert.ok(check.valid, check.errors.join("; "));
  assert.ok((check.content?.categories?.length ?? 0) >= 2);
  const answers = (check.content?.questions ?? []).map((q) => q.correct);
  assert.ok(answers.filter((a) => a === "A").length >= 2, "expects category reuse");
});

test("reject classification without category list", () => {
  const check = validateClassificationContent(
    finalizeClassificationContent({
      slug: "classification",
      paragraphs: [
        { id: "p1", label: "1", text: "Alpha researcher described river flooding patterns." },
        { id: "p2", label: "2", text: "Beta researcher measured coastal erosion rates carefully." },
      ],
      questions: [
        { id: "q1", text: "Described river flooding patterns", correct: "A", evidence: "described river flooding patterns" },
        { id: "q2", text: "Measured coastal erosion rates", correct: "B", evidence: "measured coastal erosion rates carefully" },
        { id: "q3", text: "Another river flooding claim", correct: "A", evidence: "river flooding patterns" },
      ],
    })
  );
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => /2–4 named categories|category/i.test(e)));
});

test("reject classification when evidence is not in the passage", () => {
  const check = validateClassificationContent(
    finalizeClassificationContent({
      slug: "classification",
      categories: [
        { key: "A", label: "Alpha researcher" },
        { key: "B", label: "Beta researcher" },
      ],
      paragraphs: [
        { id: "p1", label: "1", text: "Alpha researcher described river flooding patterns across valleys." },
        { id: "p2", label: "2", text: "Beta researcher measured coastal erosion rates carefully each season." },
      ],
      questions: [
        {
          id: "q1",
          text: "Described river flooding patterns",
          correct: "A",
          evidence: "completely unrelated volcano eruption narrative",
        },
        {
          id: "q2",
          text: "Measured coastal erosion rates carefully",
          correct: "B",
          evidence: "measured coastal erosion rates carefully each season",
        },
        {
          id: "q3",
          text: "Again refers to river flooding across valleys",
          correct: "A",
          evidence: "river flooding patterns across valleys",
        },
      ],
    })
  );
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => e.includes("not supported by passage evidence")));
});

test("classification scoring marks correct and incorrect categories", () => {
  const sample = getPracticeContent("classification");
  assert.ok(sample);
  const correctAnswers = Object.fromEntries(
    sample.questions.map((q) => [q.id, q.correct])
  );
  const studentAnswers = {
    cl1: "A",
    cl2: "B",
    cl3: "A",
    cl4: "B",
    cl5: "A",
  };
  const scored = scoreReadingAttempt(studentAnswers, correctAnswers);
  assert.equal(scored.total, 5);
  assert.equal(scored.score, 4);
});

test("sample matching-sentence-endings validates with unique endings and distractors", () => {
  const sample = getPracticeContent("matching-sentence-endings");
  assert.ok(sample);
  const check = validateReadingPracticeContent(sample);
  assert.ok(check.valid, check.errors.join("; "));
  assert.ok((check.content?.endings?.length ?? 0) >= sample.questions.length + 2);
  const answers = sample.questions.map((q) => q.correct);
  assert.equal(new Set(answers).size, answers.length, "endings must be unique");
});

test("reject matching-sentence-endings that reuse an ending letter", () => {
  const sample = getPracticeContent("matching-sentence-endings");
  assert.ok(sample);
  const bad = finalizeMatchingSentenceEndingsContent({
    ...sample,
    questions: sample.questions.map((q, i) =>
      i === 1 ? { ...q, correct: sample.questions[0].correct } : q
    ),
  });
  const check = validateMatchingSentenceEndingsContent(bad);
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => /once only|reuse/i.test(e)));
});

test("reject matching-sentence-endings with fewer than 2 distractors", () => {
  const sample = getPracticeContent("matching-sentence-endings");
  assert.ok(sample);
  const used = new Set(sample.questions.map((q) => q.correct));
  const trimmedEndings = sample.endings.filter(
    (e, index) => used.has(e.key) || index < sample.questions.length + 1
  );
  const check = validateMatchingSentenceEndingsContent(
    finalizeMatchingSentenceEndingsContent({
      ...sample,
      endings: trimmedEndings.slice(0, sample.questions.length + 1),
    })
  );
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => /distractor/i.test(e)));
});

test("matching-sentence-endings scoring marks correct and incorrect endings", () => {
  const sample = getPracticeContent("matching-sentence-endings");
  assert.ok(sample);
  const correctAnswers = Object.fromEntries(
    sample.questions.map((q) => [q.id, q.correct])
  );
  const studentAnswers = {
    mse1: "D",
    mse2: "B",
    mse3: "C",
    mse4: "G",
    mse5: "E",
  };
  const scored = scoreReadingAttempt(studentAnswers, correctAnswers);
  assert.equal(scored.total, 5);
  assert.equal(scored.score, 4);
});

test("sample matching-features validates with reusable features", () => {
  const sample = getPracticeContent("matching-features");
  assert.ok(sample);
  const check = validateReadingPracticeContent(sample);
  assert.ok(check.valid, check.errors.join("; "));
  assert.ok((check.content?.features?.length ?? 0) >= 3);
  const answers = (check.content?.questions ?? []).map((q) => q.correct);
  assert.ok(answers.filter((a) => a === "A").length >= 2, "expects feature reuse");
});

test("reject matching-features forced 1-to-1 mapping", () => {
  const check = validateMatchingFeaturesContent(
    finalizeMatchingFeaturesContent({
      slug: "matching-features",
      features: [
        { key: "A", label: "Alice Rivera" },
        { key: "B", label: "Ben Okeke" },
        { key: "C", label: "Carla Hofmann" },
      ],
      paragraphs: [
        {
          id: "p1",
          label: "1",
          text: "Alice Rivera catalogued alpine butterflies across three valleys during summer surveys.",
        },
        {
          id: "p2",
          label: "2",
          text: "Ben Okeke measured peat carbon stores beneath coastal mangrove forests carefully.",
        },
        {
          id: "p3",
          label: "3",
          text: "Carla Hofmann tested drought-resistant millet strains in arid highland plots.",
        },
      ],
      questions: [
        {
          id: "q1",
          text: "Catalogued alpine butterflies across three valleys",
          correct: "A",
          evidence:
            "Alice Rivera catalogued alpine butterflies across three valleys during summer surveys",
        },
        {
          id: "q2",
          text: "Measured peat carbon stores beneath coastal mangroves",
          correct: "B",
          evidence:
            "Ben Okeke measured peat carbon stores beneath coastal mangrove forests carefully",
        },
        {
          id: "q3",
          text: "Tested drought-resistant millet strains in arid highland plots",
          correct: "C",
          evidence:
            "Carla Hofmann tested drought-resistant millet strains in arid highland plots",
        },
      ],
    })
  );
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => e.includes("1-to-1")));
});

test("matching-features scoring marks correct and incorrect feature letters", () => {
  const sample = getPracticeContent("matching-features");
  assert.ok(sample);
  const correctAnswers = Object.fromEntries(
    sample.questions.map((q) => [q.id, q.correct])
  );
  const studentAnswers = {
    mf1: "A",
    mf2: "B",
    mf3: "C",
    mf4: "A",
    mf5: "A",
    mf6: "E",
  };
  const scored = scoreReadingAttempt(studentAnswers, correctAnswers);
  assert.equal(scored.total, 6);
  assert.equal(scored.score, 5);
});

test("sample diagram-completion validates blanks and word limits", () => {
  const sample = getPracticeContent("diagram-completion");
  assert.ok(sample);
  const check = validateReadingPracticeContent(sample);
  assert.ok(check.valid, check.errors.join("; "));
  assert.ok((check.content?.diagram?.nodes?.length ?? 0) >= 5);
  assert.ok(
    sample.questions.every((q) => isWithinIeltsWordLimit(q.correct, 2))
  );
});

test("reject diagram-completion answers longer than two words", () => {
  const sample = getPracticeContent("diagram-completion");
  const bad = finalizeDiagramCompletionContent({
    ...sample,
    questions: sample.questions.map((q, i) =>
      i === 0
        ? { ...q, correct: "very long incorrect answer phrase" }
        : q
    ),
    diagram: {
      ...sample.diagram,
      nodes: sample.diagram.nodes.map((n) =>
        n.id === sample.questions[0].id
          ? { ...n, answer: "very long incorrect answer phrase" }
          : n
      ),
    },
  });
  const check = validateDiagramCompletionContent(bad);
  assert.ok(!check.valid);
  assert.ok(check.errors.some((e) => /TWO WORDS/i.test(e)));
});

test("diagram-completion flexible marking accepts plural variant", () => {
  assert.ok(answersMatchFlexible("screens", "screen"));
  assert.ok(
    answersMatchFlexible("settling chamber", "settling tank", [
      "settling chamber",
    ])
  );
  const sample = getPracticeContent("diagram-completion");
  const correctAnswers = Object.fromEntries(
    sample.questions.map((q) => [q.id, q.correct])
  );
  const alternativesById = Object.fromEntries(
    sample.questions.map((q) => [q.id, q.alternatives ?? []])
  );
  const studentAnswers = {
    "2": "screen",
    "3": "settling chamber",
    "4": "sand bed",
    "5": "charcoal layer",
    "6": "wrong outlet",
  };
  const scored = scoreReadingAttempt(studentAnswers, correctAnswers, {
    alternativesById,
  });
  assert.equal(scored.total, 5);
  assert.equal(scored.score, 4);
});

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll checks passed.");
