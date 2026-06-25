/**
 * Section 1 speaker names, pair rotation, and scenario diversity.
 */

import {
  inferGenderFromName,
  MALE_VOICES,
  FEMALE_VOICES,
} from "./listeningSpeakerProfiles.js";
import {
  contentHasBannedEmails,
  emailFromDisplayName,
} from "./listeningSpeakerEmails.js";

/** Names that dominated generated content — never assign by default. */
export const OVERUSED_SECTION1_NAMES = new Set([
  "sarah mitchell",
  "sarah johnson",
  "david mitchell",
  "david johnson",
  "emma wilson",
  "michael harrison",
  "james harrison",
  "tom harrison",
  "robert mitchell",
  "sophie wilson",
]);

/** All listening sections — never use as defaults or generated speakers. */
export const BANNED_SPEAKER_NAMES = new Set([...OVERUSED_SECTION1_NAMES]);

/**
 * @param {string} name
 */
export function isBannedSpeakerName(name) {
  return isOverusedSection1SpeakerName(name);
}

const MALE_FULL_NAMES = [
  "James Carter",
  "Michael Brown",
  "David Wilson",
  "Daniel Harris",
  "Ryan Cooper",
  "Thomas Wright",
  "Andrew Clarke",
  "Benjamin Foster",
  "Christopher Reed",
  "Matthew Hughes",
  "Nathan Brooks",
  "Samuel Price",
  "Jonathan Gray",
  "Patrick Walsh",
  "Gregory Shaw",
  "Lawrence Hunt",
  "Philip Grant",
  "Victor Stone",
  "Adrian Blake",
  "Marcus Cole",
  "Oliver Bennett",
  "Henry Parker",
  "George Mills",
  "Edward Nash",
  "Richard Vaughan",
  "William Fraser",
  "Charles Dalton",
  "Anthony Pierce",
  "Stephen Boyd",
  "Timothy Cross",
  "Kenneth Doyle",
  "Brian Ellis",
  "Kevin Hardy",
  "Jason Ingram",
  "Paul Jennings",
  "Mark Kennedy",
  "Andrew Lloyd",
  "Peter Morrison",
  "Ian Nicholson",
  "Colin Osborne",
  "Derek Palmer",
  "Graham Quinn",
  "Neil Robertson",
  "Stuart Saunders",
  "Trevor Spencer",
  "Warren Tucker",
  "Brent Underwood",
  "Dean Vincent",
  "Earl Watson",
  "Felix Young",
];

const FEMALE_FULL_NAMES = [
  "Emily Roberts",
  "Emma Clark",
  "Olivia Turner",
  "Sophie Evans",
  "Jessica Morgan",
  "Rachel Adams",
  "Laura Bennett",
  "Hannah Cooper",
  "Charlotte Davis",
  "Victoria Ellis",
  "Grace Foster",
  "Chloe Gray",
  "Abigail Hayes",
  "Natalie Irving",
  "Rebecca Jenkins",
  "Michelle King",
  "Jennifer Lewis",
  "Amanda Martin",
  "Melissa Nelson",
  "Catherine Owen",
  "Elizabeth Parker",
  "Margaret Quinn",
  "Helen Richardson",
  "Diana Scott",
  "Julia Thompson",
  "Anna Underwood",
  "Lucy Vincent",
  "Kate Watson",
  "Claire Young",
  "Eleanor Barnes",
  "Caroline Bell",
  "Sophia Chapman",
  "Isabella Dean",
  "Mia Edwards",
  "Harper Fisher",
  "Avery Gordon",
  "Scarlett Hill",
  "Layla Irving",
  "Zoe Jackson",
  "Leah Kelly",
  "Brianna Lane",
  "Gabriella Moore",
  "Jasmine Neal",
  "Madison Ortiz",
  "Paige Palmer",
  "Brooke Quinn",
  "Taylor Reed",
  "Samantha Shaw",
  "Nicole Torres",
  "Stephanie Vaughan",
];

export const SECTION1_SCENARIOS = [
  "Accommodation booking enquiry",
  "Hotel room reservation",
  "University course registration",
  "Gym membership signup",
  "Travel agency flight booking",
  "Medical clinic appointment",
  "Public library membership",
  "Community event ticket booking",
  "Car rental reservation",
  "Childcare centre enrolment",
  "Sports club membership",
  "Language school course enquiry",
  "Museum membership registration",
  "Pharmacy prescription collection",
  "Conference registration desk",
  "Furniture delivery scheduling",
  "Apartment rental viewing",
  "Driving lesson booking",
  "Insurance policy enquiry",
  "Visa application advice call",
  "Volunteer programme signup",
  "Recycling centre permit",
  "Neighbourhood watch meeting",
  "Theatre ticket reservation",
  "Train season ticket enquiry",
];

