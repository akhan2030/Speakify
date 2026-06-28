/**
 * Client-side speech fallback when OpenAI TTS is unavailable.
 */
export function canUseBrowserSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopBrowserSpeech(): void {
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

function pickTwoDistinctVoices(
  voices: SpeechSynthesisVoice[]
): [SpeechSynthesisVoice | undefined, SpeechSynthesisVoice | undefined] {
  const enPool = voices.filter((v) => normalizeLang(v.lang).startsWith("en"));
  if (enPool.length === 0) return [undefined, undefined];

  const preferLocal = (candidates: SpeechSynthesisVoice[]) =>
    candidates.find((v) => v.localService) ?? candidates[0];

  const females = enPool.filter(isFemaleVoice);
  const males = enPool.filter(isMaleVoice);

  const voiceA = preferLocal(females.length > 0 ? females : enPool);
  const maleCandidates = males.filter((v) => v.name !== voiceA?.name);
  const otherCandidates = enPool.filter((v) => v.name !== voiceA?.name);
  const voiceB = preferLocal(
    maleCandidates.length > 0
      ? maleCandidates
      : otherCandidates.length > 0
        ? otherCandidates
        : enPool
  );

  return [voiceA, voiceB];
}

const SPEAKER_VOICE_HINT: Record<string, "a" | "b"> = {
  student: "a",
  customer: "a",
  caller: "a",
  patient: "a",
  woman: "a",
  female: "a",
  mary: "a",
  sara: "a",
  administrator: "b",
  admin: "b",
  agent: "b",
  professor: "b",
  lecturer: "b",
  manager: "b",
  teacher: "b",
  interviewer: "b",
  man: "b",
  male: "b",
  david: "b",
  john: "b",
};

function voiceForSpeaker(
  speaker: string,
  speakerIndex: number,
  voiceA: SpeechSynthesisVoice | undefined,
  voiceB: SpeechSynthesisVoice | undefined,
  assigned: Map<string, SpeechSynthesisVoice | undefined>
): SpeechSynthesisVoice | undefined {
  const existing = assigned.get(speaker);
  if (existing) return existing;

  const normalized = speaker.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  const hint =
    SPEAKER_VOICE_HINT[normalized] ??
    (speakerIndex % 2 === 0 ? "a" : "b");

  const voice = hint === "a" ? voiceA : voiceB;
  assigned.set(speaker, voice);
  return voice;
}

function pauseMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Speak a multi-speaker dialogue with alternating voices.
 * Speaker labels (e.g. "Student:") are not read aloud.
 */
export async function speakDialogueWithBrowser(transcript: string): Promise<void> {
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

  const [voiceA, voiceB] = pickTwoDistinctVoices(voices);
  const assigned = new Map<string, SpeechSynthesisVoice | undefined>();
  let prevSpeaker = "";

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const voice = voiceForSpeaker(turn.speaker, i, voiceA, voiceB, assigned);
    const utterance = buildUtterance(turn.text, "en-US", voice);
    utterance.rate = turn.speaker.toLowerCase().includes("student") ? 0.95 : 0.9;

    if (prevSpeaker && prevSpeaker !== turn.speaker) {
      await pauseMs(350);
    }
    prevSpeaker = turn.speaker;

    await speakUtterance(synth, utterance);
  }
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
