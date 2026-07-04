/**
 * Speaking pipeline regression suite.
 *
 * Covers failures that have been fixed and then silently undone by later refactors:
 *  (1) junk-audio / YouTube-outro rejection
 *  (2) Part 2 → Part 3 topic alignment
 *  (3) mic auto-arm eligibility
 *  (4) session-end mic disarm (closing phrases)
 *
 * Run after ANY change to the speaking recording / turn-taking / validation path:
 *   npm run test:speaking
 */

import assert from "node:assert/strict";
import {
  extractStudentSpeech,
  hasValidSpeechInput,
  isLikelyRealStudentSpeech,
} from "../lib/speaking/validateSpeechInput.ts";
import {
  isSpeakingTestClosing,
  shouldAutoArmTurn,
} from "../lib/speaking/sessionMicPolicy.ts";
import {
  buildPart3GenerationPrompt,
  buildPart3TransitionSpeech,
  fallbackPart3Questions,
} from "../lib/speaking/part3Generation.ts";

let failures = 0;

function check(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS  ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL  ${label}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

// ─── (1) Junk-audio rejection ───────────────────────────────────────────────

console.log("\n(1) Junk-audio / fake-answer rejection");

const JUNK_PHRASES = [
  "Thank you for watching!",
  "Thank you for watching",
  "thanks for watching",
  "Thank you so much for watching",
  "please subscribe",
  "like and subscribe",
  "don't forget to subscribe",
  "see you in the next video",
  "hit the like button",
  "comment below",
];

for (const phrase of JUNK_PHRASES) {
  check(`rejects: ${JSON.stringify(phrase)}`, () => {
    const result = isLikelyRealStudentSpeech(phrase);
    assert.equal(result.ok, false, `expected reject, got ok=true for: ${phrase}`);
    assert.match(String(result.reason), /background|headphones|media|video|TV/i);
  });
}

check("accepts a real Part 1 answer", () => {
  const result = isLikelyRealStudentSpeech(
    "I usually spend my weekends with my family and we often go to the park."
  );
  assert.equal(result.ok, true);
});

check("rejects examiner echo", () => {
  const result = isLikelyRealStudentSpeech("Thank you.");
  assert.equal(result.ok, false);
});

check("session score-gate rejects transcript of only junk", () => {
  const transcript = [
    { role: "student", text: "Thank you for watching!", part: 1 },
    { role: "student", text: "please subscribe", part: 1 },
    { role: "student", text: "like and subscribe", part: 1 },
  ];
  const validation = hasValidSpeechInput({
    transcript,
    speakingTimeSeconds: 60,
    practiceMode: false,
  });
  assert.equal(validation.valid, false);
  const extracted = extractStudentSpeech(transcript);
  assert.equal(extracted.wordCount, 0);
  assert.ok(extracted.rejectedCount >= 3);
});

check("session score-gate ignores junk mixed with real speech for word count", () => {
  const transcript = [
    { role: "student", text: "Thank you for watching!", part: 1 },
    {
      role: "student",
      text: "I enjoy reading novels because they help me relax after a long day at work and school.",
      part: 1,
    },
    {
      role: "student",
      text: "On weekends I usually visit my grandparents and we cook traditional food together at home.",
      part: 1,
    },
  ];
  const extracted = extractStudentSpeech(transcript);
  assert.equal(extracted.rejectedCount, 1);
  assert.ok(extracted.substantiveAnswers >= 2);
  assert.ok(!extracted.text.toLowerCase().includes("watching"));
});

// ─── (2) Part 2 / Part 3 topic alignment ────────────────────────────────────

console.log("\n(2) Part 2 → Part 3 topic alignment");

const CUE_CARD = {
  id: "cue-tech",
  title: "A piece of technology you use",
  prompt: "Describe a piece of technology you use often.",
  bullets: ["what it is", "how you use it", "why it is useful"],
};

check("Part 3 transition speech names the cue-card topic", () => {
  const speech = buildPart3TransitionSpeech(
    CUE_CARD,
    "How has technology changed the way people communicate?"
  );
  assert.match(speech, /piece of technology you use/i);
  assert.match(speech, /end of Part 2/i);
  assert.match(speech, /Part 3/i);
  // Must not jump into an unrelated default topic (old PART3_QUESTIONS bug).
  assert.doesNotMatch(speech, /\b(environment|climate change|pollution)\b/i);
});

check("Part 3 generation prompt is anchored to the cue card", () => {
  const prompt = buildPart3GenerationPrompt(
    CUE_CARD,
    "I use my smartphone every day for work and study.",
    "ielts_academic"
  );
  assert.match(prompt, /A piece of technology you use/);
  assert.match(prompt, /Stay thematically connected/);
  assert.match(prompt, /Do NOT ask about a completely different subject/);
  assert.doesNotMatch(prompt, /PART3_QUESTIONS/);
});

check("fallback Part 3 questions stay on the cue-card theme", () => {
  const questions = fallbackPart3Questions(CUE_CARD);
  assert.ok(questions.length >= 3);
  const joined = questions.join(" ").toLowerCase();
  // Fallback should reference technology / the topic, not a hard-coded unrelated bucket.
  assert.ok(
    /technolog|device|digital|phone|computer|internet/.test(joined) ||
      /piece of technology/.test(joined),
    `fallback questions look off-topic: ${joined}`
  );
});

// ─── (3) Mic auto-arm eligibility ───────────────────────────────────────────

console.log("\n(3) Mic auto-arm eligibility");

check("arms in active Part 1", () => {
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "active",
      processing: false,
      testEnded: false,
      currentPart: 1,
      part2Phase: "done",
    }),
    true
  );
});

