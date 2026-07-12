/**
 * IELTS Listening authenticity contract — enforceable rules for scripts & UI.
 * Used by generators, validators, and curated-content regressions.
 */

/** Letter-by-letter spelling (e.g. H-E-N-D-E-R-S-O-N) */
export const SPELLING_PATTERN = /[A-Za-z](?:-[A-Za-z]){2,}/;

/** Self-correction / distractor-then-fix cues (tested IELTS skill) */
export const SELF_CORRECTION_PATTERN =
  /\b(sorry[\s,]+(?:actually|I mean)|actually[\s,]+(?:it'?s|it is|no)|no[\s,]+(?:wait|sorry)|I mean[\s,]+|correction[:\s]|not\s+\d[\w\s-]*,\s*(?:it'?s|it is)|sorry\s*[—–-]\s*actually)/i;

/**
 * Official word-limit phrase for a block.
 * @param {1|2|3} maxWords
 * @param {{ includeNumber?: boolean }} [opts]
 */
export function wordLimitPhrase(maxWords, opts = {}) {
  const n = maxWords === 1 ? "ONE" : maxWords === 3 ? "THREE" : "TWO";
  const includeNumber = opts.includeNumber !== false;
  if (!includeNumber) {
    return `NO MORE THAN ${n} WORD${maxWords === 1 ? "" : "S"}`;
  }
  return `NO MORE THAN ${n} WORD${maxWords === 1 ? "" : "S"} AND/OR A NUMBER`;
}

/**
 * Default word limit by question type (can be overridden per block).
 * @param {string} questionType
 * @returns {1|2|3}
 */
export function defaultWordLimitForType(questionType) {
  const t = String(questionType ?? "")
    .toLowerCase()
    .replace(/_/g, "-");
  if (t === "short-answer") return 3;
  return 2;
}

/**
 * Prompt block injected into listening generators.
 * @param {number} sectionNumber
 */
export function buildAuthenticityPromptRules(sectionNumber) {
  const section = Number(sectionNumber);
  const lines = [
    "AUTHENTICITY CONTRACT (MANDATORY — scripts that break these are rejected):",
    "- Use natural spoken English with contractions.",
    "- MCQ options: exactly THREE (A, B, C) — never four.",
    "- Matching answers must be LETTERS from a box (A, B, C…), not free phrases.",
    "- Numbers, dates, times, and prices must be spoken clearly in full.",
  ];

  if (section === 1) {
    lines.push(
      "- Exactly 2 speakers; everyday transactional context (booking/registration/enquiry).",
      "- Form fields: separate First name and Surname (never a single 'full name' field).",
      "- ANY surname used as an answer MUST be spelled letter-by-letter (e.g. H-E-N-D-E-R-S-O-N).",
      "- Include AT LEAST ONE self-correction of a tested detail (fee/date/time/number): state a wrong value first, then correct it (e.g. 'ninety-five pounds — sorry, actually eighty-five').",
      "- Include a few natural hesitations (er, um, well) — do not overdo them."
    );
  } else if (section === 2) {
    lines.push(
      "- Single-speaker monologue (social/public information).",
      "- If matching/plan/map: provide a lettered box and answers as letters only."
    );
  } else if (section === 3) {
    lines.push(
      "- 2–4 speakers (typically Tutor + students); academic/training context.",
      "- Include AT LEAST ONE clarification or corrected figure between speakers (tested skill).",
      "- Light hesitations allowed; keep academic but natural."
    );
  } else if (section === 4) {
    lines.push(
      "- Single lecturer monologue; note/summary/flow-chart completion ONLY — no MCQ options.",
      "- Prefer one clear 'not X but Y' clarification for a tested detail (e.g. weekly not monthly)."
    );
  }

  return lines.join("\n");
}

/**
 * Validate a transcript against the authenticity contract.
 * @param {string} transcript
 * @param {number} sectionNumber
 * @param {{ requireSpelling?: boolean, requireSelfCorrection?: boolean }} [options]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateListeningAuthenticity(
  transcript,
  sectionNumber,
  options = {}
) {
  const text = String(transcript ?? "");
  const section = Number(sectionNumber);
  const errors = [];

  const requireSpelling = options.requireSpelling ?? section === 1;
  const requireSelfCorrection =
    options.requireSelfCorrection ?? (section === 1 || section === 3);

  if (!text.trim()) {
    errors.push("Transcript is empty");
    return { ok: false, errors };
  }

  if (requireSpelling && !SPELLING_PATTERN.test(text)) {
    errors.push(
      "Section 1 must spell a surname/unusual answer letter-by-letter (e.g. W-H-I-T-A-K-E-R)"
    );
  }

  if (requireSelfCorrection && !SELF_CORRECTION_PATTERN.test(text)) {
    errors.push(
      `Section ${section} must include a self-correction / distractor-then-fix (sorry/actually…)`
    );
  }

  return { ok: errors.length === 0, errors };
}
