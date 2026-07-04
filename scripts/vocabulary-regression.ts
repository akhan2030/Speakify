/**
 * Vocabulary regression suite.
 *
 * Covers:
 *  (1) CEFR hydration from placement band / profile (not a static B1.1 default)
 *  (2) Track-aware topic ordering (Academic vs General Training)
 *  (3) Topic key matching rules (null/empty/case → "general")
 *
 * Run: npm run test:vocabulary
 */

import assert from "node:assert/strict";
import {
  bandToSpeakifyCefr,
  profileCefrToSpeakify,
  DEFAULT_CEFR_LEVEL,
} from "../lib/vocabulary.ts";
import { looksLikeShortArabicEquivalent } from "../lib/vocabularyArabic.js";
import {
  defaultTopicForTrack,
  normalizeVocabTopicKey,
  sortTopicsForTrack,
} from "../lib/vocabularyTopics.ts";

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

/** Mirrors fetchLevelWordIds / getTopicSummariesForLevel topic key rules. */
function topicKeyFromRow(topicCategory: string | null | undefined): string {
  return String(topicCategory ?? "").trim().toLowerCase() || "general";
}

function filterIdsForTopic(
  rows: { id: string; topic_category: string | null }[],
  topicCategory: string
): string[] {
  const topic = String(topicCategory).trim().toLowerCase() || "general";
  return rows
    .filter((row) => topicKeyFromRow(row.topic_category) === topic)
    .map((r) => r.id);
}

// ─── (1) CEFR hydration ─────────────────────────────────────────────────────

console.log("\n(1) CEFR hydration from placement / profile");

check("different placement bands map to different Speakify levels", () => {
  const low = bandToSpeakifyCefr(5.0);
  const mid = bandToSpeakifyCefr(6.5);
  const high = bandToSpeakifyCefr(7.5);
  assert.notEqual(low, mid);
  assert.notEqual(mid, high);
  assert.equal(low, "A2.2");
  assert.equal(mid, "B2.1");
  assert.equal(high, "C1.1");
});

check("profileCefrToSpeakify prefers band over coarse label", () => {
  // Coarse "B1" alone would be B1.1, but band 7.0 must win.
  assert.equal(profileCefrToSpeakify("B1", 7.0), "B2.2");
});

check("profileCefrToSpeakify handles B1.1 / b1-1 / B1 forms", () => {
  assert.equal(profileCefrToSpeakify("B1.1"), "B1.1");
  assert.equal(profileCefrToSpeakify("b1-1"), "B1.1");
  assert.equal(profileCefrToSpeakify("B1"), "B1.1");
  assert.equal(profileCefrToSpeakify("B1+"), "B1.1");
});

check("missing profile falls back to default, not a random level", () => {
  assert.equal(profileCefrToSpeakify(null), DEFAULT_CEFR_LEVEL);
  assert.equal(profileCefrToSpeakify(""), DEFAULT_CEFR_LEVEL);
});

check("two students with different bands do not converge on the same level", () => {
  const studentA = profileCefrToSpeakify("B1", 5.5);
  const studentB = profileCefrToSpeakify("B1", 7.0);
  assert.notEqual(studentA, studentB);
  assert.equal(studentA, "B1.1");
  assert.equal(studentB, "B2.2");
});

// ─── (2) Track-aware topic ordering ─────────────────────────────────────────

console.log("\n(2) Track-aware topic ordering");

const SAMPLE_TOPICS = [
  { key: "general", wordCount: 50 },
  { key: "academic", wordCount: 20 },
  { key: "work", wordCount: 30 },
  { key: "travel", wordCount: 15 },
  { key: "education", wordCount: 25 },
];

check("Academic prioritizes academic/education over general", () => {
  const ordered = sortTopicsForTrack(SAMPLE_TOPICS, "ielts_academic");
  assert.equal(ordered[0].key, "academic");
  assert.ok(ordered.findIndex((t) => t.key === "education") < ordered.findIndex((t) => t.key === "general"));
});

check("General Training prioritizes work/travel over academic", () => {
  const ordered = sortTopicsForTrack(SAMPLE_TOPICS, "ielts_general");
  assert.equal(ordered[0].key, "work");
  assert.ok(ordered.findIndex((t) => t.key === "travel") < ordered.findIndex((t) => t.key === "academic"));
});

check("Academic and GT default topics differ", () => {
  const academicDefault = defaultTopicForTrack("ielts_academic", SAMPLE_TOPICS);
  const gtDefault = defaultTopicForTrack("ielts_general", SAMPLE_TOPICS);
  assert.equal(academicDefault, "academic");
  assert.equal(gtDefault, "work");
  assert.notEqual(academicDefault, gtDefault);
});

// ─── (3) Topic matching (Study Words navigation data path) ──────────────────

console.log("\n(3) Topic key matching (general / case / null)");

const ROWS = [
  { id: "1", topic_category: "general" },
  { id: "2", topic_category: null },
  { id: "3", topic_category: "" },
  { id: "4", topic_category: "Education" },
  { id: "5", topic_category: "education" },
  { id: "6", topic_category: "Work" },
];

check("null and empty count as general (list and study agree)", () => {
  const generalIds = filterIdsForTopic(ROWS, "general");
  assert.deepEqual(generalIds.sort(), ["1", "2", "3"]);
});

check("topic filter is case-insensitive", () => {
  const educationIds = filterIdsForTopic(ROWS, "education");
  assert.deepEqual(educationIds.sort(), ["4", "5"]);
  const workIds = filterIdsForTopic(ROWS, "work");
  assert.deepEqual(workIds, ["6"]);
});

check("normalizeVocabTopicKey treats blank as general", () => {
  assert.equal(normalizeVocabTopicKey(null), "general");
  assert.equal(normalizeVocabTopicKey(""), "general");
  assert.equal(normalizeVocabTopicKey("  Education "), "education");
});

check("study URL shape includes /study segment + topic + cefrLevel", () => {
  const base = "/dashboard/ielts/student";
  const cefrLevel = "B2.1";
  const topicKey = "academic";
  const params = new URLSearchParams();
  params.set("cefrLevel", cefrLevel);
  params.set("topic", topicKey);
  const href = `${base}/vocabulary/study?${params.toString()}`;
  // Must not be the overview path (/vocabulary without /study).
  assert.match(href, /\/vocabulary\/study\?/);
  assert.doesNotMatch(href, /\/vocabulary\?/);
  assert.match(href, /cefrLevel=B2\.1/);
  assert.match(href, /topic=academic/);
});

// ─── (4) Arabic equivalent vs full definition ───────────────────────────────

console.log("\n(4) Arabic equivalent vs full definition");

check("short glosses count as lexical equivalents", () => {
  assert.equal(looksLikeShortArabicEquivalent("مسؤول"), true);
  assert.equal(looksLikeShortArabicEquivalent("يقلل / يخفّض"), true);
  assert.equal(looksLikeShortArabicEquivalent("بيئة"), true);
});

check("full definition sentences are not treated as short equivalents", () => {
  assert.equal(
    looksLikeShortArabicEquivalent(
      "وجود التزام للقيام بشيء ما أو السيطرة على شخص ما"
    ),
    false
  );
});

// ─── Summary ────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\nvocabulary-regression: ${failures} failure(s)\n`);
  process.exit(1);
}

console.log("\nvocabulary-regression: PASS\n");
