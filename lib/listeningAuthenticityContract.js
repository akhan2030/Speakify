/**
 * IELTS Listening authenticity contract — enforceable rules for scripts & UI.
 * Used by generators, validators, and curated-content regressions.
 *
 * Structural targets align with official IELTS Listening design
 * (transactional dialogue, monologues, academic discussion, lecture).
 * Reference audio in reference/audio/ is inspirational only — never copy content.
 */

/** Letter-by-letter spelling (e.g. H-E-N-D-E-R-S-O-N) */
export const SPELLING_PATTERN = /[A-Za-z](?:-[A-Za-z]){2,}/;

/** Self-correction / distractor-then-fix cues (tested IELTS skill) */
export const SELF_CORRECTION_PATTERN =
  /\b(sorry[\s,]+(?:actually|I mean)|actually[\s,]+(?:it'?s|it is|no)|no[\s,]+(?:wait|sorry)|I mean[\s,]+|correction[:\s]|not\s+\d[\w\s-]*,\s*(?:it'?s|it is)|sorry\s*[—–-]\s*actually)/i;

/** Natural spoken fillers / hesitations */
export const FILLER_PATTERN =
  /\b(er|um|uh|well|you know|I mean|let me see|hang on)\b/i;

/** Explicit pause markers for TTS pacing */
export const PAUSE_MARKER_PATTERN = /\[(?:long )?pause\]/i;

/** Mid-section look-time marker */
export const SECTION_BREAK_PATTERN = /\[SECTION BREAK\]/i;

/**
 * Target spoken length (words) — ≈ 150 wpm → ~2.5–5 min of speech per section
 * (prep/look time is separate UI, not in the transcript).
 */
export const TARGET_WORD_RANGE = {
  1: { min: 280, max: 520 },
  2: { min: 320, max: 580 },
  3: { min: 360, max: 650 },
  4: { min: 400, max: 720 },
};

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
  if (
    t === "form-completion" ||
    t === "note-completion" ||
    t === "table-completion"
  ) {
    return 1;
  }
  return 2;
}

/**
 * Prompt block injected into listening generators.
 * @param {number} sectionNumber
 */
export function buildAuthenticityPromptRules(sectionNumber) {
  const section = Number(sectionNumber);
  const range = TARGET_WORD_RANGE[section] ?? TARGET_WORD_RANGE[1];
  const lines = [
    "AUTHENTICITY CONTRACT (MANDATORY — scripts that break these are rejected):",
    "- Use natural spoken English with contractions.",
    "- MCQ options: exactly THREE (A, B, C) — never four.",
    "- Matching / map answers must be LETTERS from a box (A, B, C…), not free phrases.",
    "- Numbers, dates, times, and prices must be spoken clearly (prefer full spoken forms plus digits where natural).",
    `- Transcript length target: about ${range.min}–${range.max} spoken words (≈ ${(range.min / 150).toFixed(1)}–${(range.max / 150).toFixed(1)} minutes of speech).`,
    "- Space tested answers: leave at least 1–2 full speaker turns of natural dialogue between consecutive gap-fill answers (do not dump all answers in one breath).",
    "- Use PARAPHRASE / synonyms for question ideas — do not repeat the question stem wording in the audio.",
    "- Distractors: for at least TWO tested details, mention a plausible wrong value/date/option FIRST, then correct it.",
    "- Include natural false starts or brief clarifications (e.g. 'the east wing — sorry, the west wing').",
    "- Insert [pause] sparingly at thinking moments; use [long pause] only before major shifts (esp. Section 4).",
    "- NEVER copy or closely imitate any commercial/reference recording the user may have — invent a fresh scenario.",
  ];

  if (section === 1) {
    lines.push(
      "- Exactly 2 speakers; everyday transactional context (booking/registration/enquiry).",
      "- Form fields: separate First name and Surname (never a single 'full name' field).",
      "- ANY surname used as an answer MUST be spelled letter-by-letter (e.g. H-E-N-D-E-R-S-O-N).",
      "- Include AT LEAST ONE self-correction of a tested detail (fee/date/time/number).",
      "- Include a few natural hesitations (er, um, well) — do not overdo them.",
      "- After asking for a name, the other speaker MUST reply with the name clearly.",
      "- Spoken EXAMPLE detail before Question 1 must appear in both transcript and the example JSON field."
    );
  } else if (section === 2) {
    lines.push(
      "- Single-speaker monologue (social/public information / tour).",
      "- Map/plan: walk the listener through space in order; unused letter distractors in the box.",
      "- Choose TWO: state both correct services clearly; include one distractor service that is NOT free/available."
    );
  } else if (section === 3) {
    lines.push(
      "- 2–4 speakers (typically Tutor + students); academic/training context.",
      "- Include AT LEAST ONE clarification or corrected figure between speakers (tested skill).",
      "- Light hesitations allowed; keep academic but natural.",
      "- Flow-chart steps must be short gap-fill labels (e.g. 'Submit _____'), never full 'Which…?' questions.",
      "- Students may interrupt or finish each other's points — keep turns short and overlapping in idea, not chaotic."
    );
  } else if (section === 4) {
    lines.push(
      "- Single lecturer monologue; note/summary/diagram/flow-chart completion — no MCQ options.",
      "- Prefer one clear 'not X but Y' clarification for a tested detail.",
      "- Use [pause] / [long pause] between major topic shifts so note-takers can catch up.",
      "- Signpost structure: firstly / next / finally (or equivalent) without sounding robotic."
    );
  }

  return lines.join("\n");
}

