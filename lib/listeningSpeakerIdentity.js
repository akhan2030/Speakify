/**
 * Canonical listening speaker metadata — single source for UI, transcript, TTS, and bank storage.
 *
 * @typedef {object} ListeningSpeakerIdentity
 * @property {string} speakerId
 * @property {string} label
 * @property {string} displayName
 * @property {'male'|'female'} gender
 * @property {string} voiceId
 * @property {string} voice — OpenAI TTS voice slug
 * @property {string} [role]
 * @property {string} [name] — alias of displayName (legacy)
 */

import {
  contentHasBannedLegacySpeakerRefs,
  isBannedSpeakerName,
  pickSection1SpeakerPair,
  replaceSpeakerNamesInTranscript,
  transcriptHasBannedNames,
} from "./listeningSection1Diversity.js";
import {
  scrubBannedEmailsInQuestions,
  scrubBannedEmailsInText,
} from "./listeningSpeakerEmails.js";

export { transcriptHasBannedNames };
import {
  inferGenderFromName,
  MALE_VOICES,
  FEMALE_VOICES,
} from "./listeningSpeakerProfiles.js";
import { pickSpeakersForSection } from "./listeningSpeakerAssignment.js";

export const MALE_VOICE_IDS = ["male_voice_1", "male_voice_2", "male_voice_3"];
export const FEMALE_VOICE_IDS = [
  "female_voice_1",
  "female_voice_2",
  "female_voice_3",
];

const VOICE_ID_TO_OPENAI = {
  male_voice_1: "onyx",
  male_voice_2: "echo",
  male_voice_3: "fable",
  female_voice_1: "nova",
  female_voice_2: "shimmer",
  female_voice_3: "alloy",
};

/**
 * @param {string} voiceId
 * @param {'male'|'female'} gender
 */
export function openAiVoiceFromVoiceId(voiceId, gender) {
  const mapped = VOICE_ID_TO_OPENAI[voiceId];
  if (mapped && voiceMatchesOpenAiGender(mapped, gender)) return mapped;
  return gender === "female" ? "nova" : "onyx";
}

/**
 * @param {string} voice
 * @param {'male'|'female'} gender
 */
export function voiceMatchesOpenAiGender(voice, gender) {
  if (gender === "male") return MALE_VOICES.has(voice);
  if (gender === "female") return FEMALE_VOICES.has(voice);
  return true;
}

/**
 * @param {'male'|'female'} gender
 * @param {number} slot
 * @param {Set<string>} usedVoiceIds
 */
function assignVoiceId(gender, slot, usedVoiceIds) {
  const pool = gender === "female" ? FEMALE_VOICE_IDS : MALE_VOICE_IDS;
  for (let i = 0; i < pool.length; i += 1) {
    const id = pool[(slot + i) % pool.length];
    if (!usedVoiceIds.has(id)) {
      usedVoiceIds.add(id);
      return id;
    }
  }
  return pool[slot % pool.length];
}

/**
 * @param {object} raw
 * @param {number} index
 * @param {Set<string>} usedVoiceIds
 */
