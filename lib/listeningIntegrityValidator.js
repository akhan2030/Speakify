/**
 * Listening Integrity Validator
 * Ensures script ↔ questions ↔ answers ↔ example stay synchronized before publish.
 */

import flexibleAnswers from "./listeningFlexibleAnswers.js";
import {
  validateListeningAuthenticity,
  TARGET_WORD_RANGE,
} from "./listeningAuthenticityContract.js";

const {
  expandOfficialAnswerKey,
  matchesOfficialListeningAnswer,
  normalizeForMatch,
} = flexibleAnswers;

const MIN_WORDS_BY_SECTION = {
  1: TARGET_WORD_RANGE[1].min,
  2: TARGET_WORD_RANGE[2].min,
  3: TARGET_WORD_RANGE[3].min,
  4: TARGET_WORD_RANGE[4].min,
};

const LETTER_ONLY_RE = /^[A-J](?:\s*[,/&]\s*[A-J])*$/i;

const AMBIGUOUS_SHORT_ANSWERS = new Set([
  "a",
  "an",
  "the",
  "yes",
  "no",
  "ok",
  "oh",
  "am",
  "pm",
  "to",
  "of",
  "in",
  "on",
  "at",
  "or",
  "and",
]);

/**
 * @param {string} text
 */
function countWords(text) {
  return String(text ?? "")
    .replace(/\[SECTION BREAK\]/gi, " ")
    .replace(/\[(?:long )?pause\]/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Estimated spoken duration (seconds) from word count.
 * @param {number} words
 */
function estimateDurationSeconds(words) {
  // OpenAI TTS is typically ~140–160 wpm for dialogue
  return Math.round((words / 150) * 60);
}

/**
 * @param {string} answerKey
 * @param {string} transcript
 */
function answerSpokenInTranscript(answerKey, transcript) {
  const key = String(answerKey ?? "").trim();
  const source = String(transcript ?? "");
  if (!key || !source) return false;
  if (LETTER_ONLY_RE.test(key)) return true; // map/MCQ letters — content elsewhere

  if (matchesOfficialListeningAnswer(key, key) && source) {
    // Check any expanded variant appears
  }

  const variants = expandOfficialAnswerKey(key);
  const normSource = normalizeForMatch(source);

  for (const variant of variants) {
    const v = String(variant ?? "").trim();
    if (!v) continue;
    if (LETTER_ONLY_RE.test(v)) return true;

    // Direct / case-insensitive
    if (source.toLowerCase().includes(v.toLowerCase())) return true;

    const norm = normalizeForMatch(v);
    if (norm.length >= 2 && normSource.includes(norm)) return true;

    // Token coverage for multi-word (ignore very short tokens)
    const tokens = norm.split(" ").filter((t) => t.length > 2);
    if (tokens.length >= 2 && tokens.every((t) => normSource.includes(t))) {
      return true;
    }
  }

  return false;
}

/**
 * @param {object} question
 */
function isGapFillQuestion(question) {
  const type = String(question?.type ?? "").toLowerCase();
  if (
    type.includes("multiple-choice") ||
    type === "mcq" ||
    type.includes("matching") ||
    type.includes("plan-map") ||
    type.includes("diagram")
  ) {
    const ans = String(question?.answer ?? "").trim();
    return !LETTER_ONLY_RE.test(ans);
  }
  return true;
}

/**
 * Validate a section (or single-block) listening payload for publish readiness.
 *
 * @param {object} payload
 * @param {number} sectionNumber
 * @returns {{ valid: boolean, errors: string[], warnings: string[], stats: object }}
 */
function validateListeningIntegrity(payload, sectionNumber, options = {}) {
  const errors = [];
  const warnings = [];
  const section = Number(sectionNumber) || 1;
  const transcript = String(payload?.transcript ?? "");
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];
  const example = payload?.example ?? null;
  const requireExample = Boolean(options.requireExample);

  const words = countWords(transcript);
  const minWords = MIN_WORDS_BY_SECTION[section] ?? 220;
  const durationSec = estimateDurationSeconds(words);

  if (!transcript.trim()) {
    errors.push("Transcript is empty — nothing to speak");
  } else if (words < minWords) {
    errors.push(
      `Transcript too short for Section ${section}: ${words} words (need ≥${minWords}; ~${durationSec}s estimated). Students would hear incomplete audio.`
    );
  }

  if (questions.length === 0) {
    errors.push("No questions present");
  }

  let missingAnswers = 0;
  for (const q of questions) {
    const qn = q.questionNumber ?? q.id ?? "?";
    const answer = String(q.answer ?? q.correct ?? "").trim();
    if (!answer) {
      errors.push(`Q${qn}: missing answer key`);
      missingAnswers += 1;
      continue;
    }

    // Letter answers for map/MCQ are not expected as spoken letters
    if (LETTER_ONLY_RE.test(answer)) continue;

    if (!isGapFillQuestion(q) && LETTER_ONLY_RE.test(answer)) continue;

    if (!answerSpokenInTranscript(answer, transcript)) {
      errors.push(
        `Q${qn}: answer "${answer}" is not spoken in the transcript`
      );
      missingAnswers += 1;
    }
  }

  // Section 1 example must be spoken when present (or required for live generate)
  if (section === 1) {
    const exampleAnswer = String(
      example?.answer ?? example?.answerText ?? ""
    ).trim();
    const exampleQuestion = String(
      example?.questionText ?? example?.text ?? ""
    ).trim();

    if (!exampleAnswer) {
      if (requireExample) {
        errors.push(
          "Section 1 missing spoken example answer (paper example must match the recording)"
        );
      }
    } else if (!answerSpokenInTranscript(exampleAnswer, transcript)) {
      errors.push(
        `Example answer "${exampleAnswer}" is not spoken in the transcript`
      );
    }

    if (exampleAnswer && !exampleQuestion) {
      warnings.push("Example has answer but no question text");
    }

    if (
      /harbour\s*city/i.test(exampleAnswer) &&
      !answerSpokenInTranscript("Harbour City", transcript)
    ) {
      errors.push(
        'Example "Harbour City" is not in the recording — remove or regenerate'
      );
    }
  }

  // Dialogue continuity: after a question cue like "what's your name", expect a reply nearby
  const nameCue = transcript.match(
    /what(?:'s| is)\s+your\s+(?:first\s+)?name\??/i
  );
  if (nameCue && nameCue.index != null) {
    // Only inspect the immediate next turn (avoid matching later repeated dialogue)
    const after = transcript.slice(nameCue.index, nameCue.index + 160);
    const hasReply =
      /\b(?:my name(?:'s| is)|i(?:'m| am))\s+[A-Z][a-z]{1,20}\b/i.test(after) ||
      /\n\s*(?:Caller|Speaker\s*B|Student(?:\s*[AB])?|Guest|Customer)\s*:\s*[A-Z][a-z]{1,20}\b/.test(
        after
      );
    if (!hasReply) {
      errors.push(
        'After "What\'s your name?" the transcript has no spoken name reply — Question 1 would be unanswerable'
      );
    }
  }

  // SECTION BREAK required for multi-block sections 1–3 (group audio sync)
  if (section >= 1 && section <= 3) {
    if (!/\[SECTION BREAK\]/i.test(transcript)) {
      errors.push(
        "Missing [SECTION BREAK] between question blocks — audio and on-screen groups would desync"
      );
    }
  }

  // Authenticity: fillers, self-corrections, pacing, answer spacing.
  // Skip duplicate min-words / SECTION BREAK checks (already enforced above).
  const authenticity = validateListeningAuthenticity(transcript, section, {
    questions,
    requireMinWords: false,
    requireSectionBreak: false,
    requirePauseMarkers: section === 4,
    ...(options.authenticity ?? {}),
  });
  if (!authenticity.ok) {
    errors.push(...authenticity.errors.map((e) => `[authenticity] ${e}`));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      words,
      estimatedDurationSeconds: durationSec,
      questionCount: questions.length,
      missingAnswers,
    },
  };
}

/**
 * Normalize example object from LLM / bank payload.
 * @param {unknown} raw
 */
function normalizeListeningExample(raw) {
  if (!raw || typeof raw !== "object") return null;
  const questionText = String(
    raw.questionText ?? raw.text ?? raw.question ?? ""
  ).trim();
  const answer = String(raw.answer ?? raw.answerText ?? "").trim();
  if (!answer) return null;
  return {
    questionText:
      questionText ||
      "The example answer is ....................... ?",
    answer,
    answerText: answer,
  };
}

export {
  validateListeningIntegrity,
  answerSpokenInTranscript,
  normalizeListeningExample,
  countWords,
  estimateDurationSeconds,
  MIN_WORDS_BY_SECTION,
  AMBIGUOUS_SHORT_ANSWERS,
};

export default {
  validateListeningIntegrity,
  answerSpokenInTranscript,
  normalizeListeningExample,
  countWords,
  estimateDurationSeconds,
  MIN_WORDS_BY_SECTION,
  AMBIGUOUS_SHORT_ANSWERS,
};
