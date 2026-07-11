/**
 * Client-side speech fallback when OpenAI TTS is unavailable.
 */

let activeSarahAudio: HTMLAudioElement | null = null;
let activeSarahRaf: number | null = null;

function stopSarahAudio(): void {
  if (activeSarahRaf != null) {
    cancelAnimationFrame(activeSarahRaf);
    activeSarahRaf = null;
  }
  if (activeSarahAudio) {
    activeSarahAudio.pause();
    activeSarahAudio.src = "";
    activeSarahAudio = null;
  }
}

function isQuotaOrUnavailable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("billing") ||
    lower.includes("openai_api_key") ||
    lower.includes("not configured") ||
    lower.includes("unauthorized")
  );
}

async function fetchSarahExaminerAudio(text: string): Promise<Blob> {
  const response = await fetch("/api/speaking/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || contentType.includes("application/json")) {
    let message = "Sarah voice unavailable";
    try {
      const body = await response.json();
      message = String((body as { error?: string })?.error ?? message);
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("Empty audio response");
  }
  return blob;
}

async function playSarahAudioBlob(
  text: string,
  blob: Blob,
  handlers?: {
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number, charLength: number) => void;
  }
): Promise<void> {
  stopSarahAudio();
  stopBrowserSpeech();

  const audio = new Audio();
  activeSarahAudio = audio;
  const url = URL.createObjectURL(blob);
  audio.src = url;
  audio.preload = "auto";

  let lastCharIndex = -1;

  const revealProgress = () => {
    if (!audio.duration || !Number.isFinite(audio.duration)) return;
    const ratio = Math.min(1, audio.currentTime / audio.duration);
    const charIndex = Math.min(text.length - 1, Math.floor(ratio * text.length));
    if (charIndex !== lastCharIndex) {
      lastCharIndex = charIndex;
      handlers?.onBoundary?.(charIndex, 1);
    }
  };

  const scheduleReveal = () => {
    revealProgress();
    if (!audio.paused && !audio.ended) {
      activeSarahRaf = requestAnimationFrame(scheduleReveal);
    }
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (ok: boolean, err?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (activeSarahRaf != null) {
        cancelAnimationFrame(activeSarahRaf);
        activeSarahRaf = null;
      }
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      URL.revokeObjectURL(url);
      if (activeSarahAudio === audio) {
        activeSarahAudio = null;
      }
      if (ok) {
        handlers?.onBoundary?.(Math.max(0, text.length - 1), 1);
        handlers?.onEnd?.();
        resolve();
      } else {
        handlers?.onEnd?.();
        reject(err ?? new Error("Could not play examiner audio."));
      }
    };

    const timeoutId = window.setTimeout(() => {
      settle(false, new Error("Examiner audio timed out."));
    }, Math.max(20000, text.length * 120 + 8000));

    audio.onplay = () => {
      handlers?.onStart?.();
      scheduleReveal();
    };

    audio.ontimeupdate = revealProgress;

    audio.onended = () => settle(true);

    audio.onerror = () => {
      settle(false, new Error("Could not play examiner audio."));
    };

    void audio
      .play()
      .catch((playErr) => {
        settle(
          false,
          playErr instanceof Error
            ? playErr
            : new Error("Playback blocked — check browser sound settings.")
        );
      });
  });
}

export function canUseBrowserSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopBrowserSpeech(): void {
  stopSarahAudio();
  if (canUseBrowserSpeech()) {
    window.speechSynthesis.cancel();
  }
}

function waitForVoices(timeoutMs = 2500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!canUseBrowserSpeech()) {
      resolve([]);
      return;
    }

    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(voices);
    };

    const onVoicesChanged = () => {
      finish(synth.getVoices());
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);
    // Chrome loads voices asynchronously; calling getVoices() can trigger the event.
    synth.getVoices();

    window.setTimeout(() => {
      finish(synth.getVoices());
    }, timeoutMs);
  });
}

export type BrowserSpeechLang = "en-US" | "en-GB";

