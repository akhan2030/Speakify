/**
 * Mock exam listening display + content regression (run: npm run test:mock-listening)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getListeningPartsForMock } from "../lib/mock-test/academicMockSkillVariants";
import {
  buildMockListeningBlockHeader,
  getVisibleListeningBlockGroups,
  validateMockListeningParts,
} from "../lib/mock-test/mockListeningDisplay";
import { getTypeForQuestionNumber } from "../lib/listeningSectionTypes";

import {
  adaptMockQuestionsForUi,
  resolveEffectiveBlockType,
} from "../lib/mock-test/listeningQuestionAlign";
import { listeningRawToBand } from "../lib/listeningBandScore.js";
import { bindSpeakersForMultiVoice } from "../lib/listeningMultiVoiceBind.js";
import { MALE_VOICES, FEMALE_VOICES } from "../lib/listeningSpeakerProfiles.js";
import {
  SPELLING_PATTERN,
  SELF_CORRECTION_PATTERN,
  validateListeningAuthenticity,
} from "../lib/listeningAuthenticityContract.js";
import { syncPrepMessageSeconds } from "../lib/mock-test/prepMessageSync";
import { formatQuestionTypeLabel } from "../lib/listeningIeltsInstructions";

let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

console.log("Mock listening regression checks\n");

test("MockExamEngine auto-advances listening section intros (no Continue gate)", () => {
  const src = readFileSync("components/mock-test/MockExamEngine.tsx", "utf8");
  assert.ok(src.includes("Starting automatically"));
  assert.equal(src.includes(">Continue<"), false);
  assert.ok(src.includes('setListeningStep("prep")'));
});

test("MockExamEngine renders MockListeningBlockPanel (regression guard)", () => {
  const src = readFileSync("components/mock-test/MockExamEngine.tsx", "utf8");
  assert.ok(src.includes("MockListeningBlockPanel"));
  assert.ok(src.includes("ListeningIeltsInstruction") === false);
  assert.ok(src.includes("buildMockListeningBlockHeader") === false);
  assert.ok(src.includes("getVisibleListeningBlockGroups"));
});

test("MockListeningBlockPanel uses official question layout + example row", () => {
  const src = readFileSync("components/mock-test/MockListeningBlockPanel.tsx", "utf8");
  assert.ok(src.includes("ListeningIeltsInstruction"));
  assert.ok(src.includes("ListeningExampleQuestion"));
  assert.ok(src.includes("groupTitle"));
});

test("prep/break block header shows question type label", () => {
  const parts = getListeningPartsForMock(1);
  const part1 = parts[0];
  const header = buildMockListeningBlockHeader(part1.partNumber, part1.blocks[0]);
  assert.equal(header.sectionLabel, "Section 1 of 4");
  assert.equal(header.rangeLabel, "Questions 1–5");
  assert.equal(header.typeLabel, "Form Completion");
});

test("break step shows second block with different question type", () => {
  const parts = getListeningPartsForMock(1);
  const part1 = parts[0];
  const groups = getVisibleListeningBlockGroups(part1, "break", 1);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].block.questionStart, 6);
  const header = buildMockListeningBlockHeader(part1.partNumber, groups[0].block);
  assert.equal(header.typeLabel, "Note Completion");
  assert.notEqual(
    groups[0].block.questionType,
    part1.blocks[0].questionType
  );
});

test("check step shows all question-type groups in a section", () => {
  const parts = getListeningPartsForMock(1);
  const part1 = parts[0];
  const groups = getVisibleListeningBlockGroups(part1, "check", 0);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].questions.length, 5);
  assert.equal(groups[1].questions.length, 5);
});

test("MockListeningBlockPanel uses shared ListeningQuestions renderer", () => {
  const src = readFileSync("components/mock-test/MockListeningBlockPanel.tsx", "utf8");
  assert.ok(src.includes("ListeningQuestions"));
  assert.ok(src.includes("resolveEffectiveBlockType"));
});

test("Section 1 Q6-10 renders as note-completion UI", () => {
  const parts = getListeningPartsForMock(1);
  const block = parts[0].blocks[1];
  const questions = parts[0].questions.filter((q) => q.number >= 6 && q.number <= 10);
  assert.equal(questions[0].type, "note");
  const ui = adaptMockQuestionsForUi(questions, "note-completion", block);
  assert.equal(ui[0].type, "note-completion");
});

test("Section 2 Q11-17 renders as plan-map labelling with 8+ options", () => {
  const parts = getListeningPartsForMock(1);
  const questions = parts[1].questions.filter((q) => q.number >= 11 && q.number <= 17);
  const effective = resolveEffectiveBlockType(questions, "plan-map-diagram");
  assert.equal(effective, "plan-map-diagram");
  for (const q of questions) {
    assert.ok((q.options?.length ?? 0) >= 8, `Q${q.number} option count`);
    assert.match(String(q.correct), /^[A-J]$/i, `Q${q.number} letter`);
  }
});

test("Section 2 Q18-20 MCQ: single then choose-TWO either-order", () => {
  const parts = getListeningPartsForMock(1);
  const q18 = parts[1].questions.find((q) => q.number === 18)!;
  const q19 = parts[1].questions.find((q) => q.number === 19)!;
  const q20 = parts[1].questions.find((q) => q.number === 20)!;
  assert.equal(q18.chooseCount ?? 1, 1);
  assert.equal(q18.options?.length, 3);
  // One letter per question; shared eitherOrderGroup scores the set
  assert.equal(q19.chooseCount ?? 1, 1);
  assert.equal(q20.chooseCount ?? 1, 1);
  assert.equal(q19.options?.length, 5);
  assert.equal(q20.options?.length, 5);
  assert.ok(q19.eitherOrderGroup);
  assert.equal(q19.eitherOrderGroup, q20.eitherOrderGroup);
  assert.notEqual(String(q19.correct).toUpperCase(), String(q20.correct).toUpperCase());
});

test("Section 4 gap-fill questions have no options", () => {
  const parts = getListeningPartsForMock(1);
  const s4 = parts[3].questions;
  for (const q of s4) {
    assert.equal(q.options?.length ?? 0, 0, `Q${q.number} should have no options`);
  }
});

for (let mockNumber = 1; mockNumber <= 5; mockNumber += 1) {
  test(`mock #${mockNumber} listening content passes IELTS structure checks`, () => {
    const parts = getListeningPartsForMock(mockNumber);
    assert.equal(parts.length, 4);
    const issues = validateMockListeningParts(parts, mockNumber);
    assert.equal(
      issues.length,
      0,
      issues.map((i) => i.message).join("; ")
    );
  });
}

test("every mock block carries official questionType metadata", () => {
  for (let mockNumber = 1; mockNumber <= 5; mockNumber += 1) {
    const parts = getListeningPartsForMock(mockNumber);
    for (const part of parts) {
      for (const block of part.blocks) {
        assert.ok(block.questionType, `mock ${mockNumber} part ${part.partNumber}`);
        const expected = getTypeForQuestionNumber(
          part.partNumber,
          block.questionStart
        );
        assert.equal(block.questionType, expected);
      }
    }
  }
});

test("Mock #1 Section 1 uses First name + Surname (not combined delegate name)", () => {
  const parts = getListeningPartsForMock(1);
  const prompts = parts[0].questions
    .filter((q) => q.number <= 5)
    .map((q) => q.prompt.toLowerCase());
  assert.ok(prompts.some((p) => p.includes("first name")));
  assert.ok(prompts.some((p) => p.includes("surname")));
  assert.equal(prompts.some((p) => p.includes("delegate")), false);
});

test("0/10 section score maps to Band 1.0 (not 3.5 floor)", () => {
  assert.equal(listeningRawToBand(0, 10), 1.0);
  assert.equal(listeningRawToBand(0, 40), 1.0);
});

test("mock parts include per-section speaker profiles for multi-voice TTS", () => {
  const parts = getListeningPartsForMock(1);
  assert.ok((parts[0].speakers?.length ?? 0) >= 2, "Section 1 needs 2 speakers");
});

test("Mock #1 S1 binds Caller (James) to a male TTS voice distinct from Coordinator", () => {
  const parts = getListeningPartsForMock(1);
  const transcript = parts[0].blocks.map((b) => b.transcript).join("\n");
  const bound = bindSpeakersForMultiVoice(transcript, 1, parts[0].speakers);
  assert.ok(bound.length >= 2);
  const caller = bound.find((s) => /caller/i.test(String(s.label)));
  assert.ok(caller, "Caller label required");
  assert.equal(caller.gender, "male");
  assert.ok(MALE_VOICES.has(caller.voice), `Caller voice ${caller.voice}`);
  const voices = new Set(bound.map((s) => s.voice));
  assert.equal(voices.size, bound.length, "each speaker needs a distinct voice");
});

test("Mock #1 S3 binds three distinct gendered voices (Tutor/Hannah/Patrick)", () => {
  const parts = getListeningPartsForMock(1);
  const transcript = parts[2].blocks.map((b) => b.transcript).join("\n");
  const bound = bindSpeakersForMultiVoice(transcript, 3, parts[2].speakers);
  assert.ok(bound.length >= 3);
  const hannah = bound.find((s) => /hannah/i.test(String(s.label)));
  const patrick = bound.find((s) => /patrick/i.test(String(s.label)));
  assert.equal(hannah?.gender, "female");
  assert.ok(hannah && FEMALE_VOICES.has(hannah.voice));
  assert.equal(patrick?.gender, "male");
  assert.ok(patrick && MALE_VOICES.has(patrick.voice));
  assert.equal(new Set(bound.map((s) => s.voice)).size, bound.length);
});

test("Mock #1 S2 and S4 stay single-speaker monologues", () => {
  const parts = getListeningPartsForMock(1);
  for (const idx of [1, 3] as const) {
    const transcript = parts[idx].blocks.map((b) => b.transcript).join("\n");
    const bound = bindSpeakersForMultiVoice(
      transcript,
      parts[idx].partNumber,
      parts[idx].speakers
    );
    assert.equal(bound.length, 1, `Section ${parts[idx].partNumber} monologue`);
  }
});

test("Section 2 Q11-17 plan/map uses letter-from-box answers", () => {
  const parts = getListeningPartsForMock(1);
  const questions = parts[1].questions.filter((q) => q.number >= 11 && q.number <= 17);
  const block = parts[1].blocks.find((b) => b.questionStart === 11)!;
  assert.equal(block.questionType, "plan-map-diagram");
  assert.ok(block.mapVisual?.locations?.length, "map visual required");
  assert.equal(block.mapVisual?.kind, "map");
  const effective = resolveEffectiveBlockType(questions, "plan-map-diagram");
  assert.equal(effective, "plan-map-diagram");
  for (const q of questions) {
    assert.ok((q.options?.length ?? 0) >= 8, `Q${q.number} needs option box`);
    assert.match(String(q.correct), /^[A-J]$/i, `Q${q.number} letter answer`);
  }
  const ui = adaptMockQuestionsForUi(questions, effective, block);
  assert.equal(ui[0].type, "plan-map-diagram");
  assert.ok((ui[0].options?.length ?? 0) >= 8);
});

test("prep banner syncs spoken seconds with on-screen countdown", () => {
  assert.equal(
    syncPrepMessageSeconds("You have 30 seconds to look at Questions 11 to 17.", 21),
    "You have 21 seconds to look at Questions 11 to 17."
  );
});

test("plan-map-diagram label is Map Labelling (not plan/diagram slash label)", () => {
  assert.equal(formatQuestionTypeLabel("plan-map-diagram"), "Map Labelling");
});

test("Section 3 flowchart uses gap-fill on all curated mocks", () => {
  for (let mock = 1; mock <= 5; mock += 1) {
    const parts = getListeningPartsForMock(mock);
    const questions = parts[2].questions.filter((q) => q.number >= 26 && q.number <= 30);
    for (const q of questions) {
      assert.equal(q.type, "flowchart", `mock ${mock} Q${q.number}`);
      assert.equal(q.options?.length ?? 0, 0, `mock ${mock} Q${q.number} no options`);
      assert.ok(String(q.correct).length > 0);
    }
  }
});

test("Section 4 has three audio blocks (summary / diagram / notes)", () => {
  for (let mock = 1; mock <= 5; mock += 1) {
    const parts = getListeningPartsForMock(mock);
    const s4 = parts[3];
    assert.equal(s4.blocks.length, 3, `mock ${mock} S4 blocks`);
    assert.equal(s4.blocks[0].questionStart, 31);
    assert.equal(s4.blocks[0].questionEnd, 33);
    assert.equal(s4.blocks[1].questionStart, 34);
    assert.equal(s4.blocks[1].questionEnd, 36);
    assert.equal(s4.blocks[2].questionStart, 37);
    assert.equal(s4.blocks[2].questionEnd, 40);
    assert.equal(s4.blocks[0].questionType, "summary-completion");
    assert.equal(s4.blocks[1].questionType, "diagram-labelling");
    assert.equal(s4.blocks[2].questionType, "note-completion");
  }
});

test("all curated mocks S1 have letter-spelling + self-correction", () => {
  for (let mock = 1; mock <= 5; mock += 1) {
    const parts = getListeningPartsForMock(mock);
    const transcript = parts[0].blocks.map((b) => b.transcript).join("\n");
    assert.ok(SPELLING_PATTERN.test(transcript), `Mock ${mock} S1 spelling`);
    assert.ok(
      SELF_CORRECTION_PATTERN.test(transcript),
      `Mock ${mock} S1 self-correction`
    );
    // Curated mocks are multi-block (breaks live between blocks); full-section
    // word/filler/SECTION BREAK rules apply to live-generated single scripts.
    const check = validateListeningAuthenticity(transcript, 1, {
      requireSectionBreak: false,
      requireMinWords: false,
      requireFillers: false,
    });
    assert.equal(check.ok, true, `Mock ${mock}: ${check.errors.join("; ")}`);
  }
});

test("all curated mocks S2 map blocks include lettered mapVisual", () => {
  for (let mock = 1; mock <= 5; mock += 1) {
    const parts = getListeningPartsForMock(mock);
    const block = parts[1].blocks.find((b) => b.questionStart === 11);
    assert.ok(block, `mock ${mock} Q11 block`);
    assert.equal(block!.questionType, "plan-map-diagram");
    assert.ok(
      (block!.mapVisual?.locations?.length ?? 0) >= 8,
      `mock ${mock} map visual`
    );
  }
});

test("all curated mocks S3 include self-correction of a tested detail", () => {
  for (let mock = 1; mock <= 5; mock += 1) {
    const parts = getListeningPartsForMock(mock);
    const transcript = parts[2].blocks.map((b) => b.transcript).join("\n");
    assert.ok(
      SELF_CORRECTION_PATTERN.test(transcript),
      `Mock ${mock} S3 self-correction`
    );
  }
});

test("official flexible answer keys accept alternates and optional parts", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { checkListeningAnswer } = require("../lib/checkListeningAnswer.js") as {
    checkListeningAnswer: (a: string, b: string) => boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { scoreEitherOrderGroup } = require("../lib/listeningFlexibleAnswers.js") as {
    scoreEitherOrderGroup: (a: string[], b: string[]) => boolean[];
  };
  assert.equal(checkListeningAnswer("9.30", "9.30 (am)"), true);
  assert.equal(checkListeningAnswer("9:30 am", "9.30 (am)/9:30 (am)"), true);
  assert.equal(checkListeningAnswer("Central St", "Central Street/St"), true);
  assert.equal(checkListeningAnswer("792", "(number/no./#) 792"), true);
  assert.equal(checkListeningAnswer("no. 792", "(number/no./#) 792"), true);
  assert.equal(checkListeningAnswer("first year", "first/1st year"), true);
  assert.equal(checkListeningAnswer("1st year", "first/1st year"), true);
  assert.equal(checkListeningAnswer("dark to light", "dark(ness) to light(ness)"), true);
  assert.equal(checkListeningAnswer("darkness to lightness", "dark(ness) to light(ness)"), true);
  assert.equal(checkListeningAnswer("B", "B"), true);
  assert.equal(checkListeningAnswer("motivation", "motivations/motivation"), true);
  assert.equal(checkListeningAnswer("65", "65/sixty-five"), true);
  assert.equal(checkListeningAnswer("sixty-five", "65/sixty-five"), true);
  assert.equal(checkListeningAnswer("sixty five", "65/sixty-five"), true);
  assert.equal(checkListeningAnswer("30 pounds", "£30/30 pounds/thirty pounds"), true);
  assert.equal(checkListeningAnswer("£30", "£30/30 pounds/thirty pounds"), true);
  assert.equal(checkListeningAnswer("thirty pounds", "£30/30 pounds/thirty pounds"), true);
  assert.equal(checkListeningAnswer("1.25 m", "1.25 metres/1.25 m"), true);
  assert.equal(checkListeningAnswer("keywords", "key words/keywords"), true);
  assert.equal(checkListeningAnswer("manuscript", "(the) manuscript"), true);
  assert.equal(checkListeningAnswer("E,D", "D,E"), true);
  assert.deepEqual(scoreEitherOrderGroup(["E", "D"], ["D", "E"]), [true, true]);
  assert.deepEqual(scoreEitherOrderGroup(["D", "A"], ["D", "E"]), [true, false]);
});

test("answer validation engine enforces word limits and rich feedback", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {
    validateListeningAnswer,
    scoreListeningAnswersWithFeedback,
  } = require("../lib/listeningAnswerEngine.js") as {
    validateListeningAnswer: (input: object) => {
      correct: boolean;
      category: string;
      feedback: { whyIncorrect?: string; coachingNote?: string } | null;
    };
    scoreListeningAnswersWithFeedback: (
      a: string[],
      b: string[],
      m?: object[]
    ) => { score: number };
  };

  const overLimit = validateListeningAnswer({
    studentAnswer: "the free parking",
    correctAnswer: "parking",
    wordLimit: "ONE WORD ONLY",
  });
  assert.equal(overLimit.correct, false);
  assert.equal(overLimit.category, "word_limit");
  assert.ok(overLimit.feedback?.coachingNote);

  const either = scoreListeningAnswersWithFeedback(
    ["E", "D"],
    ["D", "E"],
    [{ eitherOrderGroup: "g" }, { eitherOrderGroup: "g" }]
  );
  assert.equal(either.score, 2);
});

console.log(failed ? `\n${failed} check(s) failed.\n` : "\nAll checks passed.\n");
process.exit(failed ? 1 : 0);