check("arms in active Part 3", () => {
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "active",
      currentPart: 3,
      part2Phase: "done",
    }),
    true
  );
});

check("does NOT arm while idle / scoring", () => {
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "idle",
      currentPart: 1,
      part2Phase: "done",
    }),
    false
  );
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "scoring",
      currentPart: 1,
      part2Phase: "done",
    }),
    false
  );
});

check("does NOT arm during Part 2 speaking (separate MediaRecorder path)", () => {
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "active",
      currentPart: 2,
      part2Phase: "speaking",
    }),
    false
  );
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "active",
      currentPart: 2,
      part2Phase: "prep",
    }),
    false
  );
});

check("does NOT arm while processing or after test ended", () => {
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "active",
      processing: true,
      currentPart: 1,
      part2Phase: "done",
    }),
    false
  );
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "active",
      testEnded: true,
      currentPart: 3,
      part2Phase: "done",
    }),
    false
  );
});

// ─── (4) Session-end mic disarm ─────────────────────────────────────────────

console.log("\n(4) Session-end mic disarm");

const CLOSING_PHRASES = [
  "That is the end of the speaking test. Thank you.",
  "This is the end of the speaking test.",
  "Have a nice day.",
  "Have a good day and goodbye.",
  "Goodbye.",
];

for (const phrase of CLOSING_PHRASES) {
  check(`closing phrase detected: ${JSON.stringify(phrase.slice(0, 40))}…`, () => {
    assert.equal(isSpeakingTestClosing(phrase), true);
  });
}

check("normal examiner questions are not closing phrases", () => {
  assert.equal(
    isSpeakingTestClosing("Let's talk about your hometown. Do you like living there?"),
    false
  );
  assert.equal(
    isSpeakingTestClosing("We've been talking about technology. Do people rely on it too much?"),
    false
  );
});

check("closing phrase implies auto-arm must stay off", () => {
  const closing = "That is the end of the speaking test. Have a nice day.";
  assert.equal(isSpeakingTestClosing(closing), true);
  assert.equal(
    shouldAutoArmTurn({
      sessionStatus: "active",
      testEnded: true,
      currentPart: 3,
      part2Phase: "done",
    }),
    false
  );
});

// ─── Summary ────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\nspeaking-pipeline-regression: ${failures} failure(s)\n`);
  process.exit(1);
}

console.log("\nspeaking-pipeline-regression: PASS\n");
