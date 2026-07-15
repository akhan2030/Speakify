/**
 * Regression tests for Listening script ↔ audio ↔ question integrity.
 * Run: node scripts/listening-integrity-regression.mjs
 */

import assert from "node:assert/strict";
import {
  validateListeningIntegrity,
  answerSpokenInTranscript,
  normalizeListeningExample,
} from "../lib/listeningIntegrityValidator.js";
import {
  getTranscriptForGroupIndex,
  findAnswerEndIndex,
} from "../lib/listeningTranscriptSplit.js";
import {
  validateListeningAuthenticity,
  analyseAnswerSpacing,
} from "../lib/listeningAuthenticityContract.js";

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

const RICH_S1 = `
Speaker A: Good morning, Lakeside Cottages. How can I help you today?
Speaker B: Um, hello — I'd like to book Seaside Cottage for a short break, please.
Speaker A: Of course. Can I take your first name?
Speaker B: James.
Speaker A: And your surname?
Speaker B: Henderson — that's H-E-N-D-E-R-S-O-N.
Speaker A: Thank you. A contact telephone number?
Speaker B: Oh seven seven, zero zero, nine zero zero, one two three — so 07700 900123.
Speaker A: The weekend rate is three hundred and eighty pounds.
Speaker B: Three hundred and eighty?
Speaker A: Sorry — actually three hundred and fifty. I was looking at the bank-holiday tariff.
Speaker B: Three hundred and fifty — fine. My email is james at outlook.com.
Speaker A: How many nights will you stay?
Speaker B: Well, two nights should be enough.
[SECTION BREAK]
Speaker A: A few property details next, er, if that's alright.
Speaker B: What's the kitchen worktop made of?
Speaker A: It's solid oak — not laminate, though some photos look like that.
Speaker B: And the dining table seats how many?
Speaker A: Six normally. People sometimes ask for eight; we don't have that extension.
Speaker B: Deposit?
Speaker A: Sixty-five pounds — sixty-five — held until checkout.
Speaker B: Colour of the bedroom curtains?
Speaker A: Cream. A few guests say beige, but the inventory lists cream.
Speaker B: And the nearest shop?
Speaker A: On Harbour Street — that's Harbour, one word.
Speaker B: Perfect, thanks for clarifying everything so carefully for me today.
Speaker A: You're welcome — we'll send the confirmation shortly after this call ends.
`.repeat(2);

test("rejects Harbour City example when not spoken", () => {
  const r = validateListeningIntegrity(
    {
      transcript: RICH_S1,
      example: {
        questionText: "Destination?",
        answer: "Harbour City",
      },
      questions: [
        { questionNumber: 1, type: "form-completion", answer: "James" },
        { questionNumber: 2, type: "form-completion", answer: "Henderson" },
      ],
    },
    1,
    { requireExample: true }
  );
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /Harbour City|not spoken/i.test(e)));
});

test("accepts synced example + answers in transcript", () => {
  const r = validateListeningIntegrity(
    {
      transcript: RICH_S1,
      example: {
        questionText: "The cottage name is ....................... ?",
        answer: "Seaside Cottage",
      },
      questions: [
        { questionNumber: 1, type: "form-completion", answer: "James" },
        { questionNumber: 2, type: "form-completion", answer: "Henderson" },
        { questionNumber: 3, type: "form-completion", answer: "07700 900123" },
        { questionNumber: 4, type: "form-completion", answer: "james at outlook.com" },
        { questionNumber: 5, type: "form-completion", answer: "two" },
        { questionNumber: 6, type: "note-completion", answer: "oak" },
        { questionNumber: 7, type: "note-completion", answer: "sixty-five" },
        { questionNumber: 8, type: "note-completion", answer: "cream" },
        { questionNumber: 9, type: "note-completion", answer: "Harbour Street" },
        { questionNumber: 10, type: "note-completion", answer: "six" },
      ],
    },
    1,
    { requireExample: true }
  );
  assert.equal(r.valid, true, r.errors.join("; "));
});