function normalizeLang(lang: string): string {
  return lang.replace("_", "-");
}

const FEMALE_VOICE_HINTS = [
  "female",
  "zira",
  "samantha",
  "karen",
  "victoria",
  "linda",
  "heather",
  "fiona",
  "moira",
  "tessa",
  "serena",
  "jenny",
  "aria",
  "emma",
  "joanna",
  "kimberly",
  "salli",
  "ivy",
  "joelle",
  "susan",
];

const MALE_VOICE_HINTS = [
  "male",
  "david",
  "george",
  "mark",
  "daniel",
  "james",
  "ryan",
  "guy",
  "thomas",
  "brian",
  "lee",
  "matthew",
  "arthur",
  "gordon",
  "tony",
  "christopher",
  "eric",
  "roger",
  "steffan",
];

function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return FEMALE_VOICE_HINTS.some((hint) => name.includes(hint));
}

function isMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return MALE_VOICE_HINTS.some((hint) => name.includes(hint));
}

function pickVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: BrowserSpeechLang
): SpeechSynthesisVoice | undefined {
  const pool = voices.filter((v) => normalizeLang(v.lang).startsWith(lang));
  if (pool.length === 0) return undefined;

  // American → female voice; British → male voice (when available on the device).
  const matchesGender =
    lang === "en-US"
      ? isFemaleVoice
      : lang === "en-GB"
        ? isMaleVoice
        : () => true;

  const preferLocal = (candidates: SpeechSynthesisVoice[]) =>
    candidates.find((v) => v.localService) ?? candidates[0];

  const gendered = pool.filter(matchesGender);
  if (gendered.length > 0) return preferLocal(gendered);

  return preferLocal(pool);
}

function buildUtterance(
  text: string,
  lang: BrowserSpeechLang,
  voice?: SpeechSynthesisVoice
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  utterance.volume = 1;
  if (voice) utterance.voice = voice;
  return utterance;
}

function speakUtterance(synth: SpeechSynthesis, utterance: SpeechSynthesisUtterance): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (ok: boolean, err?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(safetyId);
      if (ok) resolve();
      else reject(err ?? new Error("Speech playback failed."));
    };

    utterance.onend = () => settle(true);
    utterance.onerror = (event) => {
      const code = event.error;
      if (code === "canceled" || code === "interrupted") {
        settle(true);
        return;
      }
      settle(
        false,
        new Error(
          code === "not-allowed"
            ? "Audio blocked by the browser. Click Listen again or allow sound for this site."
            : "Device voice playback failed. Try again."
        )
      );
    };

    const safetyId = window.setTimeout(() => {
      synth.cancel();
      settle(true);
    }, Math.max(12000, utterance.text.length * 200 + 3000));

    window.setTimeout(() => {
      synth.speak(utterance);
      synth.resume();
    }, 80);
  });
}

async function speakWithAttempts(
  synth: SpeechSynthesis,
  text: string,
  lang: BrowserSpeechLang,
  voices: SpeechSynthesisVoice[]
): Promise<void> {
  const matchedVoice = pickVoiceForLang(voices, lang);
  const attempts: SpeechSynthesisUtterance[] = [];

  if (matchedVoice) {
    attempts.push(buildUtterance(text, lang, matchedVoice));
  }
  // Lang-only fallback: avoids voice/lang mismatch when no accent voice is installed.
  attempts.push(buildUtterance(text, lang));

  let lastError: Error | undefined;
  for (let i = 0; i < attempts.length; i += 1) {
    if (i > 0) synth.cancel();
    try {
      await speakUtterance(synth, attempts[i]);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Speech playback failed.");
    }
  }

  if (lang === "en-GB" && !matchedVoice) {
    throw new Error(
      "No British voice found on this device. Add English (United Kingdom) under Windows Settings → Time & language → Speech, or use American."
    );
  }

  throw lastError ?? new Error("Speech playback failed.");
}

export type DialogueTurn = {
  speaker: string;
  text: string;
};