/** @type {Array<{ id: string, speakerA: 'male'|'female', speakerB: 'male'|'female' }>} */
export const SECTION1_PAIR_TYPES = [
  { id: "male_female", speakerA: "male", speakerB: "female" },
  { id: "female_male", speakerA: "female", speakerB: "male" },
  { id: "male_male", speakerA: "male", speakerB: "male" },
  { id: "female_female", speakerA: "female", speakerB: "female" },
];

const MALE_VOICE_LIST = ["onyx", "echo", "fable"];
const FEMALE_VOICE_LIST = ["nova", "shimmer", "alloy"];

/**
 * @param {string} name
 */
export function isOverusedSection1SpeakerName(name) {
  const key = String(name ?? "").trim().toLowerCase();
  if (!key) return false;
  if (OVERUSED_SECTION1_NAMES.has(key)) return true;
  if (/\bsarah\s+(mitchell|johnson)\b/i.test(key)) return true;
  if (/\bdavid\s+(mitchell|johnson)\b/i.test(key)) return true;
  if (/\bmitchell\b/i.test(key) && /\b(sarah|david)\b/i.test(key)) return true;
  if (/\bjohnson\b/i.test(key) && /\b(sarah|david)\b/i.test(key)) return true;
  return false;
}

/**
 * @param {string} seed
 */
