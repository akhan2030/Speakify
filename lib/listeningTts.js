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

const TTS_MODEL = "tts-1-hd";
/** 0.5s silence between speaker turns (IELTS turn-taking) */
const BETWEEN_SPEAKER_PAUSE_MS = 500;

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
  return buffer.length / (128 * 1024 / 8);
}

/**
 * @param {import('openai').default} openai
 * @param {string} text
 * @param {string} voice
 * @param {number} speed
 */
async function synthesizeSegment(openai, text, voice, speed, model = TTS_MODEL) {
  const clean = String(text ?? "").trim();
  if (!clean) return Buffer.alloc(0);

  const voiceId = VALID_VOICES.has(voice) ? voice : "onyx";
  const mp3 = await openai.audio.speech.create({
    model,
    voice: voiceId,
    input: clean,
    speed: Math.min(4, Math.max(0.25, speed)),
  });

  return Buffer.from(await mp3.arrayBuffer());
}

/**
 * Multi-voice TTS: each speaker turn with its voice, 0.5s pause on speaker change.
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
  const ttsModel = options.model === "tts-1" ? "tts-1" : TTS_MODEL;
  const alignedTranscript = prepareTranscriptForListening(
    transcript,
    sectionNumber,
    speakers
  );
  const segments = parseTranscriptIntoSegments(alignedTranscript, sectionNumber);
  const buffers = [];
  const timeline = [];
  let offsetSec = 0;
  let lastSpeakerKey = null;

  const pushTimeline = (speaker, durationSec) => {
    if (durationSec <= 0) return;
    const profile = getSpeakerProfileByLabel(
      speaker,
      sectionNumber,
      speakers
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

  for (const seg of segments) {
    if (seg.type === "pause") {
      const ms = seg.durationMs ?? 500;
      buffers.push(createMp3Silence(ms));
      offsetSec += ms / 1000;
      continue;
    }

    if (seg.type !== "speech" || !seg.text?.trim()) continue;

    const speakerKey = normalizeSpeakerKey(seg.speaker).toLowerCase();
    if (lastSpeakerKey !== null && speakerKey !== lastSpeakerKey) {
      buffers.push(createMp3Silence(BETWEEN_SPEAKER_PAUSE_MS));
      offsetSec += BETWEEN_SPEAKER_PAUSE_MS / 1000;
    }
    lastSpeakerKey = speakerKey;

    const profile = getSpeakerProfileByLabel(
      seg.speaker,
      sectionNumber,
      speakers
    );
    let voice =
      profile?.voice ?? getVoiceForSpeaker(seg.speaker, sectionNumber, speakers);
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
    const audioBuf = await synthesizeSegment(
      openai,
      speakText,
      voice,
      speed,
      ttsModel
    );

    if (audioBuf.length > 0) {
      buffers.push(audioBuf);
      pushTimeline(seg.speaker, estimateMp3DurationSec(audioBuf));
    }
  }

  if (buffers.length === 0) {
    const section = Number(sectionNumber);
    const fallbackSpeaker =
      section === 2 ? "Guide" : section === 4 ? "Lecturer" : "Speaker";
    const voice = getVoiceForSpeaker(fallbackSpeaker, sectionNumber, speakers);
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
