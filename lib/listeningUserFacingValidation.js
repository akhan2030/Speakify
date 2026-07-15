/**
 * Regression guards for user-facing listening content (UI, TTS, transcripts).
 */

import { getSectionQuestionBlocks } from "./listeningSectionTypes.js";
import {
  QUESTIONS_PER_SECTION,
  validateSectionQuestions,
} from "./listeningSectionNormalize.js";
import { validateListeningQuestionContent } from "./listeningQuestionContent.js";
import {
  getDefaultSpeakersForSection,
  inferGenderFromName,
} from "./listeningSpeakerProfiles.js";
import { isBannedSpeakerName } from "./listeningSection1Diversity.js";
import { validateSpeakerIdentities } from "./listeningSpeakerIdentity.js";
import { contentHasBannedLegacySpeakerRefs } from "./listeningSection1Diversity.js";

const QUESTION_ZERO_RE =
  /\b(?:question|questions)\s*0\b|\bquestions?\s+0\s+to\s+\d|\b0\s*(?:–|-|to)\s*\d+\b/i;

const BLOCK_RANGE_RE = /\b0\s*(?:–|-)\s*4\b|\b5\s*(?:–|-)\s*9\b/i;

const FEMALE_NAME_ON_MALE_LINE_RE =
  /\b(?:Sarah|Emma|Lisa|Sophie|Olivia|Emily|Maria|Anna|Jane|Helen)\s+(?:Mitchell|Johnson|Wilson|Taylor|Brown|Davis|Miller)\b/i;

const MALE_NAME_ON_FEMALE_LINE_RE =
  /\b(?:David|James|Michael|Robert|Tom|John|William|Daniel|Mark|Paul|Andrew|James|Tom)\s+(?:Mitchell|Johnson|Wilson|Taylor|Harrison|Brown)\b/i;

/**
 * @param {object} ctx
 * @param {string[]} ctx.errors
 */
export function logListeningValidationFailure(ctx) {
  const {
    contentType = "unknown",
    testNumber = "?",
    sectionNumber = "?",
    field = "unknown",
    source = "unknown",
    errors = [],
  } = ctx;

  console.error(
    `[listening-validation] FAILED contentType=${contentType} test=${testNumber} section=${sectionNumber} field=${field} source=${source}`,
    errors
  );
}

/**
 * @param {number} n
 */
export function toUserQuestionNumber(n) {
  const num = Math.floor(Number(n));
  if (!Number.isFinite(num) || num < 1) return 1;
  return num;
}

/**
 * @param {number} start
 * @param {number} end
 */
export function normalizeUserFacingRange(start, end) {
  const s = Math.floor(Number(start));
  const e = Math.floor(Number(end));
  if (Number.isFinite(s) && s < 1 && Number.isFinite(e)) {
    return { start: s + 1, end: e + 1 };
  }
  return { start: toUserQuestionNumber(s), end: toUserQuestionNumber(e) };
}

/**
 * @param {string} text
 */
export function assertNoQuestionZeroInUserText(text) {
  const s = String(text ?? "");
  if (QUESTION_ZERO_RE.test(s)) {
    throw new Error(
      `User-facing text must not reference question 0: ${s.slice(0, 120)}`
    );
  }
  if (BLOCK_RANGE_RE.test(s)) {
    throw new Error(
      `User-facing text must not use zero-based block ranges (0–4 / 5–9): ${s.slice(0, 120)}`
    );
  }
}

/**
 * @param {number} start
 * @param {number} end
 */
export function formatSpokenQuestionRange(start, end) {
  const { start: s, end: e } = normalizeUserFacingRange(start, end);
  return `questions ${s} to ${e}`;
}

/**
 * @param {number} sectionNumber
 */