/** Split STEP listening transcript into speaker turns (label not spoken aloud). */
export function parseDialogueTranscript(transcript: string): DialogueTurn[] {
  const lines = transcript
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const turns: DialogueTurn[] = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z\s.'-]{0,40}):\s*(.+)$/);
    if (match) {
      turns.push({ speaker: match[1].trim(), text: match[2].trim() });
    } else if (turns.length > 0) {
      turns[turns.length - 1].text += ` ${line}`;
    } else {
      turns.push({ speaker: "Narrator", text: line });
    }
  }

  return turns;
}

function pickGenderedVoicePool(
  voices: SpeechSynthesisVoice[]
): { male: SpeechSynthesisVoice[]; female: SpeechSynthesisVoice[]; all: SpeechSynthesisVoice[] } {
  const enPool = voices.filter((v) => normalizeLang(v.lang).startsWith("en"));
  return {
    male: enPool.filter(isMaleVoice),
    female: enPool.filter(isFemaleVoice),
    all: enPool,
  };
}

function preferLocalVoice(
  candidates: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  return candidates.find((v) => v.localService) ?? candidates[0];
}

function pauseMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Speak a multi-speaker dialogue with distinct gendered voices.
 * Speaker labels (e.g. "Student:") are not read aloud.
 */
export async function speakDialogueWithBrowser(
  transcript: string,
  options?: {
    speakers?: Array<{
      label?: string;
      name?: string;
      gender?: string;
      voice?: string;
    }>;
    sectionNumber?: number;
  }
): Promise<void> {
  if (!canUseBrowserSpeech()) {
    return Promise.reject(new Error("Browser speech is not supported on this device."));
  }

  const trimmed = transcript.trim();
  if (!trimmed) {
    return Promise.reject(new Error("Nothing to read aloud."));
  }

  const turns = parseDialogueTranscript(trimmed);
  const synth = window.speechSynthesis;
  synth.cancel();

  let voices = synth.getVoices();
  if (voices.length === 0) {
    voices = await waitForVoices();
  }

  if (turns.length <= 1) {
    const text = turns[0]?.text ?? trimmed;
    return speakWithAttempts(synth, text, "en-US", voices);
  }

  const pool = pickGenderedVoicePool(voices);
  const assigned = new Map<string, SpeechSynthesisVoice | undefined>();
  const usedVoiceNames = new Set<string>();
  let prevSpeaker = "";

  const speakersMeta = options?.speakers ?? [];

  const genderForSpeaker = (
    speaker: string,
    index: number
  ): "male" | "female" => {
    const key = speaker.toLowerCase().trim();
    const meta = speakersMeta.find(
      (s) => String(s.label ?? "").trim().toLowerCase() === key
    );
    if (meta?.gender === "male" || meta?.gender === "female") return meta.gender;

    const metaByName = speakersMeta.find((s) => {
      const name = String(s.name ?? "").trim().toLowerCase();
      return name === key || name.split(/\s+/)[0] === key;
    });
    if (metaByName?.gender === "male" || metaByName?.gender === "female") {
      return metaByName.gender;
    }

    if (
      /\b(james|david|michael|robert|tom|john|patrick|oliver|nathan|mark|tutor|lecturer|guide)\b/i.test(
        speaker
      )
    ) {
      return "male";
    }
    if (
      /\b(hannah|emily|sarah|emma|lisa|nova|sophie)\b/i.test(speaker)
    ) {
      return "female";
    }
    return index % 2 === 0 ? "male" : "female";
  };

  const pickVoice = (
    gender: "male" | "female"
  ): SpeechSynthesisVoice | undefined => {
    const preferred = gender === "female" ? pool.female : pool.male;
    const unusedPreferred = preferred.filter((v) => !usedVoiceNames.has(v.name));
    const pick =
      preferLocalVoice(unusedPreferred) ??
      preferLocalVoice(preferred) ??
      preferLocalVoice(pool.all.filter((v) => !usedVoiceNames.has(v.name))) ??
      preferLocalVoice(pool.all);
    if (pick) usedVoiceNames.add(pick.name);
    return pick;
  };

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    let voice = assigned.get(turn.speaker);
    if (!voice) {
      const gender = genderForSpeaker(turn.speaker, i);
      voice = pickVoice(gender);
      assigned.set(turn.speaker, voice);
    }
    const utterance = buildUtterance(turn.text, "en-US", voice);
    utterance.rate = turn.speaker.toLowerCase().includes("student") ? 0.95 : 0.9;

    if (prevSpeaker && prevSpeaker !== turn.speaker) {
      await pauseMs(350);
    }
    prevSpeaker = turn.speaker;

    await speakUtterance(synth, utterance);
  }
}

function pickFemaleBritishVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  const preferLocal = (candidates: SpeechSynthesisVoice[]) =>
    candidates.find((v) => v.localService) ?? candidates[0];

  const gbPool = voices.filter((v) => normalizeLang(v.lang).startsWith("en-GB"));
  const femaleGb = gbPool.filter(isFemaleVoice);
  if (femaleGb.length > 0) return preferLocal(femaleGb);

  const femaleGbHints = gbPool.filter((v) => {
    const n = v.name.toLowerCase();
    return n.includes("hazel") || n.includes("libby") || n.includes("sonia");
  });
  if (femaleGbHints.length > 0) return preferLocal(femaleGbHints);

  const enPool = voices.filter((v) => normalizeLang(v.lang).startsWith("en"));
  const femaleEn = enPool.filter(isFemaleVoice);
  if (femaleEn.length > 0) return preferLocal(femaleEn);

  return undefined;
}

/** Sarah — OpenAI TTS (nova) with browser speech fallback for IELTS Speaking. */
export async function speakSarahExaminer(
  text: string,
  handlers?: {
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number, charLength: number) => void;
  }
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    handlers?.onEnd?.();
    return;
  }

  try {
    const blob = await fetchSarahExaminerAudio(trimmed);
    await playSarahAudioBlob(trimmed, blob, handlers);
    return;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sarah voice unavailable";
    if (!isQuotaOrUnavailable(message)) {
      console.warn("[speakSarahExaminer] OpenAI TTS failed, using browser voice:", message);
    }
  }

  if (!canUseBrowserSpeech()) {
    handlers?.onEnd?.();
    return;
  }

  stopSarahAudio();

  const synth = window.speechSynthesis;
  synth.cancel();

  let voices = synth.getVoices();
  if (voices.length === 0) {
    voices = await waitForVoices();
  }

  const voice = pickFemaleBritishVoice(voices);
  const utterance = buildUtterance(trimmed, "en-GB", voice);
  utterance.pitch = 1.08;
  utterance.rate = 0.9;

  utterance.onstart = () => handlers?.onStart?.();
  utterance.onboundary = (e) => {
    if (e.charIndex >= 0) handlers?.onBoundary?.(e.charIndex, e.charLength || 1);
  };
  utterance.onend = () => handlers?.onEnd?.();
  utterance.onerror = (e) => {
    if (e.error !== "canceled" && e.error !== "interrupted") {
      console.warn("[speakSarahExaminer]", e.error);
    }
    handlers?.onEnd?.();
  };

  await new Promise<void>((resolve) => {
    const prevEnd = utterance.onend;
    utterance.onend = (ev) => {
      prevEnd?.call(utterance, ev);
      resolve();
    };
    window.setTimeout(() => {
      synth.speak(utterance);
      synth.resume();
    }, 80);
  });
}

export function speakWithBrowser(text: string, lang: BrowserSpeechLang = "en-GB"): Promise<void> {
  if (!canUseBrowserSpeech()) {
    return Promise.reject(new Error("Browser speech is not supported on this device."));
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return Promise.reject(new Error("Nothing to read aloud."));
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  let voices = synth.getVoices();
  if (voices.length === 0) {
    void waitForVoices();
    voices = synth.getVoices();
  }

  return speakWithAttempts(synth, trimmed, lang, voices);
}
