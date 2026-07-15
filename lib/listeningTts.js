import {
  SILENCE_500_MS_B64,
  SILENCE_1000_MS_B64,
} from "./mp3SilenceBuffers.js";
import {
  inferGenderFromSpeakerText,
  prepareTranscriptForListening,
  sanitizeSpeechTextForProfile,
} from "./listeningSpeakerAlignment.js";
import { getSpeakerProfileByLabel } from "./listeningSpeakerProfiles.js";
import {
  bindSpeakersForMultiVoice,
  getBoundVoiceForSpeaker,
} from "./listeningMultiVoiceBind.js";
import {
  getSpeedForSpeaker,
  getVoiceForSpeaker,
  normalizeSpeakerKey,
  parseTranscriptIntoSegments,
} from "./listeningTranscriptParse.js";

const VALID_VOICES = new Set([
  "alloy",
  "echo",
  "fable",
  "nova",
  "onyx",
  "shimmer",
]);

/** Fast model by default — tts-1-hd is too slow for multi-turn IELTS dialogue. */
const TTS_MODEL_FAST = "tts-1";
const TTS_MODEL_HD = "tts-1-hd";
/** 0.5s silence between speaker turns (IELTS turn-taking) */
const BETWEEN_SPEAKER_PAUSE_MS = 500;
/** Parallel OpenAI TTS calls (keeps order via indexed results) */
const SYNTH_CONCURRENCY = 6;

const SILENCE_500_MS = Buffer.from(SILENCE_500_MS_B64, "base64");
const SILENCE_1000_MS = Buffer.from(SILENCE_1000_MS_B64, "base64");

/**
 * Pre-encoded mono 24kHz MP3 silence (concat-safe with OpenAI TTS output).
 * @param {number} durationMs
 */
export function createMp3Silence(durationMs) {
  const ms = Math.max(50, durationMs);
  if (ms <= 600) return SILENCE_500_MS;
  if (ms <= 1100) return SILENCE_1000_MS;
  const count = Math.ceil(ms / 500);
  return Buffer.concat(Array.from({ length: count }, () => SILENCE_500_MS));
}

/**
 * Rough duration from MP3 byte size (~128 kbps).
 * @param {Buffer} buffer
 */
function estimateMp3DurationSec(buffer) {
  if (!buffer?.length) return 0;
  return buffer.length / ((128 * 1024) / 8);
}

/**
 * Merge consecutive speech turns from the same speaker to cut API round-trips.
 * @param {Array<{ type: string, speaker?: string, text?: string, durationMs?: number }>} segments
 */
export function mergeAdjacentSpeechSegments(segments) {
  /** @type {typeof segments} */
  const out = [];
  for (const seg of segments) {
    if (seg.type !== "speech" || !seg.text?.trim()) {
      out.push(seg);
      continue;
    }
    const key = normalizeSpeakerKey(seg.speaker).toLowerCase();
    const prev = out[out.length - 1];
    if (
      prev?.type === "speech" &&
      normalizeSpeakerKey(prev.speaker).toLowerCase() === key
    ) {
      prev.text = `${String(prev.text ?? "").trim()} ${String(seg.text).trim()}`.trim();
      continue;
    }
    out.push({ ...seg, text: String(seg.text).trim() });
  }
  return out;
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<unknown>} fn
 */
async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await fn(items[i], i);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

/**
 * @param {import('openai').default} openai
 * @param {string} text
 * @param {string} voice
 * @param {number} speed
 */
async function synthesizeSegment(openai, text, voice, speed, model = TTS_MODEL_FAST) {
  const clean = String(text ?? "").trim();
  if (!clean) return Buffer.alloc(0);

  // OpenAI speech input soft limit — keep chunks safe
  const clipped = clean.length > 4000 ? clean.slice(0, 4000) : clean;
  const voiceId = VALID_VOICES.has(voice) ? voice : "onyx";
  const mp3 = await openai.audio.speech.create({
    model,
    voice: voiceId,
    input: clipped,
    speed: Math.min(4, Math.max(0.25, speed)),
  });

  return Buffer.from(await mp3.arrayBuffer());
}

/**
 * Multi-voice TTS: each speaker turn with its voice, 0.5s pause on speaker change.
 * Uses parallel synthesis + merged turns so section audio can finish quickly.
 *
 * @param {import('openai').default} openai
 * @param {string} transcript
 * @param {number} sectionNumber
 */
