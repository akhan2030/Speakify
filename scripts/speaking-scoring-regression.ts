/**
 * Regression checks for speaking score evidence + vocabulary personalization.
 *
 * Planted-error transcript (pass/fail, not "does the AI sound smart"):
 * - Grammar: "I am living here since three years", "I go to the restaurant yesterday"
 * - Lexical: "very unique", repeated "good" / "nice"
 * - Must NOT recycle "My name is Aman Khan" as evidence for every criterion
 *
 * Run: npm run test:speaking-scoring
 */

import assert from "node:assert/strict";
import {
  repairStructuredScoreEvidence,
  deriveVocabularyUpgrades,
  extractStudentUtterances,
} from "../lib/speaking/scoreEvidence.ts";
import type { StructuredSpeakingScore } from "../lib/speaking/scoringSchema.ts";

const PLANTED_TRANSCRIPT = [
  "[Part 1] My name is Aman Khan.",
  "[Part 1] I am living here since three years.",
  "[Part 1] The food was very unique and very good.",
  "[Part 1] I go to the restaurant yesterday.",
  "[Part 1] It is a nice place and the people are nice and good.",
  "[Part 1] I like the nightlife and I love it for its nightlife.",
].join("\n");

/** Simulates the old bug: every criterion cites the clean name line. */
function buggyScoreAllNameLine(): StructuredSpeakingScore {
  const bad = {
    reason: "Needs improvement",
    evidence: "My name is Aman Khan.",
    band_impact: -0.5,
  };
  return {
    overall_band: 6,
    criteria: {
      fluency_coherence: {
        band: 6,
        weight: 0.25,
        deductions: [{ ...bad, reason: "Hesitation" }],
      },
      lexical_resource: {
        band: 6,
        weight: 0.25,
        deductions: [{ ...bad, reason: "Basic vocabulary" }],
      },
      grammatical_range_accuracy: {
        band: 5.5,
        weight: 0.25,
        deductions: [{ ...bad, reason: "Tense / preposition error" }],
      },
      pronunciation: {
        band: 6.5,
        weight: 0.25,
        deductions: [{ ...bad, reason: "Estimated pronunciation" }],
      },
    },
  };
}

function main() {
  const utterances = extractStudentUtterances(PLANTED_TRANSCRIPT);
  assert.equal(utterances[0], "My name is Aman Khan.");
  assert.ok(utterances.some((u) => /since three years/i.test(u)));
  assert.ok(utterances.some((u) => /very unique/i.test(u)));
  assert.ok(utterances.some((u) => /go to the restaurant yesterday/i.test(u)));

  const repaired = repairStructuredScoreEvidence(
    buggyScoreAllNameLine(),
    PLANTED_TRANSCRIPT
  );

  const grammarEv =
    repaired.criteria.grammatical_range_accuracy.deductions[0]?.evidence || "";
  const lexicalEv = repaired.criteria.lexical_resource.deductions[0]?.evidence || "";
  const fluencyEv = repaired.criteria.fluency_coherence.deductions[0]?.evidence || "";
  const pronEv = repaired.criteria.pronunciation.deductions[0]?.evidence || "";

  assert.ok(
    !/^my name is aman khan\.?$/i.test(grammarEv.trim()),
    `Grammar evidence still name line: ${grammarEv}`
  );
  assert.ok(
    !/^my name is aman khan\.?$/i.test(lexicalEv.trim()),
    `Lexical evidence still name line: ${lexicalEv}`
  );

  assert.ok(
    /since three years|go to the restaurant yesterday/i.test(grammarEv),
    `Grammar evidence missed planted errors: ${grammarEv}`
  );

  assert.ok(
    /very unique|\bgood\b|\bnice\b/i.test(lexicalEv),
    `Lexical evidence missed planted basic/redundant language: ${lexicalEv}`
  );

  const set = new Set(
    [grammarEv, lexicalEv, fluencyEv, pronEv].map((e) =>
      e.toLowerCase().replace(/\s+/g, " ").trim()
    )
  );
  assert.ok(
    set.size >= 2,
    `Evidence recycled across criteria: ${[...set].join(" | ")}`
  );

  const upgrades = deriveVocabularyUpgrades(PLANTED_TRANSCRIPT, repaired);
  const fromKeys = upgrades.map((u) => u.from).filter(Boolean) as string[];
  const uniqueFrom = new Set(fromKeys);
  assert.equal(
    fromKeys.length,
    uniqueFrom.size,
    `Duplicate upgrades for same base word: ${fromKeys.join(", ")}`
  );
  assert.ok(
    !upgrades.some((u) => u.word === "admire"),
    "admire must not be suggested for casual love/like of places"
  );
  assert.ok(
    upgrades.some(
      (u) => u.from === "good" || u.from === "nice" || u.from?.includes("very")
    ),
    `Expected upgrades for good/nice/very*, got: ${JSON.stringify(upgrades)}`
  );

  console.log("speaking-scoring-regression: PASS");
  console.log("  grammar evidence:", grammarEv);
  console.log("  lexical evidence:", lexicalEv);
  console.log(
    "  vocab upgrades:",
    upgrades.map((u) => `${u.word}←${u.from}`).join(", ")
  );
}

main();
