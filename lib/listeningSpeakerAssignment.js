/**
 * Central speaker assignment for all listening sections (generation, bank load, TTS).
 */

import {
  BANNED_SPEAKER_NAMES,
  buildSection1SpeakerPromptInstructions,
  diversifySection1Payload,
  isBannedSpeakerName,
  pickSection1SpeakerPair,
} from "./listeningSection1Diversity.js";
import { inferGenderFromName } from "./listeningSpeakerProfiles.js";

export { BANNED_SPEAKER_NAMES, isBannedSpeakerName };

const MALE_POOL_SECTIONS_2_4 = [
  "Oliver Bennett",
  "Nathan Brooks",
  "Patrick Walsh",
  "Gregory Shaw",
  "Philip Grant",
  "Marcus Cole",
  "Timothy Cross",
  "Brian Ellis",
  "Jason Ingram",
  "Colin Osborne",
  "Graham Quinn",
  "Stuart Saunders",
  "Warren Tucker",
  "Felix Young",
  "Adrian Blake",
  "Henry Parker",
  "George Mills",
  "Richard Vaughan",
  "Charles Dalton",
  "Anthony Pierce",
];

const FEMALE_POOL_SECTIONS_2_4 = [
  "Hannah Cooper",
  "Victoria Ellis",
  "Natalie Irving",
  "Catherine Owen",
  "Diana Scott",
  "Julia Thompson",
  "Claire Young",
  "Eleanor Barnes",
  "Isabella Dean",
  "Harper Fisher",
  "Avery Gordon",
  "Layla Irving",
  "Brianna Lane",
  "Brooke Quinn",
  "Taylor Reed",
  "Nicole Torres",
  "Stephanie Vaughan",
  "Paige Palmer",
  "Gabriella Moore",
  "Madison Ortiz",
];

/**
 * @param {'male'|'female'} gender
 * @param {string[]} exclude
 */
function pickName(gender, exclude = []) {
  const pool = gender === "female" ? FEMALE_POOL_SECTIONS_2_4 : MALE_POOL_SECTIONS_2_4;
  const excluded = new Set(exclude.map((n) => n.toLowerCase()));
  const candidates = pool.filter((n) => {
    if (excluded.has(n.toLowerCase())) return false;
    if (isBannedSpeakerName(n)) return false;
    const inferred = inferGenderFromName(n);
    return !inferred || inferred === gender;
  });
  const usable = candidates.length > 0 ? candidates : pool;
  return usable[Math.floor(Math.random() * usable.length)];
}

/**
 * @param {'male'|'female'} gender
 * @param {number} i
 */
function voiceFor(gender, i = 0) {
  const list =
    gender === "female"
      ? ["nova", "shimmer", "alloy"]
      : ["onyx", "echo", "fable"];
  return list[i % list.length];
}

/**
 * @param {number} sectionNumber
 * @param {object} [options]
 * @param {string[]} [options.excludeNames]
 * @param {string[]} [options.excludePairKeys] — Section 1 only
 * @param {string} [options.preferPairType] — Section 1 only
 */
export function pickSpeakersForSection(sectionNumber, options = {}) {
  const section = Number(sectionNumber);
  const excludeNames = options.excludeNames ?? [];

  if (section === 1) {
    return pickSection1SpeakerPair({
      excludePairKeys: options.excludePairKeys ?? [],
      excludeNames,
      preferPairType: options.preferPairType,
      testSeed: options.testSeed,
    });
  }

  if (section === 2) {
    const name = pickName("male", excludeNames);
    return {
      speakers: [
        {
          label: "Guide",
          name,
          gender: "male",
          voice: voiceFor("male", 0),
          role: "guide",
        },
      ],
      pairKey: name.toLowerCase(),
    };
  }

  if (section === 3) {
    const tutor = pickName("male", excludeNames);
    const studentA = pickName("female", [...excludeNames, tutor]);
    const studentB = pickName("male", [...excludeNames, tutor, studentA]);
    return {
      speakers: [
        {
          label: "Tutor",
          name: tutor,
          gender: "male",
          voice: voiceFor("male", 0),
          role: "tutor",
        },
        {
          label: "Student A",
          name: studentA,
          gender: "female",
          voice: voiceFor("female", 0),
          role: "student",
        },
        {
          label: "Student B",
          name: studentB,
          gender: "male",
          voice: voiceFor("male", 1),
          role: "student",
        },
      ],
      pairKey: `${tutor}|${studentA}|${studentB}`.toLowerCase(),
    };
  }

  if (section === 4) {
    const lecturer = pickName("male", excludeNames);
    const questioner = pickName("female", [...excludeNames, lecturer]);
    return {
      speakers: [
        {
          label: "Lecturer",
          name: lecturer,
          gender: "male",
          voice: voiceFor("male", 0),
          role: "lecturer",
        },
        {
          label: "Question",
          name: questioner,
          gender: "female",
          voice: voiceFor("female", 0),
          role: "questioner",
        },
      ],
      pairKey: `${lecturer}|${questioner}`.toLowerCase(),
    };
  }

  return { speakers: [], pairKey: "" };
}

/**
 * @param {number} sectionNumber
 * @param {Array<{ label: string, name: string, gender: string }>} speakers
 */
export function buildSpeakerPromptForSection(sectionNumber, speakers) {
  const section = Number(sectionNumber);

  if (section === 1 && speakers?.length >= 2) {
    return buildSection1SpeakerPromptInstructions(speakers);
  }

  if (section === 2 && speakers?.[0]) {
    const g = speakers[0];
    return `The guide MUST be male — use exactly "${g.name}". speakers: [{ "label": "Guide", "name": "${g.name}" }]`;
  }

  if (section === 3 && speakers?.length >= 3) {
    const [tutor, sa, sb] = speakers;
    return `Tutor MUST be male — "${tutor.name}".
Student A MUST be female — "${sa.name}".
Student B MUST be male — "${sb.name}".
speakers: [
  { "label": "Tutor", "name": "${tutor.name}" },
  { "label": "Student A", "name": "${sa.name}" },
  { "label": "Student B", "name": "${sb.name}" }
]
Never assign a female name to Tutor or Student B. Never assign a male name to Student A.
Do not use Harrison, Mitchell, Wilson, or Johnson surnames.`;
  }

  if (section === 4 && speakers?.length >= 1) {
    const lecturer = speakers.find((s) => s.label === "Lecturer") ?? speakers[0];
    const question = speakers.find((s) => s.label === "Question");
    const qLine = question
      ? `If a student asks a question, use female name "${question.name}" for Question speaker.`
      : "";
    return `Lecturer is male — use exactly "${lecturer.name}". ${qLine}
Do not use Mitchell, Harrison, or Wilson surnames.`;
  }

  return "";
}

/**
 * @param {Array<{ name?: string }>} speakers
 * @param {string} [transcript]
 */
export function section1SpeakersNeedRefresh(speakers, transcript = "") {
  const list = Array.isArray(speakers) ? speakers : [];
  if (list.some((s) => isBannedSpeakerName(s?.name))) return true;
  if (list.length < 2) return true;
  if (transcriptHasBannedNames(transcript)) return true;
  return false;
}

/**
 * @param {object} payload — section 1
 * @param {object} [options]
 */
export function ensureSection1SpeakersFresh(payload, options = {}) {
  if (section1SpeakersNeedRefresh(payload.speakers, payload.transcript)) {
    return diversifySection1Payload(payload, options);
  }
  return payload;
}
