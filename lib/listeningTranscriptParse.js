/**
 * Pure transcript parsing & timing estimates (client + server safe).
 */

import { getVoiceForSpeakerLabel } from "./listeningSpeakerProfiles.js";

const SPEAKER_LABEL_RE =
  /^((?:Speaker\s+[A-Z]|Tutor|Student\s+[A-Z]|Student|Narrator|Guide|Lecturer|Question(?:er)?)):\s*(.*)$/i;

/**
 * @param {string} speaker
 * @param {number} sectionNumber
 */
export function normalizeSpeakerKey(speaker) {
  return String(speaker ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * @param {string} label
 */
export function getSpeakerDotColor(label) {
  const key = normalizeSpeakerKey(label).toLowerCase();
  if (key === "speaker a") return "#c9972c";
  if (key === "speaker b") return "#0d9488";
  if (key === "tutor") return "#0d1b35";
  if (key === "student a") return "#7c3aed";
  if (key === "student b") return "#2563eb";
  if (key === "student c") return "#0891b2";
  if (key === "lecturer" || key === "guide" || key === "narrator") return "#c9972c";
  return "#c9972c";
}

/**
 * OpenAI TTS voice per speaker label — gender-matched via section speaker profiles.
 * @param {string} speaker
 * @param {number} sectionNumber
 * @param {Array<{ label: string, voice?: string, name?: string, gender?: string }>} [speakers]
 */
export function getVoiceForSpeaker(speaker, sectionNumber, speakers) {
  return getVoiceForSpeakerLabel(speaker, sectionNumber, speakers);
}

/**
 * @param {string} speaker
 * @param {string} text
 * @param {number} sectionNumber
 */
export function getSpeedForSpeaker(speaker, text, sectionNumber) {
  const key = normalizeSpeakerKey(speaker).toLowerCase();
  const section = Number(sectionNumber);
  const lower = String(text ?? "").toLowerCase();

  if (section === 4 || key === "lecturer") return 0.85;
  if (key === "tutor") return 0.88;
  if (key.includes("student")) return 0.95;
  if (/\?/.test(text) || lower.startsWith("do you") || lower.startsWith("could you")) {
    return 0.95;
  }
  if (/!/.test(text) || lower.includes("great") || lower.includes("wonderful")) {
    return 1.0;
  }
  if (key === "speaker a" && section === 1) return 0.88;
  return 0.92;
}

/**
 * Split text chunk by inline pause markers.
 * @param {string} text
 * @returns {Array<{ type: 'speech'|'pause', text?: string, durationMs?: number }>}
 */
function splitInlinePauses(text) {
  const parts = [];
  let lastIndex = 0;
  const re = /\[long pause\]|\[pause\]/gi;
  let match;

  while ((match = re.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before) parts.push({ type: "speech", text: before });
    const isLong = match[0].toLowerCase().includes("long");
    parts.push({ type: "pause", durationMs: isLong ? 1000 : 500 });
    lastIndex = match.index + match[0].length;
  }

  const rest = text.slice(lastIndex).trim();
  if (rest) parts.push({ type: "speech", text: rest });

  return parts.length > 0 ? parts : [{ type: "speech", text: text.trim() }];
}

/**
 * @param {string} transcript
 * @param {number} sectionNumber
 * @returns {Array<{ type: 'speech'|'pause', speaker?: string, text?: string, durationMs?: number }>}
 */
export function parseTranscriptIntoSegments(transcript, sectionNumber) {
  const section = Number(sectionNumber);
  const lines = String(transcript ?? "").split(/\r?\n/);
  const segments = [];
  let current = null;

  const flushSpeech = () => {
    if (!current?.text?.trim()) return;
    const speaker = current.speaker;
    const chunks = splitInlinePauses(current.text.trim());
    for (const chunk of chunks) {
      if (chunk.type === "pause") {
        segments.push({ type: "pause", durationMs: chunk.durationMs });
      } else if (chunk.text) {
        segments.push({ type: "speech", speaker, text: chunk.text });
      }
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^\[long pause\]$/i.test(trimmed)) {
      flushSpeech();
      segments.push({ type: "pause", durationMs: 1000 });
      continue;
    }
    if (/^\[pause\]$/i.test(trimmed)) {
      flushSpeech();
      segments.push({ type: "pause", durationMs: 500 });
      continue;
    }
    if (/^\[SECTION BREAK\]$/i.test(trimmed)) {
      flushSpeech();
      continue;
    }

    const match = trimmed.match(SPEAKER_LABEL_RE);
    if (match) {
      flushSpeech();
      current = {
        speaker: normalizeSpeakerKey(match[1]),
        text: match[2] ?? "",
      };
      continue;
    }

    if (current) {
      current.text += ` ${trimmed}`;
    } else if (section === 4) {
      current = { speaker: "Lecturer", text: trimmed };
    } else if (section === 2) {
      current = { speaker: "Guide", text: trimmed };
    } else {
      current = { speaker: "Narrator", text: trimmed };
    }
  }

  flushSpeech();

  if (segments.length === 0 && String(transcript ?? "").trim()) {
    const plain = String(transcript).trim();
    const speaker =
      section === 4 ? "Lecturer" : section === 2 ? "Guide" : "Speaker";
    const chunks = splitInlinePauses(plain);
    for (const chunk of chunks) {
      if (chunk.type === "pause") {
        segments.push({ type: "pause", durationMs: chunk.durationMs });
      } else {
        segments.push({ type: "speech", speaker, text: chunk.text });
      }
    }
  }

  return segments;
}

/**
 * Rough duration estimate for speech (seconds).
 * @param {string} text
 * @param {number} speed
 */
export function estimateSpeechDurationSec(text, speed = 0.92) {
  const words = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (words === 0) return 0;
  return (words / 150) * 60 / speed;
}

/**
 * Build timeline for "now speaking" UI.
 * @param {Array} segments
 * @param {number} sectionNumber
 */
export function buildSpeakerTimeline(segments, sectionNumber) {
  const timeline = [];
  let offset = 0;
  const gapBetweenSpeakers = 0.5;

  for (const seg of segments) {
    if (seg.type === "pause") {
      offset += (seg.durationMs ?? 500) / 1000;
      continue;
    }
    if (seg.type === "speech" && seg.text) {
      const speed = getSpeedForSpeaker(seg.speaker, seg.text, sectionNumber);
      const dur = estimateSpeechDurationSec(seg.text, speed);
      timeline.push({
        speaker: seg.speaker,
        startSec: offset,
        endSec: offset + dur,
      });
      offset += dur + gapBetweenSpeakers;
    }
  }

  return timeline;
}

/**
 * @param {number} currentSec
 * @param {Array} timeline
 */
export function getActiveSpeakerAtTime(currentSec, timeline) {
  const entry = getActiveSpeakerEntryAtTime(currentSec, timeline);
  return entry?.speaker ?? null;
}

/**
 * @param {number} currentSec
 * @param {Array<{ speaker?: string, name?: string, startSec: number, endSec: number }>} timeline
 */
export function getActiveSpeakerEntryAtTime(currentSec, timeline) {
  if (!timeline?.length) return null;
  const hit = timeline.find(
    (t) => currentSec >= t.startSec && currentSec < t.endSec
  );
  return hit ?? timeline[timeline.length - 1] ?? null;
}

/**
 * Scale timeline to match actual audio duration (TTS segment lengths vary).
 * @param {Array<{ startSec: number, endSec: number }>} timeline
 * @param {number} audioDurationSec
 */
export function scaleTimelineToDuration(timeline, audioDurationSec) {
  if (!timeline?.length || !Number.isFinite(audioDurationSec) || audioDurationSec <= 0) {
    return timeline;
  }
  const lastEnd = timeline[timeline.length - 1]?.endSec ?? 0;
  if (!lastEnd || lastEnd <= 0) return timeline;
  const scale = audioDurationSec / lastEnd;
  if (Math.abs(scale - 1) < 0.02) return timeline;

  return timeline.map((t) => ({
    ...t,
    startSec: t.startSec * scale,
    endSec: t.endSec * scale,
  }));
}