export function assertSectionBlockRanges(sectionNumber) {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  if (!blocks.length) {
    throw new Error(`Section ${sectionNumber} has no question blocks`);
  }

  let total = 0;
  let cursor = null;

  for (const block of blocks) {
    const size = block.end - block.start + 1;
    if (block.start < 1 || block.end < block.start) {
      throw new Error(
        `Section ${sectionNumber} block ${block.start}–${block.end} is invalid`
      );
    }
    if (size < 1 || size > 10) {
      throw new Error(
        `Section ${sectionNumber} block ${block.start}–${block.end} has invalid size ${size}`
      );
    }
    if (cursor != null && block.start !== cursor + 1) {
      throw new Error(
        `Section ${sectionNumber} blocks must be contiguous (gap before ${block.start})`
      );
    }
    cursor = block.end;
    total += size;
  }

  if (total !== 10) {
    throw new Error(
      `Section ${sectionNumber} blocks must cover 10 questions, got ${total}`
    );
  }
}

/**
 * Prep/instruction ranges must match the official section plan (variable block sizes).
 * @param {number} sectionNumber
 */
export function validateInstructionRangesForSection(sectionNumber) {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  const errors = [];

  if (blocks.length < 2) {
    errors.push(`Section ${sectionNumber}: expected at least 2 question blocks`);
    return { valid: false, errors };
  }

  try {
    assertSectionBlockRanges(sectionNumber);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  if (sectionNumber === 1) {
    const firstSpoken = formatSpokenQuestionRange(blocks[0].start, blocks[0].end);
    const secondSpoken = formatSpokenQuestionRange(blocks[1].start, blocks[1].end);
    if (!firstSpoken.includes("questions 1 to 5")) {
      errors.push(
        `Section 1 first prep range wrong: "${firstSpoken}" (expected questions 1 to 5)`
      );
    }
    if (!secondSpoken.includes("questions 6 to 10")) {
      errors.push(
        `Section 1 second prep range wrong: "${secondSpoken}" (expected questions 6 to 10)`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {Array<{ label?: string, name?: string, gender?: string }>} speakers
 * @param {number} sectionNumber
 */
export function validateSpeakerGenders(speakers, sectionNumber) {
  const list =
    speakers?.length > 0
      ? speakers
      : getDefaultSpeakersForSection(sectionNumber);
  const errors = [];

  for (const sp of list) {
    const name = String(sp.name ?? "").trim();
    const gender =
      sp.gender === "male" || sp.gender === "female" ? sp.gender : null;
    if (!name || !gender) {
      errors.push(
        `${sp.label ?? "?"}: missing name or gender metadata`
      );
      continue;
    }

    const inferred = inferGenderFromName(name);
    if (inferred && inferred !== gender) {
      errors.push(
        `${sp.label ?? "?"}: name "${name}" (${inferred}) does not match gender ${gender}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {Array<{ name?: string }>} speakers
 */
export function validateSection1SpeakerNamesNotOverused(speakers) {
  const errors = [];
  for (const sp of speakers ?? []) {
    const name = String(sp.name ?? "").trim();
    if (name && isBannedSpeakerName(name)) {
      errors.push(
        `Section 1 must not use overused speaker name "${name}"`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * @param {string} transcript
 * @param {Array<{ label: string, name: string, gender: string }>} speakers
 */
export function validateTranscriptSpeakerNames(transcript, speakers) {
  const errors = [];
  const lines = String(transcript ?? "").split(/\r?\n/);
  const profileByLabel = new Map(
    speakers.map((s) => [String(s.label).toLowerCase(), s])
  );

  for (const line of lines) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;

    const label = m[1].trim().toLowerCase();
    const text = m[2];
    const profile = profileByLabel.get(label);
    if (!profile?.gender) continue;

    const intro = text.match(
      /\b(?:i'?m|i am|my name is|my name's|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    );
    if (intro) {
      const inferred = inferGenderFromName(intro[1]);
      if (inferred && inferred !== profile.gender) {
        errors.push(
          `${profile.label} (${profile.gender}) introduces as "${intro[1]}" (${inferred})`
        );
      }
    }

    if (profile.gender === "male" && FEMALE_NAME_ON_MALE_LINE_RE.test(text)) {
      errors.push(
        `${profile.label} (male): female name detected in line: ${text.slice(0, 80)}`
      );
    }
    if (profile.gender === "female" && MALE_NAME_ON_FEMALE_LINE_RE.test(text)) {
      errors.push(
        `${profile.label} (female): male name detected in line: ${text.slice(0, 80)}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {object} sectionPayload
 * @param {number} sectionNumber
 * @param {object} [logContext]
 */
export function validateListeningSectionPayload(
  sectionPayload,
  sectionNumber,
  logContext = {}
) {
  const errors = [];
  const section = Number(sectionNumber);
  const questions = sectionPayload?.questions ?? [];
  const speakers = sectionPayload?.speakers ?? [];
  const transcript = String(sectionPayload?.transcript ?? "");

  const qCheck = validateSectionQuestions(questions, section);
  if (!qCheck.valid) errors.push(...qCheck.errors);

  const contentCheck = validateListeningQuestionContent(questions, section);
  if (!contentCheck.valid) errors.push(...contentCheck.errors);

  if (questions.length !== QUESTIONS_PER_SECTION) {
    errors.push(
      `Section ${section}: expected ${QUESTIONS_PER_SECTION} questions, got ${questions.length}`
    );
  }

  try {
    assertSectionBlockRanges(section);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  const rangeCheck = validateInstructionRangesForSection(section);
  if (!rangeCheck.valid) errors.push(...rangeCheck.errors);

  const speakerCheck = validateSpeakerGenders(speakers, section);
  if (!speakerCheck.valid) errors.push(...speakerCheck.errors);

  if (section === 1) {
    const diversityCheck = validateSection1SpeakerNamesNotOverused(speakers);
    if (!diversityCheck.valid) errors.push(...diversityCheck.errors);
  }

  const identityCheck = validateSpeakerIdentities(speakers, section);
  if (!identityCheck.valid) errors.push(...identityCheck.errors);

  const contentBlob = [transcript, JSON.stringify(questions)].join("\n");
  if (section === 1 && contentHasBannedLegacySpeakerRefs(contentBlob)) {
    errors.push(
      "Content contains forbidden legacy speaker names or emails (e.g. sarah.mitchell@email.com)"
    );
  }

  const transcriptCheck = validateTranscriptSpeakerNames(transcript, speakers);
  if (!transcriptCheck.valid) errors.push(...transcriptCheck.errors);

  const blocks = getSectionQuestionBlocks(section);
  const textsToScan = [
    ...blocks.map((b) => formatSpokenQuestionRange(b.start, b.end)),
    transcript.slice(0, 3000),
  ];

  for (const text of textsToScan) {
    try {
      assertNoQuestionZeroInUserText(text);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  for (const q of questions) {
    if (Number(q.questionNumber) < 1) {
      errors.push(`Question number must be >= 1, got ${q.questionNumber}`);
    }
  }

  const valid = errors.length === 0;
  if (!valid && logContext.logOnFailure) {
    logListeningValidationFailure({
      ...logContext,
      sectionNumber: section,
      field: "section_payload",
      errors,
    });
  }

  return { valid, errors };
}

/**
 * @param {Record<number, object>} sections — keys 1–4
 */
export function validateFullMockPayload(sections) {
  const errors = [];
  let totalQuestions = 0;

  for (let s = 1; s <= 4; s += 1) {
    const payload = sections[s];
    if (!payload) {
      errors.push(`Full mock missing section ${s}`);
      continue;
    }
    const check = validateListeningSectionPayload(payload, s);
    if (!check.valid) {
      errors.push(...check.errors.map((e) => `[S${s}] ${e}`));
    }
    totalQuestions += payload.questions?.length ?? 0;
  }

  if (totalQuestions !== 40) {
    errors.push(
      `Full mock must have 40 questions total, got ${totalQuestions}`
    );
  }

  const nums = [];
  for (let s = 1; s <= 4; s += 1) {
    for (const q of sections[s]?.questions ?? []) {
      nums.push(Number(q.questionNumber));
    }
  }
  nums.sort((a, b) => a - b);
  if (nums.length === 40 && (nums[0] !== 1 || nums[39] !== 40)) {
    errors.push(
      `Full mock question numbers must be 1–40, got ${nums[0]}–${nums[nums.length - 1]}`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {string} text
 */
export function scanUserFacingCopy(text) {
  const issues = [];
  const s = String(text ?? "");
  if (QUESTION_ZERO_RE.test(s)) {
    issues.push("Contains question 0 reference");
  }
  if (BLOCK_RANGE_RE.test(s)) {
    issues.push("Contains zero-based block range (0–4 or 5–9)");
  }
  return issues;
}