function toIdentity(raw, index, usedVoiceIds) {
  const label = String(raw.label ?? `Speaker ${index + 1}`).trim();
  const displayName = String(raw.displayName ?? raw.name ?? "").trim();
  const gender =
    raw.gender === "male" || raw.gender === "female"
      ? raw.gender
      : inferGenderFromName(displayName) ?? "male";

  const voiceId =
    raw.voiceId && (MALE_VOICE_IDS.includes(raw.voiceId) || FEMALE_VOICE_IDS.includes(raw.voiceId))
      ? raw.voiceId
      : assignVoiceId(gender, index, usedVoiceIds);

  if (!usedVoiceIds.has(voiceId)) usedVoiceIds.add(voiceId);

  const voice = voiceMatchesOpenAiGender(raw.voice, gender)
    ? raw.voice
    : openAiVoiceFromVoiceId(voiceId, gender);

  const speakerId =
    String(raw.speakerId ?? "").trim() ||
    `s${index}-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return {
    speakerId,
    label,
    displayName,
    name: displayName,
    gender,
    voiceId,
    voice,
    role: raw.role,
  };
}

/**
 * @param {number} sectionNumber
 * @param {object} [context]
 * @param {string} [context.testSeed] — stable per bank row / live test
 * @param {string[]} [context.excludePairKeys]
 * @param {string[]} [context.excludeNames]
 * @param {string} [context.preferPairType]
 */
export function generateSpeakerIdentitiesForSection(sectionNumber, context = {}) {
  const section = Number(sectionNumber);
  const seed = context.testSeed ?? `section-${section}-${Date.now()}`;

  if (section === 1) {
    const picked = pickSection1SpeakerPair({
      excludePairKeys: context.excludePairKeys ?? [],
      excludeNames: context.excludeNames ?? [],
      preferPairType: context.preferPairType,
      testSeed: seed,
    });
    return identitiesFromLegacySpeakers(picked.speakers, {
      pairKey: picked.pairKey,
      testSeed: seed,
    });
  }

  const picked = pickSpeakersForSection(section, {
    excludeNames: context.excludeNames ?? [],
    testSeed: seed,
  });
  return identitiesFromLegacySpeakers(picked.speakers, { testSeed: seed });
}

/**
 * @param {Array<object>} speakers
 * @param {object} [meta]
 */
export function identitiesFromLegacySpeakers(speakers, meta = {}) {
  const usedVoiceIds = new Set();
  const identities = (speakers ?? []).map((s, i) =>
    toIdentity(s, i, usedVoiceIds)
  );
  return {
    speakers: identities,
    pairKey: meta.pairKey ?? null,
    testSeed: meta.testSeed ?? null,
  };
}

/**
 * @param {Array<object>} rawSpeakers
 * @param {number} sectionNumber
 * @param {object} [context]
 */
export function resolveSpeakerIdentities(rawSpeakers, sectionNumber, context = {}) {
  const section = Number(sectionNumber);
  const list = Array.isArray(rawSpeakers) ? rawSpeakers : [];
  const needsFresh =
    section === 1 &&
    (list.length < 2 ||
      list.some((s) => isBannedSpeakerName(s.displayName ?? s.name)) ||
      hasDuplicateDisplayNames(list) ||
      hasGenderVoiceMismatch(list) ||
      hasDuplicateVoices(list));

  if (needsFresh || list.length === 0) {
    return generateSpeakerIdentitiesForSection(section, context);
  }

  const usedVoiceIds = new Set();
  const identities = list.map((s, i) => {
    const displayName = String(s.displayName ?? s.name ?? "").trim();
    if (isBannedSpeakerName(displayName)) {
      return null;
    }
    return toIdentity({ ...s, displayName }, i, usedVoiceIds);
  });

  if (identities.some((id) => id == null)) {
    return generateSpeakerIdentitiesForSection(section, context);
  }

  const validation = validateSpeakerIdentities(identities, section);
  if (!validation.valid) {
    return generateSpeakerIdentitiesForSection(section, context);
  }

  return { speakers: identities, pairKey: context.pairKey ?? null };
}

/**
 * @param {Array<object>} list
 */
function hasDuplicateDisplayNames(list) {
  const names = list.map((s) =>
    String(s.displayName ?? s.name ?? "")
      .trim()
      .toLowerCase()
  );
  return new Set(names).size !== names.length;
}

/**
 * @param {Array<object>} list
 */
function hasGenderVoiceMismatch(list) {
  return list.some((s) => {
    const gender = s.gender === "male" || s.gender === "female" ? s.gender : null;
    const voice = s.voice ?? openAiVoiceFromVoiceId(s.voiceId, gender);
    if (!gender || !voice) return true;
    return !voiceMatchesOpenAiGender(voice, gender);
  });
}

/**
 * @param {Array<object>} list
 */
function hasDuplicateVoices(list) {
  if (list.length < 2) return false;
  const keys = list.map((s) => s.voiceId ?? s.voice);
  return new Set(keys).size !== keys.length;
}

/**
 * @param {Array<ListeningSpeakerIdentity>} identities
 * @param {number} sectionNumber
 */
export function validateSpeakerIdentities(identities, sectionNumber) {
  const errors = [];
  const section = Number(sectionNumber);
  const list = Array.isArray(identities) ? identities : [];

  if (section === 1 && list.length < 2) {
    errors.push("Section 1 requires exactly 2 speakers");
  }

  const names = new Set();
  const voiceIds = new Set();

  for (const sp of list) {
    const displayName = String(sp.displayName ?? sp.name ?? "").trim();
    const gender = sp.gender;
    const voiceId = sp.voiceId;
    const voice = sp.voice ?? openAiVoiceFromVoiceId(voiceId, gender);

    if (!displayName) {
      errors.push(`${sp.label ?? "?"}: missing displayName`);
      continue;
    }

    if (isBannedSpeakerName(displayName)) {
      errors.push(`Forbidden speaker name: ${displayName}`);
    }

    const nameKey = displayName.toLowerCase();
    if (names.has(nameKey)) {
      errors.push(`Duplicate speaker name: ${displayName}`);
    }
    names.add(nameKey);

    if (gender !== "male" && gender !== "female") {
      errors.push(`${displayName}: invalid gender`);
    } else {
      const inferred = inferGenderFromName(displayName);
      if (inferred && inferred !== gender) {
        errors.push(
          `${displayName}: gender ${gender} does not match name (${inferred})`
        );
      }
      if (!voiceMatchesOpenAiGender(voice, gender)) {
        errors.push(
          `${displayName}: voice ${voice} does not match gender ${gender}`
        );
      }
    }

    if (voiceId) {
      if (voiceIds.has(voiceId)) {
        errors.push(`Duplicate voiceId: ${voiceId}`);
      }
      voiceIds.add(voiceId);
      const expectedGender = FEMALE_VOICE_IDS.includes(voiceId)
        ? "female"
        : MALE_VOICE_IDS.includes(voiceId)
          ? "male"
          : null;
      if (expectedGender && expectedGender !== gender) {
        errors.push(`voiceId ${voiceId} does not match gender ${gender}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {string} transcript
 * @param {Array<ListeningSpeakerIdentity>} identities
 */
export function syncTranscriptToSpeakerIdentities(transcript, identities) {
  const legacy = identities.map((id) => ({
    label: id.label,
    name: id.displayName,
  }));
  let text = replaceSpeakerNamesInTranscript(transcript, [], legacy);

  const bannedPatterns = [
    /\bSarah\s+Mitchell\b/gi,
    /\bSarah\s+Johnson\b/gi,
    /\bDavid\s+Mitchell\b/gi,
    /\bDavid\s+Johnson\b/gi,
  ];
  for (const re of bannedPatterns) {
    text = text.replace(re, (match) => {
      const lineSpeaker = findSpeakerForBannedMatch(text, match, identities);
      return lineSpeaker?.displayName ?? match;
    });
  }

  if (transcriptHasBannedNames(text)) {
    for (const id of identities) {
      text = text.replace(/\bSarah\s+(?:Mitchell|Johnson)\b/gi, id.displayName);
      text = text.replace(/\bDavid\s+(?:Mitchell|Johnson)\b/gi, id.displayName);
    }
  }

  return scrubBannedEmailsInText(text, identities);
}

/**
 * @param {string} text
 * @param {string} match
 * @param {Array<ListeningSpeakerIdentity>} identities
 */
function findSpeakerForBannedMatch(text, match, identities) {
  const lower = match.toLowerCase();
  if (lower.includes("sarah") || lower.includes("emma")) {
    return (
      identities.find((i) => i.gender === "female") ?? identities[0]
    );
  }
  return identities.find((i) => i.gender === "male") ?? identities[0];
}

/**
 * Apply identities to a full section payload (speakers + transcript).
 * @param {object} payload
 * @param {object} context
 */
export function applySpeakerIdentitiesToPayload(payload, context = {}) {
  const section = Number(payload.section ?? payload.section_number ?? 1);
  const testSeed =
    context.testSeed ??
    (payload.bankRowId
      ? `bank-${payload.bankRowId}`
      : payload.testId
        ? String(payload.testId)
        : `practice-${payload.testNumber ?? 0}-s${section}`);

  let transcript = String(payload.transcript ?? "");
  const rawSpeakers = payload.speakers ?? [];

  const resolved = resolveSpeakerIdentities(rawSpeakers, section, {
    ...context,
    testSeed,
  });
  const identities = resolved.speakers;

  const oldForReplace = rawSpeakers.map((s) => ({
    label: s.label,
    name: s.displayName ?? s.name,
  }));
  const newForReplace = identities.map((s) => ({
    label: s.label,
    name: s.displayName,
  }));
  transcript = replaceSpeakerNamesInTranscript(
    transcript,
    oldForReplace,
    newForReplace
  );
  transcript = syncTranscriptToSpeakerIdentities(transcript, identities);

  let questions = payload.questions;
  if (Array.isArray(questions) && questions.length > 0) {
    questions = scrubBannedEmailsInQuestions(questions, identities);
  }

  const validation = validateSpeakerIdentities(identities, section);

  logSpeakerIdentityDebug({
    testId: payload.testId ?? payload.test_id ?? testSeed,
    sectionNumber: section,
    source: context.source ?? "unknown",
    identities,
    validation,
  });

  return {
    ...payload,
    section,
    speakers: identities,
    speakerPairKey: resolved.pairKey ?? payload.speakerPairKey,
    transcript,
    questions: questions ?? payload.questions,
    _speakerValidation: validation,
  };
}

/**
 * @param {object} ctx
 */
export function logSpeakerIdentityDebug(ctx) {
  const {
    testId = "?",
    sectionNumber = "?",
    source = "?",
    identities = [],
    validation = { valid: true, errors: [] },
  } = ctx;

  const summary = identities.map((s) => ({
    speakerId: s.speakerId,
    label: s.label,
    displayName: s.displayName,
    gender: s.gender,
    voiceId: s.voiceId,
    voice: s.voice,
    role: s.role,
  }));

  console.info(
    `[listening-speakers] testId=${testId} section=${sectionNumber} source=${source} valid=${validation.valid}`,
    JSON.stringify(summary)
  );

  if (!validation.valid) {
    console.warn(
      `[listening-speakers] validation failed testId=${testId}`,
      validation.errors
    );
  }
}

/**
 * Throw if invalid — call before save / API response.
 * @param {object} payload
 * @param {number} sectionNumber
 */
export function assertSpeakerIdentitiesValid(payload, sectionNumber) {
  const identities = payload.speakers ?? [];
  const validation = validateSpeakerIdentities(identities, sectionNumber);
  if (!validation.valid) {
    throw new Error(
      `Speaker validation failed: ${validation.errors.join("; ")}`
    );
  }
  const blob = [
    payload.transcript ?? "",
    JSON.stringify(payload.questions ?? []),
  ].join("\n");
  if (sectionNumber === 1 && contentHasBannedLegacySpeakerRefs(blob)) {
    throw new Error(
      "Content still contains forbidden legacy speaker names or emails (e.g. sarah.mitchell@email.com)"
    );
  }
}