/**
 * Count how many gap-fill answers appear in transcript order with spacing.
 * @param {string} transcript
 * @param {Array<{ answer?: string, correct?: string, type?: string }>} questions
 * @returns {{ ordered: boolean, minGapChars: number|null, spokenCount: number, errors: string[] }}
 */
export function analyseAnswerSpacing(transcript, questions) {
  const text = String(transcript ?? "");
  const lower = text.toLowerCase();
  const errors = [];
  /** @type {number[]} */
  const positions = [];

  const letterOnly = /^[A-J](?:\s*[,/&]\s*[A-J])*$/i;
  let searchFrom = 0;

  for (const q of questions ?? []) {
    const answer = String(q.answer ?? q.correct ?? "").trim();
    if (!answer || letterOnly.test(answer)) continue;

    const primary = answer
      .split("/")[0]
      .replace(/\([^)]*\)/g, "")
      .trim();
    if (primary.length < 2) continue;

    const escaped = primary
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    const re = new RegExp(`(?:^|[^a-z0-9])(${escaped})(?=[^a-z0-9]|$)`, "ig");
    re.lastIndex = searchFrom;
    const match = re.exec(lower);
    if (!match) {
      // Reset and try from start (integrity validator handles truly missing answers)
      re.lastIndex = 0;
      const again = re.exec(lower);
      if (!again) continue;
      positions.push(again.index + (again[0].length - again[1].length));
      searchFrom = again.index + again[0].length;
      continue;
    }
    const pos = match.index + (match[0].length - match[1].length);
    positions.push(pos);
    searchFrom = match.index + match[0].length;
  }

  let minGap = null;
  for (let i = 1; i < positions.length; i += 1) {
    const gap = positions[i] - positions[i - 1];
    if (minGap == null || gap < minGap) minGap = gap;
    if (gap < 40 && positions.length >= 3) {
      errors.push(
        "Answers appear too close together in the transcript — add natural dialogue between tested details"
      );
      break;
    }
  }

  let ordered = true;
  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i] < positions[i - 1]) ordered = false;
  }

  return {
    ordered,
    minGapChars: minGap,
    spokenCount: positions.length,
    errors,
  };
}

/**
 * Validate a transcript against the authenticity contract.
 * @param {string} transcript
 * @param {number} sectionNumber
 * @param {{
 *   requireSpelling?: boolean,
 *   requireSelfCorrection?: boolean,
 *   requireFillers?: boolean,
 *   requireMinWords?: boolean,
 *   requireSectionBreak?: boolean,
 *   requirePauseMarkers?: boolean,
 *   questions?: object[]
 * }} [options]
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
  const requireFillers =
    options.requireFillers ?? (section === 1 || section === 3);
  const requireMinWords = options.requireMinWords !== false;
  const requireSectionBreak =
    options.requireSectionBreak ?? (section >= 1 && section <= 3);
  const requirePauseMarkers = options.requirePauseMarkers ?? section === 4;

  if (!text.trim()) {
    errors.push("Transcript is empty");
    return { ok: false, errors };
  }

  const words = text
    .replace(SECTION_BREAK_PATTERN, " ")
    .replace(PAUSE_MARKER_PATTERN, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const range = TARGET_WORD_RANGE[section] ?? TARGET_WORD_RANGE[1];
  if (requireMinWords && words < range.min) {
    errors.push(
      `Transcript too short for authentic Section ${section} pacing (${words} words; need ≥${range.min})`
    );
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

  if (requireFillers && !FILLER_PATTERN.test(text)) {
    errors.push(
      `Section ${section} should include natural fillers (er, um, well, I mean…)`
    );
  }

  if (requireSectionBreak && !SECTION_BREAK_PATTERN.test(text)) {
    errors.push(
      "Missing [SECTION BREAK] between question blocks (mid-section look time)"
    );
  }

  if (requirePauseMarkers && !PAUSE_MARKER_PATTERN.test(text)) {
    errors.push(
      "Section 4 should include at least one [pause] or [long pause] for note-taking pacing"
    );
  }

  if (Array.isArray(options.questions) && options.questions.length) {
    const spacing = analyseAnswerSpacing(text, options.questions);
    errors.push(...spacing.errors);
  }

  return { ok: errors.length === 0, errors };
}