export async function generateMultiVoiceAudio(
  openai,
  transcript,
  sectionNumber,
  speakers = [],
  options = {}
) {
  const ttsModel =
    options.model === "tts-1-hd" || options.quality === "hd"
      ? TTS_MODEL_HD
      : TTS_MODEL_FAST;
  const alignedTranscript = prepareTranscriptForListening(
    transcript,
    sectionNumber,
    speakers
  );
  const boundSpeakers = bindSpeakersForMultiVoice(
    alignedTranscript,
    sectionNumber,
    speakers
  );
  const rawSegments = parseTranscriptIntoSegments(alignedTranscript, sectionNumber);
  const segments = mergeAdjacentSpeechSegments(rawSegments);

  /** @type {{ seg: object, index: number, voice: string, speed: number, speakText: string }[]} */
  const jobs = [];
  let lastSpeakerKey = null;

  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    if (seg.type === "pause") continue;
    if (seg.type !== "speech" || !seg.text?.trim()) continue;

    const profile = getSpeakerProfileByLabel(
      seg.speaker,
      sectionNumber,
      boundSpeakers
    );
    let voice =
      getBoundVoiceForSpeaker(seg.speaker, sectionNumber, boundSpeakers) ||
      profile?.voice ||
      getVoiceForSpeaker(seg.speaker, sectionNumber, boundSpeakers);
    let speakText = seg.text;
    const textGender = inferGenderFromSpeakerText(seg.text);
    if (
      textGender &&
      profile?.gender &&
      textGender !== profile.gender &&
      profile.name
    ) {
      speakText = sanitizeSpeechTextForProfile(seg.text, profile);
    }
    const speed = getSpeedForSpeaker(seg.speaker, seg.text, sectionNumber);
    const speakerKey = normalizeSpeakerKey(seg.speaker).toLowerCase();
    jobs.push({
      seg,
      index: i,
      voice,
      speed,
      speakText,
      speakerKey,
      needsPauseBefore:
        lastSpeakerKey !== null && speakerKey !== lastSpeakerKey,
    });
    lastSpeakerKey = speakerKey;
  }

  const audioByJob = await mapPool(jobs, SYNTH_CONCURRENCY, async (job) => {
    const buf = await synthesizeSegment(
      openai,
      job.speakText,
      job.voice,
      job.speed,
      ttsModel
    );
    return buf;
  });

  const buffers = [];
  const timeline = [];
  let offsetSec = 0;

  const pushTimeline = (speaker, durationSec) => {
    if (durationSec <= 0) return;
    const profile = getSpeakerProfileByLabel(
      speaker,
      sectionNumber,
      boundSpeakers
    );
    timeline.push({
      speaker,
      name: profile?.displayName ?? profile?.name ?? speaker,
      gender: profile?.gender,
      voice: profile?.voice,
      startSec: offsetSec,
      endSec: offsetSec + durationSec,
    });
    offsetSec += durationSec;
  };

  // Rebuild timeline in segment order, inserting pauses from original structure
  let jobIdx = 0;
  lastSpeakerKey = null;
  for (const seg of segments) {
    if (seg.type === "pause") {
      const ms = seg.durationMs ?? 500;
      buffers.push(createMp3Silence(ms));
      offsetSec += ms / 1000;
      continue;
    }
    if (seg.type !== "speech" || !seg.text?.trim()) continue;

    const job = jobs[jobIdx];
    const audioBuf = audioByJob[jobIdx] ?? Buffer.alloc(0);
    jobIdx += 1;

    const speakerKey = normalizeSpeakerKey(seg.speaker).toLowerCase();
    if (lastSpeakerKey !== null && speakerKey !== lastSpeakerKey) {
      buffers.push(createMp3Silence(BETWEEN_SPEAKER_PAUSE_MS));
      offsetSec += BETWEEN_SPEAKER_PAUSE_MS / 1000;
    }
    lastSpeakerKey = speakerKey;

    if (audioBuf.length > 0) {
      buffers.push(audioBuf);
      pushTimeline(seg.speaker, estimateMp3DurationSec(audioBuf));
    }
  }

  if (buffers.length === 0) {
    const section = Number(sectionNumber);
    const fallbackSpeaker =
      section === 2 ? "Guide" : section === 4 ? "Lecturer" : "Speaker";
    const voice = getVoiceForSpeaker(
      fallbackSpeaker,
      sectionNumber,
      boundSpeakers
    );
    const speed = getSpeedForSpeaker(fallbackSpeaker, transcript, sectionNumber);
    const fallback = await synthesizeSegment(
      openai,
      String(transcript ?? "").trim(),
      voice,
      speed,
      ttsModel
    );
    const dur = estimateMp3DurationSec(fallback);
    return {
      buffer: fallback,
      timeline:
        dur > 0
          ? [{ speaker: fallbackSpeaker, startSec: 0, endSec: dur }]
          : [],
      segments,
    };
  }

  return {
    buffer: Buffer.concat(buffers),
    timeline,
    segments,
  };
}

export {
  parseTranscriptIntoSegments,
  getVoiceForSpeaker,
  getSpeedForSpeaker,
};
