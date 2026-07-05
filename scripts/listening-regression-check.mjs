/**
 * Listening content regression checks (run: npm run test:listening)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSectionQuestionBlocks } from "../lib/listeningSectionTypes.js";
import {
  assertNoQuestionZeroInUserText,
  assertSectionBlockRanges,
  formatSpokenQuestionRange,
  scanUserFacingCopy,
  validateFullMockPayload,
  validateInstructionRangesForSection,
  validateListeningSectionPayload,
  validateSection1SpeakerNamesNotOverused,
  validateSpeakerGenders,
} from "../lib/listeningUserFacingValidation.js";
import { getDefaultSpeakersForSection } from "../lib/listeningSpeakerProfiles.js";
import {
  isOverusedSection1SpeakerName,
  pickSection1SpeakerPair,
  pickSection1Topic,
  SECTION1_SCENARIOS,
  transcriptHasBannedNames,
} from "../lib/listeningSection1Diversity.js";
import {
  applySpeakerIdentitiesToPayload,
  validateSpeakerIdentities,
  voiceMatchesOpenAiGender,
} from "../lib/listeningSpeakerIdentity.js";
import { normalizeSectionQuestions } from "../lib/listeningSectionNormalize.js";
import {
  coalesceQuestionAnswer,
  hydrateListeningQuestionsFromPayload,
  isListeningPlaceholderQuestion,
  normalizeListeningMcqOptions,
  validateListeningQuestionContent,
} from "../lib/listeningQuestionContent.js";
import { isListeningUnlimitedEnabled } from "../lib/listeningDailyLimit.js";

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

console.log("Listening regression checks\n");

test("Section 1 blocks are 1–5 and 6–10", () => {
  const blocks = getSectionQuestionBlocks(1);
  assert.equal(blocks[0].start, 1);
  assert.equal(blocks[0].end, 5);
  assert.equal(blocks[1].start, 6);
  assert.equal(blocks[1].end, 10);
});

test("Section 4 blocks are 31–35 and 36–40", () => {
  const blocks = getSectionQuestionBlocks(4);
  assert.equal(blocks[0].start, 31);
  assert.equal(blocks[1].end, 40);
});

for (let s = 1; s <= 4; s += 1) {
  test(`Section ${s} block ranges valid`, () => {
    assertSectionBlockRanges(s);
  });
}

test("formatSpokenQuestionRange uses one-based wording", () => {
  assert.equal(formatSpokenQuestionRange(1, 5), "questions 1 to 5");
  assert.equal(formatSpokenQuestionRange(6, 10), "questions 6 to 10");
  assert.equal(formatSpokenQuestionRange(0, 4), "questions 1 to 5");
});

test("reject question 0 in user-facing copy", () => {
  assert.throws(() =>
    assertNoQuestionZeroInUserText(
      "First, you have some time to look at questions 0 to 4."
    )
  );
  assert.throws(() =>
    assertNoQuestionZeroInUserText("Look at question 0")
  );
});

test("scanUserFacingCopy flags zero-based ranges", () => {
  const issues = scanUserFacingCopy("Questions 0–4");
  assert.ok(issues.length > 0);
});

test("canonical speakers match gender", () => {
  for (let s = 1; s <= 4; s += 1) {
    const check = validateSpeakerGenders(
      getDefaultSpeakersForSection(s),
      s
    );
    assert.ok(check.valid, check.errors.join("; "));
  }
});

test("Section 1 defaults avoid overused names", () => {
  const s1 = getDefaultSpeakersForSection(1);
  for (const sp of s1) {
    assert.ok(!isOverusedSection1SpeakerName(sp.name), sp.name);
  }
});

test("pickSection1SpeakerPair returns gender-matched names", () => {
  const { speakers, pairKey } = pickSection1SpeakerPair({
    excludePairKeys: [],
    excludeNames: [],
    preferPairType: "female_male",
  });
  assert.equal(speakers.length, 2);
  assert.equal(speakers[0].gender, "female");
  assert.equal(speakers[1].gender, "male");
  assert.ok(pairKey.includes(speakers[0].name.toLowerCase()));
  const check = validateSection1SpeakerNamesNotOverused(speakers);
  assert.ok(check.valid, check.errors.join("; "));
});

test("pickSection1SpeakerPair excludes prior pair", () => {
  const first = pickSection1SpeakerPair();
  const second = pickSection1SpeakerPair({
    excludePairKeys: [first.pairKey],
    excludeNames: first.speakers.map((s) => s.name),
  });
  assert.notEqual(first.pairKey, second.pairKey);
});

test("pickSection1Topic avoids excluded scenarios", () => {
  const t1 = SECTION1_SCENARIOS[0];
  const t2 = pickSection1Topic([t1]);
  assert.notEqual(t2.toLowerCase(), t1.toLowerCase());
});

test("Section 1 opening instruction text (mock announcer)", () => {
  const blocks = getSectionQuestionBlocks(1);
  const firstRange = formatSpokenQuestionRange(blocks[0].start, blocks[0].end);
  const script = `This is the IELTS Listening test. Section 1. You will hear a conversation between two people. First, you have some time to look at ${firstRange}.`;
  assert.ok(script.includes("questions 1 to 5"), script);
  assertNoQuestionZeroInUserText(script);
});

test("Section 1 second prep instruction text", () => {
  const blocks = getSectionQuestionBlocks(1);
  const lead = `Now, you have some time to look at ${formatSpokenQuestionRange(
    blocks[1].start,
    blocks[1].end
  )}.`;
  assert.ok(lead.includes("questions 6 to 10"), lead);
  assertNoQuestionZeroInUserText(lead);
});

for (let s = 1; s <= 4; s += 1) {
  test(`Section ${s} instruction ranges 1–5 / 6–10 (S1) or global blocks`, () => {
    const check = validateInstructionRangesForSection(s);
    assert.ok(check.valid, check.errors.join("; "));
  });
}

function sampleQuestionText(sectionNumber, questionNumber, type) {
  if (type === "form-completion") {
    const labels = [
      "Customer name:",
      "Phone number:",
      "Check-in date:",
      "Room type:",
      "Total price:",
    ];
    const idx = (questionNumber - 1) % labels.length;
    return labels[idx];
  }
  if (type === "table-completion" || type === "note-completion") {
    return `Detail for booking point ${questionNumber}:`;
  }
  if (type === "multiple-choice") {
    return `What is mentioned about topic ${questionNumber}?`;
  }
  if (type === "matching") {
    return `Match feature ${questionNumber} to the list`;
  }
  return `Complete the gap for question ${questionNumber} ___`;
}

test("reject Item N placeholder labels", () => {
  assert.ok(
    isListeningPlaceholderQuestion({
      questionNumber: 1,
      type: "form-completion",
      text: "Item 1:",
      answer: "Smith",
    })
  );
  assert.ok(
    !isListeningPlaceholderQuestion({
      questionNumber: 1,
      type: "form-completion",
      text: "Customer name:",
      answer: "Smith",
    })
  );
});

test("coalesce question field into text", () => {
  const normalized = normalizeSectionQuestions(
    [
      {
        id: 1,
        questionNumber: 1,
        type: "form-completion",
        question: "Contact number:",
        answer: "555-0100",
      },
    ],
    1
  );
  assert.equal(normalized[0].text, "Contact number:");
});

test("reject bank row with missing question slots", () => {
  const bad = {
    speakers: getDefaultSpeakersForSection(1),
    transcript: "Speaker A: Hello, the name is James.",
    questions: normalizeSectionQuestions([], 1),
  };
  const check = validateListeningSectionPayload(bad, 1);
  assert.ok(!check.valid, check.errors.join("; "));
});

test("full mock scaffold has 40 questions Q1–40", () => {
  const sections = {};
  for (let s = 1; s <= 4; s += 1) {
    const start = (s - 1) * 10 + 1;
    const blocks = getSectionQuestionBlocks(s);
    sections[s] = {
      section: s,
      speakers: getDefaultSpeakersForSection(s),
      transcript: `Section ${s} sample transcript with enough spoken detail for answers.`,
      questions: normalizeSectionQuestions(
        Array.from({ length: 10 }, (_, i) => {
          const questionNumber = start + i;
          const block = blocks.find(
            (b) => questionNumber >= b.start && questionNumber <= b.end
          );
          const type = block?.type ?? "note-completion";
          return {
            id: i + 1,
            questionNumber,
            type,
            text: sampleQuestionText(s, questionNumber, type),
            answer: "sample",
            options:
              type === "multiple-choice"
                ? [
                    { label: "A", text: "First detail from audio" },
                    { label: "B", text: "Second detail from audio" },
                    { label: "C", text: "Third detail from audio" },
                  ]
                : [],
          };
        }),
        s
      ),
    };
  }
  const check = validateFullMockPayload(sections);
  assert.ok(check.valid, check.errors.join("; "));
});

test("validateListeningQuestionContent rejects generic MCQ options", () => {
  const check = validateListeningQuestionContent([
    {
      questionNumber: 11,
      type: "multiple-choice",
      text: "What is the main topic?",
      answer: "A",
      options: [
        { label: "A", text: "Option A" },
        { label: "B", text: "Option B" },
        { label: "C", text: "Option C" },
      ],
    },
  ]);
  assert.ok(!check.valid);
});

test("normalize string-array MCQ options for UI", () => {
  const normalized = normalizeListeningMcqOptions([
    "Qualitative analysis",
    "B. Mixed methods",
    "C. Case study approach",
  ]);
  assert.equal(normalized[0].label, "A");
  assert.equal(normalized[0].text, "Qualitative analysis");
  assert.equal(normalized[1].label, "B");
  assert.equal(normalized[1].text, "Mixed methods");
});

test("normalize reading-style { key, label } MCQ options", () => {
  const normalized = normalizeListeningMcqOptions([
    { key: "A", label: "Emma's climate policy focus" },
    { key: "B", label: "Urban transport models" },
    { key: "C", label: "Renewable grid storage" },
  ]);
  assert.equal(normalized[0].text, "Emma's climate policy focus");
  assert.equal(normalized[1].label, "B");
});

test("normalizeSectionQuestions coerces bank MCQ strings", () => {
  const normalized = normalizeSectionQuestions(
    [
      {
        id: 1,
        questionNumber: 21,
        type: "multiple-choice",
        text: "What is Emma's dissertation topic?",
        answer: "A",
        options: [
          "Urban heat islands",
          "Coastal erosion patterns",
          "Public transport usage",
        ],
      },
    ],
    3
  );
  const mcq = normalized.find((q) => q.questionNumber === 21);
  assert.ok(mcq);
  assert.equal(mcq.options[0].label, "A");
  assert.equal(mcq.options[0].text, "Urban heat islands");
  assert.ok(!isListeningPlaceholderQuestion(mcq));
});

test("reject MCQ with empty option text after normalization", () => {
  const normalized = normalizeSectionQuestions(
    [
      {
        questionNumber: 21,
        type: "multiple-choice",
        text: "What methodology does Tom consider?",
        answer: "B",
        options: [{ label: "A" }, { label: "B" }, { label: "C" }],
      },
    ],
    3
  );
  const mcq = normalized.find((q) => q.questionNumber === 21);
  assert.ok(isListeningPlaceholderQuestion(mcq));
  const check = validateListeningQuestionContent([mcq], 3);
  assert.ok(!check.valid);
});

test("MCQ instructions default to single-answer A/B/C", () => {
  const src = readFileSync(
    new URL("../lib/listeningIeltsInstructions.ts", import.meta.url),
    "utf8"
  );
  assert.ok(src.includes("chooseCount ?? 1"));
});

test("all section question types normalize without empty MCQ labels", () => {
  for (let section = 1; section <= 4; section += 1) {
    const blocks = getSectionQuestionBlocks(section);
    for (const block of blocks) {
      if (block.type !== "multiple-choice") continue;
      const start = block.start;
      const normalized = normalizeSectionQuestions(
        [
          {
            questionNumber: start,
            type: "multiple-choice",
            text: `Sample question ${start}?`,
            answer: "A",
            options: ["First answer", "Second answer", "Third answer"],
          },
        ],
        section
      );
      const mcq = normalized.find((q) => q.questionNumber === start);
      assert.ok(mcq, `section ${section} MCQ missing`);
      assert.ok(
        mcq.options.every((opt) => opt.label && opt.text),
        `section ${section} MCQ option text missing`
      );
    }
  }
});

test("coalesce correct_answer and object-map MCQ options", () => {
  const hydrated = hydrateListeningQuestionsFromPayload(
    [
      {
        questionNumber: 21,
        type: "multiple-choice",
        text: "What main topic did Natalie suggest?",
        correct_answer: "A",
        options: {
          A: "Urban planning",
          B: "Climate policy",
          C: "Transport models",
        },
      },
      {
        questionNumber: 26,
        type: "matching",
        text: "Match the meeting day",
      },
    ],
    { 26: "C", 27: "B" }
  );
  assert.equal(hydrated[0].answer, "A");
  const normalized = normalizeSectionQuestions(hydrated, 3);
  const mcq = normalized.find((q) => q.questionNumber === 21);
  const match = normalized.find((q) => q.questionNumber === 26);
  assert.equal(mcq?.options?.[0]?.text, "Urban planning");
  assert.ok(!isListeningPlaceholderQuestion(mcq));
  assert.equal(coalesceQuestionAnswer(match), "C");
});

test("unwrap nested MCQ option text objects (no [object Object])", () => {
  const normalized = normalizeListeningMcqOptions([
    { label: "A", text: { text: "She found the deadline too short" } },
    { letter: "B", text: "Mixed methods approach" },
    { label: "C", text: { label: "Case study analysis" } },
  ]);
  assert.equal(normalized[0].text, "She found the deadline too short");
  assert.equal(normalized[1].text, "Mixed methods approach");
  assert.equal(normalized[2].text, "Case study analysis");
  assert.ok(!normalized.some((opt) => opt.text === "[object Object]"));
});

test("reject MCQ options that still coerce to [object Object]", () => {
  const bad = normalizeSectionQuestions(
    [
      {
        questionNumber: 22,
        type: "multiple-choice",
        text: "What methodology does Tom consider?",
        answer: "A",
        options: [{ label: "A", text: { nested: { broken: true } } }],
      },
    ],
    3
  );
  const mcq = bad.find((q) => q.questionNumber === 22);
  assert.ok(isListeningPlaceholderQuestion(mcq));
});

test("unlimited tests enabled by default", () => {
  const prev = process.env.LISTENING_ENFORCE_DAILY_LIMITS;
  delete process.env.LISTENING_ENFORCE_DAILY_LIMITS;
  assert.equal(isListeningUnlimitedEnabled(), true);
  process.env.LISTENING_ENFORCE_DAILY_LIMITS = prev;
});

test("reject wrong-gender speaker in payload", () => {
  const bad = {
    speakers: [
      { label: "Speaker A", name: "Emily Roberts", gender: "male", voice: "onyx" },
      { label: "Speaker B", name: "James Carter", gender: "female", voice: "nova" },
    ],
    transcript: "Speaker A: Hello.",
    questions: normalizeSectionQuestions([], 1),
  };
  const check = validateListeningSectionPayload(bad, 1);
  assert.ok(!check.valid);
});

test("reject overused Section 1 speaker names", () => {
  const bad = {
    speakers: [
      { label: "Speaker A", name: "David Mitchell", gender: "male", voice: "onyx" },
      { label: "Speaker B", name: "Sarah Johnson", gender: "female", voice: "nova" },
    ],
    transcript: "Speaker A: Hello.",
    questions: normalizeSectionQuestions([], 1),
  };
  const check = validateListeningSectionPayload(bad, 1);
  assert.ok(!check.valid);
});

test("normalizeSpeakersFromPayload rejects banned API names", async () => {
  const { normalizeSpeakersFromPayload } = await import(
    "../lib/listeningSpeakerProfiles.js"
  );
  const out = normalizeSpeakersFromPayload(
    [
      { label: "Speaker A", name: "Sarah Mitchell", gender: "female" },
      { label: "Speaker B", name: "Sarah Johnson", gender: "female" },
    ],
    1
  );
  assert.ok(!out.some((s) => /sarah\s+(mitchell|johnson)/i.test(s.displayName ?? s.name)));
});

test("applySpeakerIdentitiesToPayload removes Sarah from transcript", () => {
  const fixed = applySpeakerIdentitiesToPayload(
    {
      section: 1,
      testId: "test-1",
      speakers: [
        { label: "Speaker A", name: "Sarah Mitchell", gender: "male" },
        { label: "Speaker B", name: "Sarah Johnson", gender: "female" },
      ],
      transcript:
        "Speaker A: Hello, I'm Sarah Mitchell from reception.\nSpeaker B: Hi, Sarah Johnson here.",
    },
    { testSeed: "bank-row-101", source: "test" }
  );
  assert.ok(!transcriptHasBannedNames(fixed.transcript));
  const check = validateSpeakerIdentities(fixed.speakers, 1);
  assert.ok(check.valid, check.errors.join("; "));
  assert.notEqual(
    fixed.speakers[0].displayName.toLowerCase(),
    fixed.speakers[1].displayName.toLowerCase()
  );
});

test("deterministic testSeed yields stable pair per row", () => {
  const a = pickSection1SpeakerPair({ testSeed: "bank-row-42" });
  const b = pickSection1SpeakerPair({ testSeed: "bank-row-42" });
  assert.equal(a.pairKey, b.pairKey);
  const c = pickSection1SpeakerPair({ testSeed: "bank-row-43" });
  assert.notEqual(a.pairKey, c.pairKey);
});

test("male voice only for male gender", () => {
  assert.ok(voiceMatchesOpenAiGender("onyx", "male"));
  assert.ok(!voiceMatchesOpenAiGender("nova", "male"));
  assert.ok(voiceMatchesOpenAiGender("shimmer", "female"));
  assert.ok(!voiceMatchesOpenAiGender("echo", "female"));
});

test("scrub sarah.mitchell@email.com from transcript and answers", async () => {
  const { contentHasBannedEmails, emailFromDisplayName } = await import(
    "../lib/listeningSpeakerEmails.js"
  );
  const fixed = applySpeakerIdentitiesToPayload(
    {
      section: 1,
      testId: "test-email",
      speakers: [
        { label: "Speaker A", name: "James Carter", gender: "male", role: "staff" },
        { label: "Speaker B", name: "Emily Roberts", gender: "female", role: "customer" },
      ],
      transcript: "Speaker B: My email is sarah.mitchell@email.com for the form.",
      questions: [
        {
          questionNumber: 3,
          type: "form-completion",
          text: "Email:",
          answer: "sarah.mitchell@email.com",
          options: [],
        },
      ],
    },
    { testSeed: "bank-row-email-1", source: "test" }
  );
  const expected = emailFromDisplayName("Emily Roberts");
  assert.ok(!contentHasBannedEmails(fixed.transcript));
  assert.ok(!contentHasBannedEmails(fixed.questions[0].answer));
  assert.equal(fixed.questions[0].answer, expected);
  assert.ok(fixed.transcript.includes(expected));
});

test("speaker identities use distinct voiceIds for two speakers", () => {
  const { speakers } = applySpeakerIdentitiesToPayload(
    { section: 1, speakers: [], transcript: "Speaker A: Hi.\nSpeaker B: Hello." },
    { testSeed: "bank-row-99", source: "test" }
  );
  assert.equal(speakers.length, 2);
  assert.notEqual(speakers[0].voiceId, speakers[1].voiceId);
  assert.notEqual(speakers[0].voice, speakers[1].voice);
});

console.log(failed ? `\n${failed} check(s) failed.\n` : "\nAll checks passed.\n");
process.exit(failed ? 1 : 0);
