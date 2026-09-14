/**
 * ElevenLabs neural voices for IELTS Academic Listening.
 * Accent mix mirrors the real test (mostly British, plus AU / NZ / North American).
 * Override any ID with env vars — never use browser TTS or gTTS for exam audio.
 */

export type ListeningAccent =
  | "british"
  | "australian"
  | "new_zealand"
  | "north_american";

export type ListeningVoiceSlot = {
  accent: ListeningAccent;
  gender: "male" | "female";
  elevenLabsVoiceId: string;
  label: string;
};

/**
 * Exam narrator — Bryn (verified TTS). Must never be reused for a content speaker.
 */
export const DEFAULT_EXAMINER_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";

/** Public ElevenLabs premade voices — replace via env in production. */
const DEFAULT_SLOTS: Record<string, ListeningVoiceSlot> = {
  examiner: {
    accent: "british",
    gender: "female",
    elevenLabsVoiceId:
      process.env.ELEVENLABS_VOICE_EXAMINER ?? DEFAULT_EXAMINER_VOICE_ID,
    label: "Exam narrator (Alice, British, consistent across sections)",
  },
  gb_female: {
    accent: "british",
    gender: "female",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_GB_FEMALE ?? "XB0fDUnXU5powFXDhCwa",
    label: "British female (Charlotte)",
  },
  gb_male: {
    accent: "british",
    gender: "male",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_GB_MALE ?? "onwK4e9ZLuTAKqWW03F9",
    label: "British male (Daniel)",
  },
  au_female: {
    accent: "australian",
    gender: "female",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_AU_FEMALE ?? "XrExE9yKIg1WjnnlVkGX",
    label: "Australian female (Matilda)",
  },
  au_male: {
    accent: "australian",
    gender: "male",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_AU_MALE ?? "IKne3meq5aSn9XLyUdCD",
    label: "Australian male (Charlie)",
  },
  nz_female: {
    accent: "new_zealand",
    gender: "female",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_NZ_FEMALE ?? "pFZP5JQG7iQjIQuC4Bku",
    label: "NZ-leaning female (Lily)",
  },
  us_female: {
    accent: "north_american",
    gender: "female",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_US_FEMALE ?? "EXAVITQu4vr4xnSDxMaL",
    label: "North American female (Sarah)",
  },
  us_male: {
    accent: "north_american",
    gender: "male",
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_US_MALE ?? "iP95p4xoKVk53GoZ742B",
    label: "North American male (Chris)",
  },
};

export function isElevenLabsListeningEnabled(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export function resolveAccent(value: unknown): ListeningAccent {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (v === "australian" || v === "australia" || v === "en_au") return "australian";
  if (v === "new_zealand" || v === "nz" || v === "en_nz") return "new_zealand";
  if (
    v === "north_american" ||
    v === "american" ||
    v === "us" ||
    v === "en_us" ||
    v === "canadian"
  ) {
    return "north_american";
  }
  return "british";
}

export function slotForAccentGender(
  accent: ListeningAccent,
  gender: "male" | "female"
): ListeningVoiceSlot {
  if (accent === "australian") {
    return gender === "female" ? DEFAULT_SLOTS.au_female : DEFAULT_SLOTS.au_male;
  }
  if (accent === "new_zealand") {
    return gender === "female" ? DEFAULT_SLOTS.nz_female : DEFAULT_SLOTS.au_male;
  }
  if (accent === "north_american") {
    return gender === "female" ? DEFAULT_SLOTS.us_female : DEFAULT_SLOTS.us_male;
  }
  return gender === "female" ? DEFAULT_SLOTS.gb_female : DEFAULT_SLOTS.gb_male;
}

export function examinerVoiceSlot(): ListeningVoiceSlot {
  return DEFAULT_SLOTS.examiner;
}

/** All content-speaker IDs — examiner is excluded so roles never collide. */
export function contentVoiceIds(): string[] {
  return Object.entries(DEFAULT_SLOTS)
    .filter(([key]) => key !== "examiner")
    .map(([, slot]) => slot.elevenLabsVoiceId);
}

/** Map legacy OpenAI TTS voice names onto neural ElevenLabs IDs. */
export function elevenLabsIdForOpenAiVoice(voice: string): string {
  const v = String(voice ?? "").trim().toLowerCase();
  if (v === "nova") return DEFAULT_SLOTS.gb_female.elevenLabsVoiceId;
  if (v === "shimmer") return DEFAULT_SLOTS.au_female.elevenLabsVoiceId;
  if (v === "alloy") return DEFAULT_SLOTS.us_female.elevenLabsVoiceId;
  if (v === "fable") return DEFAULT_SLOTS.au_male.elevenLabsVoiceId;
  if (v === "echo") return DEFAULT_SLOTS.us_male.elevenLabsVoiceId;
  return DEFAULT_SLOTS.gb_male.elevenLabsVoiceId;
}

/**
 * Stable accent mix across a 4-section paper so students hear diversity,
 * while each speaker stays on one voice for the whole section.
 */
export function suggestedAccentForSectionSpeaker(
  sectionNumber: number,
  speakerIndex: number
): ListeningAccent {
  const section = Number(sectionNumber);
  const mix: ListeningAccent[][] = [
    [],
    ["british", "british"],
    ["australian"],
    ["british", "north_american", "british", "australian"],
    ["british"],
  ];
  const row = mix[section] ?? ["british"];
  return row[speakerIndex % row.length] ?? "british";
}

export function catalogSnapshot(): ListeningVoiceSlot[] {
  return Object.values(DEFAULT_SLOTS);
}