test("flags missing name reply after What's your name?", () => {
  const thin = `
Speaker A: Hello and welcome to the booking line for our conference centre in town today with many details.
Speaker B: Hi I need to register for the weekend event please.
Speaker A: What's your name?
Speaker A: And your phone number please for the form today?
Speaker B: 07700 900111 thank you very much for your help with this booking.
[SECTION BREAK]
Speaker A: Now we cover kitchen oak deposit cream curtains and Harbour Street shop seating for six guests carefully with extra notes.
`.repeat(8);
  const r = validateListeningIntegrity(
    {
      transcript: thin,
      example: { questionText: "Event?", answer: "weekend" },
      questions: Array.from({ length: 10 }, (_, i) => ({
        questionNumber: i + 1,
        type: "form-completion",
        answer: "weekend",
      })),
    },
    1
  );
  assert.ok(r.errors.some((e) => /name reply|unanswerable/i.test(e)));
});

test("g0 audio excludes post-SECTION-BREAK dialogue", () => {
  const transcript = `Speaker A: Notes about clarity and consent form for ethics.
Speaker B: Review takes six weeks.
[SECTION BREAK]
Speaker A: Flow chart — submit application then peer review then revise draft.`;
  const groups = [
    { start: 21, end: 25, questions: [{ answer: "clarity" }, { answer: "six weeks" }] },
    { start: 26, end: 30, questions: [{ answer: "application" }, { answer: "revise" }] },
  ];
  const g0 = getTranscriptForGroupIndex(transcript, groups, 0);
  const g1 = getTranscriptForGroupIndex(transcript, groups, 1);
  assert.ok(g0.includes("clarity"));
  assert.ok(!g0.includes("Flow chart"));
  assert.ok(g1.includes("Flow chart"));
  assert.ok(!g1.includes("six weeks"));
});

test("group audio prefers SECTION BREAK over early answer match", () => {
  const transcript = `Speaker A: Welcome to the room lobby.
Speaker B: I need room details.
Speaker A: First name is Alex.
Speaker B: OK.
[SECTION BREAK]
Speaker A: The kitchen is oak and the deposit is sixty-five pounds on Harbour Street near cream curtains.`;
  const groups = [
    {
      start: 1,
      end: 5,
      questions: [{ answer: "Alex" }, { answer: "room" }],
    },
    {
      start: 6,
      end: 10,
      questions: [{ answer: "oak" }],
    },
  ];
  const g0 = getTranscriptForGroupIndex(transcript, groups, 0);
  assert.ok(g0.includes("Alex"));
  assert.ok(!g0.includes("sixty-five"), "g0 must not include part 2 dialogue");
  assert.ok(g0.includes("Welcome"));
});

test("findAnswerEndIndex prefers later match after afterIndex", () => {
  const t = "We have a room ready. Later the answer is room seven.";
  const early = findAnswerEndIndex(t, "room", { preferLast: false });
  const late = findAnswerEndIndex(t, "room", {
    afterIndex: 20,
    preferLast: true,
  });
  assert.ok(early > 0);
  assert.ok(late > early);
});

test("normalizeListeningExample strips empty answers", () => {
  assert.equal(normalizeListeningExample({ questionText: "x", answer: "" }), null);
  assert.equal(
    normalizeListeningExample({ questionText: "Q?", answer: "York" })?.answer,
    "York"
  );
});

test("answerSpokenInTranscript accepts flexible keys", () => {
  assert.equal(
    answerSpokenInTranscript("sixty-five/65", "The deposit is sixty-five pounds"),
    true
  );
});

test("authenticity rejects missing self-correction and fillers on S1", () => {
  const bare = "Speaker A: Hello. Speaker B: Hi. [SECTION BREAK] Speaker A: Bye.";
  const r = validateListeningAuthenticity(bare, 1);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /self-correction|filler|short|spell/i.test(e)));
});

test("answer spacing detects packed answers", () => {
  const packed =
    "Speaker A: The answers are oak sixty-five cream Harbour Street six tonight.";
  const spacing = analyseAnswerSpacing(packed, [
    { answer: "oak" },
    { answer: "sixty-five" },
    { answer: "cream" },
  ]);
  assert.ok(spacing.errors.length > 0);
});

console.log(failed ? `\n${failed} check(s) failed.\n` : "\nAll checks passed.\n");
process.exit(failed ? 1 : 0);
