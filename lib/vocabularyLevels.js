/**
 * Shared Speakify CEFR level constants for JS modules (agents, API routes, scripts).
 * Keep in sync with lib/vocabulary.ts
 */

const SPEAKIFY_CEFR_LEVELS = [
  "A1.1",
  "A1.2",
  "A2.1",
  "A2.2",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
  "C1.1",
  "C1.2",
  "C2.1",
  "C2.2",
];

const DEFAULT_CEFR_LEVEL = "B1.1";

const INVALID_CEFR_LEVEL_REMAP = {
  "A1.3": "A1.2",
  "A1.4": "A1.2",
  "A2.3": "A2.2",
  "A2.4": "A2.2",
};

const VOCAB_LEVEL_BANKS = {
  "A1.1": "basic greetings, names, classroom words, numbers, countries, simple daily words",
  "A1.2": "family, routines, food, time, places, simple descriptions",
  "A2.1": "travel, shopping, health, hobbies, directions, everyday services",
  "A2.2": "work, study, technology, opinions, plans, comparisons",
  "B1.1": "experiences, education, environment, social life, problems and solutions",
  "B1.2": "work communication, culture, media, future goals, opinions and explanations",
  "B2.1": "academic topics, abstract ideas, argument vocabulary, cause/effect, global issues",
  "B2.2": "advanced discussion, critical thinking, formal writing, debate language",
  "C1.1": "professional, academic, legal, business, complex argument vocabulary",
  "C1.2": "advanced fluency, idioms, nuance, precision, high-level academic/professional language",
  "C2.1":
    "advanced academic vocabulary, nuanced argument language, high-level formal expressions, complex discourse markers, sophisticated abstract vocabulary, professional and academic precision",
  "C2.2":
    "near-native vocabulary control, idiomatic and figurative language, subtle register differences, advanced collocations, rhetoric and persuasion language, expert-level academic, legal, and professional vocabulary",
};

function isSpeakifyCefrLevel(value) {
  return SPEAKIFY_CEFR_LEVELS.includes(value);
}

function normalizeSpeakifyCefrLevel(raw) {
  if (!raw || !String(raw).trim()) return DEFAULT_CEFR_LEVEL;
  const cleaned = String(raw).trim();
  const canonical = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  if (isSpeakifyCefrLevel(canonical)) return canonical;
  if (INVALID_CEFR_LEVEL_REMAP[canonical]) return INVALID_CEFR_LEVEL_REMAP[canonical];
  return DEFAULT_CEFR_LEVEL;
}

const VOCAB_CORE_TARGETS = {
  "A1.1": 400,
  "A1.2": 400,
  "A2.1": 650,
  "A2.2": 650,
  "B1.1": 1250,
  "B1.2": 1250,
  "B2.1": 2000,
  "B2.2": 2000,
  "C1.1": 2500,
  "C1.2": 2500,
  "C2.1": 3000,
  "C2.2": 3000,
};

const VOCAB_SESSION_SIZE = 10;
const VOCAB_CORE_MASTERY_THRESHOLD = 0.8;
const VOCAB_AI_TOPUP_BATCH_SIZE = 50;

function isMasteredRating(rating) {
  return rating === "good" || rating === "easy";
}

function coreTargetForLevel(level) {
  const normalized = normalizeSpeakifyCefrLevel(level);
  return VOCAB_CORE_TARGETS[normalized] ?? 400;
}

module.exports = {
  SPEAKIFY_CEFR_LEVELS,
  CEFR_LEVELS: SPEAKIFY_CEFR_LEVELS,
  DEFAULT_CEFR_LEVEL,
  INVALID_CEFR_LEVEL_REMAP,
  VOCAB_LEVEL_BANKS,
  VOCAB_CORE_TARGETS,
  VOCAB_SESSION_SIZE,
  VOCAB_CORE_MASTERY_THRESHOLD,
  VOCAB_AI_TOPUP_BATCH_SIZE,
  isSpeakifyCefrLevel,
  normalizeSpeakifyCefrLevel,
  isMasteredRating,
  coreTargetForLevel,
};
