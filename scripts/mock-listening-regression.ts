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

test("MockExamEngine renders MockListeningBlockPanel (regression guard)", () => {
  const src = readFileSync("components/mock-test/MockExamEngine.tsx", "utf8");
  assert.ok(src.includes("MockListeningBlockPanel"));
  assert.ok(src.includes("ListeningIeltsInstruction") === false);
  assert.ok(src.includes("buildMockListeningBlockHeader") === false);
  assert.ok(src.includes("getVisibleListeningBlockGroups"));
});

test("MockListeningBlockPanel includes section badge + instructions", () => {
  const src = readFileSync("components/mock-test/MockListeningBlockPanel.tsx", "utf8");
  assert.ok(src.includes("Section"));
  assert.ok(src.includes("ListeningIeltsInstruction"));
  assert.ok(src.includes("formTitle"));
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
  assert.equal(header.typeLabel, "Table Completion");
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

test("Section 1 Q6-10 renders as table-completion UI", () => {
  const parts = getListeningPartsForMock(1);
  const block = parts[0].blocks[1];
  const questions = parts[0].questions.filter((q) => q.number >= 6 && q.number <= 10);
  assert.equal(questions[0].type, "table");
  const ui = adaptMockQuestionsForUi(questions, "table-completion", block);
  assert.equal(ui[0].type, "table-completion");
  assert.ok(ui[0].tableHeaders?.includes("Item"));
});

test("Section 2 Q11-15 renders as multiple-choice with 3 options", () => {
  const parts = getListeningPartsForMock(1);
  const questions = parts[1].questions.filter((q) => q.number >= 11 && q.number <= 15);
  const effective = resolveEffectiveBlockType(questions, "multiple-choice");
  assert.equal(effective, "multiple-choice");
  for (const q of questions) {
    assert.equal(q.options?.length, 3, `Q${q.number} option count`);
  }
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

test("all curated mocks S1 have letter-spelling + self-correction", () => {
  for (let mock = 1; mock <= 5; mock += 1) {
    const parts = getListeningPartsForMock(mock);
    const transcript = parts[0].blocks.map((b) => b.transcript).join("\n");
    assert.ok(SPELLING_PATTERN.test(transcript), `Mock ${mock} S1 spelling`);
    assert.ok(
      SELF_CORRECTION_PATTERN.test(transcript),
      `Mock ${mock} S1 self-correction`
    );
    const check = validateListeningAuthenticity(transcript, 1);
    assert.equal(check.ok, true, `Mock ${mock}: ${check.errors.join("; ")}`);
  }
});

test("Mock #1–2 S3 include self-correction of a tested detail", () => {
  for (const mock of [1, 2]) {
    const parts = getListeningPartsForMock(mock);
    const transcript = parts[2].blocks.map((b) => b.transcript).join("\n");
    assert.ok(
      SELF_CORRECTION_PATTERN.test(transcript),
      `Mock ${mock} S3 self-correction`
    );
  }
});

console.log(failed ? `\n${failed} check(s) failed.\n` : "\nAll checks passed.\n");
process.exit(failed ? 1 : 0);
