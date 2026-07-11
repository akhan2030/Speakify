/**
 * Bind transcript speaker labels to gendered TTS profiles.
 *
 * Mock/practice scripts often use role labels (Coordinator/Caller) or first names
 * (Hannah/Patrick) while speaker metadata uses Speaker A/B or Student A/B.
 * Without binding, TTS falls through to hardcoded role→voice maps (e.g. Caller→nova)
 * and male characters like James Henderson get a female voice.
 */

import {
  getDefaultSpeakersForSection,
  inferGenderFromName,
  MALE_VOICES,
  FEMALE_VOICES,
} from "./listeningSpeakerProfiles.js";
import { extractIntroducedNames } from "./listeningSpeakerAlignment.js";
import {
  normalizeSpeakerKey,
  parseTranscriptIntoSegments,
} from "./listeningTranscriptParse.js";

const MALE_VOICE_LIST = ["onyx", "echo", "fable"];
const FEMALE_VOICE_LIST = ["nova", "shimmer", "alloy"];

/**
 * @param {'male'|'female'|null|undefined} gender
 * @param {number} slot
 * @param {Set<string>} usedVoices
 */
function pickDistinctVoice(gender, slot, usedVoices) {
  const pool =
    gender === "female" ? FEMALE_VOICE_LIST : MALE_VOICE_LIST;
  for (let i = 0; i < pool.length; i += 1) {
    const voice = pool[(slot + i) % pool.length];
    if (!usedVoices.has(voice)) {
      usedVoices.add(voice);
      return voice;
    }
  }
  const fallback = pool[slot % pool.length];
  usedVoices.add(fallback);
  return fallback;
}

/**
 * @param {string} voice
 * @param {'male'|'female'|null|undefined} gender
 */
function ensureVoiceMatchesGender(voice, gender) {
  if (!gender) return voice || "onyx";
  if (gender === "male" && MALE_VOICES.has(voice)) return voice;
  if (gender === "female" && FEMALE_VOICES.has(voice)) return voice;
  return gender === "female" ? "nova" : "onyx";
}

/**
 * @param {object} profile
 */
function profileFirstName(profile) {
  const name = String(profile?.displayName ?? profile?.name ?? "").trim();
  return name.split(/\s+/)[0]?.toLowerCase() ?? "";
}

/**
 * Unique speech labels in first-appearance order.
 * @param {string} transcript
 * @param {number} sectionNumber
 */
export function listTranscriptSpeakerLabels(transcript, sectionNumber) {
  const segments = parseTranscriptIntoSegments(transcript, sectionNumber);
  const labels = [];
  const seen = new Set();
  for (const seg of segments) {
    if (seg.type !== "speech" || !seg.speaker) continue;
    const key = normalizeSpeakerKey(seg.speaker);
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    labels.push(key);
  }
  return labels;
}

/**
 * @param {string} transcript
 * @param {number} sectionNumber
 * @param {string} label
 */
function textForLabel(transcript, sectionNumber, label) {
  const key = normalizeSpeakerKey(label).toLowerCase();
  const segments = parseTranscriptIntoSegments(transcript, sectionNumber);
  const parts = [];
  for (const seg of segments) {
    if (seg.type !== "speech") continue;
    if (normalizeSpeakerKey(seg.speaker).toLowerCase() !== key) continue;
    if (seg.text) parts.push(seg.text);
  }
  return parts.join(" ");
}

/**
 * Infer gender for a transcript label from dialogue + label name.
 * Does NOT use Mr/Ms addressed to the other party (those gender the addressee).
 * @param {string} label
 * @param {string} spokenText
 * @returns {'male'|'female'|null}
 */
export function inferGenderForTranscriptLabel(label, spokenText) {
  const fromLabel = inferGenderFromName(label);
  if (fromLabel) return fromLabel;

  const introduced = extractIntroducedNames(spokenText);
  for (const name of introduced) {
    const g = inferGenderFromName(name);
    if (g) return g;
  }

  // Short answers / names spoken by this speaker (e.g. Caller: "James.")
  const nameTokens =
    String(spokenText ?? "").match(
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g
    ) ?? [];
  for (const token of nameTokens) {
    const g = inferGenderFromName(token);
    if (g) return g;
  }

  // Role defaults for known monologue / tutorial roles only — never Caller/Customer.
  const key = normalizeSpeakerKey(label).toLowerCase();
  if (
    key === "tutor" ||
    key === "lecturer" ||
    key === "guide" ||
    key === "narrator"
  ) {
    return "male";
  }
  if (key === "question" || key === "questioner") return "female";
  return null;
}

/**
 * Remap speaker profiles onto the labels that actually appear in the transcript,
 * with gender-correct, distinct OpenAI voices.
 *
 * @param {string} transcript
 * @param {number} sectionNumber
 * @param {Array<object>} [speakers]
 * @returns {Array<object>}
 */