function hashSeed(seed) {
  let h = 0;
  const s = String(seed ?? "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * @param {string[]} excludeTopics
 */
export function pickSection1Topic(excludeTopics = []) {
  const excluded = new Set(
    (excludeTopics ?? []).map((t) => String(t).trim().toLowerCase())
  );
  const available = SECTION1_SCENARIOS.filter(
    (t) => !excluded.has(t.trim().toLowerCase())
  );
  const pool = available.length > 0 ? available : SECTION1_SCENARIOS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * @param {'male'|'female'} gender
 * @param {string[]} excludeNames
 */
function pickNameForGender(gender, excludeNames) {
  const pool = gender === "female" ? FEMALE_FULL_NAMES : MALE_FULL_NAMES;
  const excluded = new Set(
    (excludeNames ?? []).map((n) => String(n).trim().toLowerCase())
  );
  const candidates = pool.filter((name) => {
    const key = name.toLowerCase();
    if (excluded.has(key)) return false;
    if (isOverusedSection1SpeakerName(name)) return false;
    const inferred = inferGenderFromName(name);
    return !inferred || inferred === gender;
  });
  const usable = candidates.length > 0 ? candidates : pool;
  return usable[Math.floor(Math.random() * usable.length)];
}

/**
 * @param {'male'|'female'} gender
 * @param {string[]} excludeNames
 * @param {string} seedKey
 */
function pickNameForGenderDeterministic(gender, excludeNames, seedKey) {
  const pool = gender === "female" ? FEMALE_FULL_NAMES : MALE_FULL_NAMES;
  const excluded = new Set(
    (excludeNames ?? []).map((n) => String(n).trim().toLowerCase())
  );
  const candidates = pool.filter((name) => {
    const key = name.toLowerCase();
    if (excluded.has(key)) return false;
    if (isOverusedSection1SpeakerName(name)) return false;
    const inferred = inferGenderFromName(name);
    return !inferred || inferred === gender;
  });
  const usable = candidates.length > 0 ? candidates : pool;
  const idx = hashSeed(seedKey) % usable.length;
  return usable[idx];
}

/**
 * @param {'male'|'female'} gender
 * @param {number} index
 */
function voiceForGender(gender, index = 0) {
  const list = gender === "female" ? FEMALE_VOICE_LIST : MALE_VOICE_LIST;
  const voice = list[index % list.length];
  if (gender === "female" && FEMALE_VOICES.has(voice)) return voice;
  if (gender === "male" && MALE_VOICES.has(voice)) return voice;
  return gender === "female" ? "nova" : "onyx";
}

/**
 * @param {object} [options]
 * @param {string[]} [options.excludePairKeys]
 * @param {string[]} [options.excludeNames]
 * @param {string} [options.preferPairType]
 * @param {string} [options.testSeed] — stable unique pair per test row
 */
export function pickSection1SpeakerPair(options = {}) {
  const excludePairKeys = new Set(
    (options.excludePairKeys ?? []).map((k) => String(k).trim().toLowerCase())
  );
  const excludeNames = [...(options.excludeNames ?? [])];

  if (options.testSeed) {
    const h = hashSeed(options.testSeed);
    const pairTypes = options.preferPairType
      ? SECTION1_PAIR_TYPES.filter((p) => p.id === options.preferPairType)
      : SECTION1_PAIR_TYPES;
    const pairType = pairTypes[h % pairTypes.length];
    const nameA = pickNameForGenderDeterministic(
      pairType.speakerA,
      excludeNames,
      `${options.testSeed}:a`
    );
    const nameB = pickNameForGenderDeterministic(
      pairType.speakerB,
      [...excludeNames, nameA],
      `${options.testSeed}:b`
    );
    const pairKey = `${nameA}|${nameB}`.toLowerCase();
    if (!excludePairKeys.has(pairKey) && nameA !== nameB) {
      return {
        speakers: [
          {
            label: "Speaker A",
            name: nameA,
            gender: pairType.speakerA,
            voice: voiceForGender(pairType.speakerA, h % 3),
            role: "staff",
          },
          {
            label: "Speaker B",
            name: nameB,
            gender: pairType.speakerB,
            voice: voiceForGender(pairType.speakerB, (h + 1) % 3),
            role: "customer",
          },
        ],
        pairKey,
        pairType: pairType.id,
      };
    }
  }

  const pairTypes = options.preferPairType
    ? SECTION1_PAIR_TYPES.filter((p) => p.id === options.preferPairType)
    : SECTION1_PAIR_TYPES;

  const shuffledTypes = [...pairTypes].sort(() => Math.random() - 0.5);

  for (const pairType of shuffledTypes) {
    const nameA = pickNameForGender(pairType.speakerA, excludeNames);
    excludeNames.push(nameA);
    const nameB = pickNameForGender(pairType.speakerB, excludeNames);
    const pairKey = `${nameA}|${nameB}`.toLowerCase();

    if (excludePairKeys.has(pairKey)) continue;
    if (nameA.toLowerCase() === nameB.toLowerCase()) continue;

    const speakers = [
      {
        label: "Speaker A",
        name: nameA,
        gender: pairType.speakerA,
        voice: voiceForGender(pairType.speakerA, 0),
        role: "staff",
      },
      {
        label: "Speaker B",
        name: nameB,
        gender: pairType.speakerB,
        voice: voiceForGender(pairType.speakerB, 1),
        role: "customer",
      },
    ];

    return {
      speakers,
      pairKey,
      pairType: pairType.id,
    };
  }

  const pairType = SECTION1_PAIR_TYPES[0];
  const nameA = pickNameForGender(pairType.speakerA, excludeNames);
  const nameB = pickNameForGender(pairType.speakerB, [...excludeNames, nameA]);
  const speakers = [
    {
      label: "Speaker A",
      name: nameA,
      gender: pairType.speakerA,
      voice: voiceForGender(pairType.speakerA, 0),
      role: "staff",
    },
    {
      label: "Speaker B",
      name: nameB,
      gender: pairType.speakerB,
      voice: voiceForGender(pairType.speakerB, 1),
      role: "customer",
    },
  ];
  return {
    speakers,
    pairKey: `${nameA}|${nameB}`.toLowerCase(),
    pairType: pairType.id,
  };
}

/**
 * @param {Array<{ label: string, name: string, gender: string, voice: string, role?: string }>} speakers
 */
export function buildSection1SpeakerPromptInstructions(speakers) {
  const a = speakers.find((s) => s.label === "Speaker A");
  const b = speakers.find((s) => s.label === "Speaker B");
  if (!a || !b) return "";

  const staffRole =
    a.gender === "male" ? "he/him" : a.gender === "female" ? "she/her" : "they";
  const customerRole =
    b.gender === "male" ? "he/him" : b.gender === "female" ? "she/her" : "they";

  return `Speaker A is the staff member (${a.gender}) — full name MUST be exactly "${a.name}". Use ${staffRole} when referring to staff.
Speaker B is the customer (${b.gender}) — full name MUST be exactly "${b.name}". Use ${customerRole} when referring to the customer.
In the "speakers" array use EXACTLY:
[{ "label": "Speaker A", "name": "${a.name}" }, { "label": "Speaker B", "name": "${b.name}" }]
CRITICAL: Speaker A lines are ONLY spoken by ${a.name} (staff). Speaker B lines are ONLY spoken by ${b.name} (customer).
Never swap roles. Never use Sarah Mitchell, Sarah Johnson, David Mitchell, or David Johnson.
Never use sarah.mitchell@email.com, sarah.johnson@email.com, or david.mitchell@email.com.
Customer email MUST be exactly: ${emailFromDisplayName(b.name)} (derive from customer name only).
Male speakers must use male names; female speakers must use female names.`;
}

/**
 * @param {string} transcript
 * @param {Array<{ name: string }>} fromSpeakers
 * @param {Array<{ name: string }>} toSpeakers
 */
export function replaceSpeakerNamesInTranscript(
  transcript,
  fromSpeakers,
  toSpeakers
) {
  let text = String(transcript ?? "");
  const count = Math.min(fromSpeakers.length, toSpeakers.length);

  for (let i = 0; i < count; i++) {
    const oldName = String(fromSpeakers[i]?.name ?? "").trim();
    const newName = String(toSpeakers[i]?.name ?? "").trim();
    if (!oldName || !newName || oldName === newName) continue;

    text = text.split(oldName).join(newName);

    const oldFirst = oldName.split(/\s+/)[0];
    const newFirst = newName.split(/\s+/)[0];
    if (oldFirst && newFirst && oldFirst !== newFirst) {
      const re = new RegExp(`\\b${escapeRegExp(oldFirst)}\\b`, "g");
      text = text.replace(re, newFirst);
    }
  }

  return text;
}

/**
 * @param {string} s
 */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Refresh overused Section 1 speakers in banked or live payloads.
 * @param {object} payload
 * @param {object} [options]
 * @param {string[]} [options.excludePairKeys]
 */
export function diversifySection1Payload(payload, options = {}) {
  if (Number(payload?.section) !== 1 && Number(payload?.section_number) !== 1) {
    return payload;
  }

  const currentSpeakers = Array.isArray(payload.speakers) ? payload.speakers : [];
  const transcriptText = String(payload.transcript ?? "");
  const questionsText = JSON.stringify(payload.questions ?? []);
  const needsRefresh =
    currentSpeakers.some((s) => isOverusedSection1SpeakerName(s?.name)) ||
    contentHasBannedLegacySpeakerRefs(transcriptText) ||
    contentHasBannedLegacySpeakerRefs(questionsText);

  if (!needsRefresh && currentSpeakers.length >= 2) {
    const genderCheck = currentSpeakers.every(
      (s) =>
        s.gender === "male" ||
        s.gender === "female" ||
        inferGenderFromName(s.name)
    );
    if (genderCheck) return payload;
  }

  const usedNames = currentSpeakers.map((s) => s.name).filter(Boolean);
  const { speakers: newSpeakers, pairKey } = pickSection1SpeakerPair({
    excludePairKeys: options.excludePairKeys ?? [],
    excludeNames: usedNames,
  });

  const transcript = replaceSpeakerNamesInTranscript(
    payload.transcript ?? "",
    currentSpeakers.length >= 2 ? currentSpeakers : getPlaceholderSpeakers(),
    newSpeakers
  );

  return {
    ...payload,
    section: 1,
    speakers: newSpeakers,
    speakerPairKey: pairKey,
    transcript,
  };
}

function getPlaceholderSpeakers() {
  return pickSection1SpeakerPair().speakers;
}

/**
 * @param {string} transcript
 */
export function transcriptHasBannedNames(transcript) {
  const lower = String(transcript ?? "").toLowerCase();
  for (const banned of OVERUSED_SECTION1_NAMES) {
    if (lower.includes(banned)) return true;
  }
  if (/\bsarah\s+(?:mitchell|johnson)\b/i.test(transcript)) return true;
  if (/\bdavid\s+(?:mitchell|johnson)\b/i.test(transcript)) return true;
  return false;
}

/**
 * Names or legacy emails (e.g. sarah.mitchell@email.com) in user-facing content.
 * @param {string} text
 */
export function contentHasBannedLegacySpeakerRefs(text) {
  if (transcriptHasBannedNames(text)) return true;
  return contentHasBannedEmails(text);
}

/**
 * @param {string} pairKey
 * @param {string[]} speakerNames
 */
export function registerSection1GenerationUsage(pairKey, speakerNames, topic) {
  return {
    pairKey: String(pairKey ?? "").toLowerCase(),
    names: (speakerNames ?? []).map((n) => String(n).trim()),
    topic: String(topic ?? "").trim(),
  };
}