export function bindSpeakersForMultiVoice(
  transcript,
  sectionNumber,
  speakers = []
) {
  const section = Number(sectionNumber);
  const labels = listTranscriptSpeakerLabels(transcript, section);
  const profiles =
    Array.isArray(speakers) && speakers.length > 0
      ? speakers.map((s) => ({ ...s }))
      : getDefaultSpeakersForSection(section).map((s) => ({ ...s }));

  // Monologues / single-label sections: keep one gendered voice.
  if (labels.length <= 1) {
    if (labels.length === 0) return profiles;
    const label = labels[0];
    const spoken = textForLabel(transcript, section, label);
    const gender =
      inferGenderForTranscriptLabel(label, spoken) ??
      profiles[0]?.gender ??
      "male";
    const base = profiles[0] ?? {
      label,
      name: label,
      gender,
      voice: gender === "female" ? "nova" : "onyx",
    };
    return [
      {
        ...base,
        label,
        displayName: base.displayName ?? base.name ?? label,
        name: base.name ?? base.displayName ?? label,
        gender,
        voice: ensureVoiceMatchesGender(base.voice, gender),
      },
    ];
  }

  /** @type {Array<{ label: string, spoken: string, gender: 'male'|'female'|null }>} */
  const labelInfos = labels.map((label) => {
    const spoken = textForLabel(transcript, section, label);
    return {
      label,
      spoken,
      gender: inferGenderForTranscriptLabel(label, spoken),
    };
  });

  const unused = profiles.map((p, i) => ({ profile: p, index: i }));
  /** @type {Map<string, object>} */
  const assigned = new Map();

  const takeProfile = (predicate) => {
    const idx = unused.findIndex((u) => predicate(u.profile));
    if (idx < 0) return null;
    return unused.splice(idx, 1)[0].profile;
  };

  // 1) Exact label match
  for (const info of labelInfos) {
    const key = info.label.toLowerCase();
    const match = takeProfile(
      (p) => String(p.label ?? "").trim().toLowerCase() === key
    );
    if (match) assigned.set(info.label, match);
  }

  // 2) First-name match (Hannah → Student A named Hannah Cooper)
  for (const info of labelInfos) {
    if (assigned.has(info.label)) continue;
    const key = info.label.toLowerCase();
    const match = takeProfile((p) => profileFirstName(p) === key);
    if (match) assigned.set(info.label, match);
  }

  // 3) Gender match for remaining
  for (const info of labelInfos) {
    if (assigned.has(info.label)) continue;
    if (!info.gender) continue;
    const match = takeProfile((p) => p.gender === info.gender);
    if (match) assigned.set(info.label, match);
  }

  // 4) Fill remaining in order
  for (const info of labelInfos) {
    if (assigned.has(info.label)) continue;
    const match = takeProfile(() => true);
    if (match) {
      assigned.set(info.label, match);
    } else {
      assigned.set(info.label, {
        label: info.label,
        name: info.label,
        gender: info.gender ?? "male",
        voice: info.gender === "female" ? "nova" : "onyx",
      });
    }
  }

  const usedVoices = new Set();
  let maleSlot = 0;
  let femaleSlot = 0;

  return labelInfos.map((info, i) => {
    const base = assigned.get(info.label) ?? {};
    const gender =
      info.gender ??
      (base.gender === "male" || base.gender === "female"
        ? base.gender
        : inferGenderFromName(base.displayName ?? base.name) ??
          (i % 2 === 0 ? "male" : "female"));

    let voice = ensureVoiceMatchesGender(base.voice, gender);
    if (usedVoices.has(voice)) {
      voice = pickDistinctVoice(
        gender,
        gender === "female" ? femaleSlot++ : maleSlot++,
        usedVoices
      );
    } else {
      usedVoices.add(voice);
      if (gender === "female") femaleSlot += 1;
      else maleSlot += 1;
    }

    const displayName = String(
      base.displayName ?? base.name ?? info.label
    ).trim();

    return {
      ...base,
      label: info.label,
      displayName,
      name: displayName,
      gender,
      voice,
      role: base.role,
    };
  });
}

/**
 * Resolve the OpenAI voice for one speech turn after binding.
 * @param {string} speakerLabel
 * @param {number} sectionNumber
 * @param {Array<object>} boundSpeakers
 */
export function getBoundVoiceForSpeaker(
  speakerLabel,
  sectionNumber,
  boundSpeakers
) {
  const key = normalizeSpeakerKey(speakerLabel).toLowerCase();
  const profile = (boundSpeakers ?? []).find(
    (s) => String(s.label ?? "").trim().toLowerCase() === key
  );
  if (profile?.voice) {
    return ensureVoiceMatchesGender(profile.voice, profile.gender);
  }
  const gender = inferGenderFromName(speakerLabel);
  return gender === "female" ? "nova" : "onyx";
}
