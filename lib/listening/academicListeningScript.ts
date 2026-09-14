import { resolveAccent, type ListeningAccent } from "./neuralVoiceCatalog";

export type AcademicListeningSpeaker = {
  speaker_id: string;
  accent: ListeningAccent;
  gender: "male" | "female";
  display_name?: string;
  voice_id?: string;
  role?: "instructions" | "content";
};

export type InstructionKind = "section_prep" | "sub_block" | "example";

export type LinePace = "normal" | "medium" | "slow" | "dictation";

export type AcademicListeningLine = {
  speaker_id: string;
  text: string;
  /** Default 400. Use 600–800 between turns; 300–500 around tested details. */
  pause_after_ms?: number;
  key_detail?: boolean;
  /** slow = names/dates; dictation = spelling, phone, confirmation codes. */
  pace?: LinePace;
  note?: string;
  question_number?: number;
  /** Canonical key; scoring should also accept acceptable_answers. */
  answer?: string;
  acceptable_answers?: string[];
  instruction_kind?: InstructionKind;
};

export type ListeningSubBlock = {
  questions: [number, number];
  type: string;
  word_limit?: string;
};

export type AcademicListeningScript = {
  programme: "ielts_academic";
  section: 1 | 2 | 3 | 4;
  version: string;
  title?: string;
  question_count?: number;
  speakers: AcademicListeningSpeaker[];
  lines: AcademicListeningLine[];
  sub_blocks?: ListeningSubBlock[];
};

export const DEFAULT_PAUSE_AFTER_MS = 400;
export const TURN_PAUSE_MS = 700;
/** Extra gap between content speakers in a Section 1 phone call. */
export const PHONE_TURN_PAUSE_MS = 1100;
/** Extra gap between seminar speakers in Section 3. */
export const SEMINAR_TURN_PAUSE_MS = 950;
export const KEY_DETAIL_PAUSE_MS = 400;
/** Gap between spelled letters (A … L … V). */
export const DICTATION_LETTER_PAUSE_MS = 280;
/** Gap between phone/code groups. */
export const DICTATION_GROUP_PAUSE_MS = 350;

export function contentTurnPauseMs(section: number): number {
  if (section === 1) return PHONE_TURN_PAUSE_MS;
  if (section === 3) return SEMINAR_TURN_PAUSE_MS;
  return TURN_PAUSE_MS;
}
/** Pause between clauses inside examiner instruction sentences. */
export const EXAMINER_CLAUSE_PAUSE_MS = 500;
/** Fallback only. Prefer prepPauseMs(questionCount) per sub-block. */
export const EXAM_PREP_PAUSE_MS = 25_000;

/** Scaled look-at-questions pause for one sub-block (not the whole section). */
export function prepPauseMs(questionCount: number): number {
  const n = Math.max(1, Number(questionCount) || 1);
  if (n <= 2) return 15_000;
  if (n <= 3) return 16_000;
  if (n <= 4) return 20_000;
  if (n <= 5) return 25_000;
  return 28_000;
}
/** Brief sting between task-type sub-blocks (not prep time). */
export const SUB_BLOCK_PAUSE_MS = 900;
/** Time to look at the worked example on the page. */
export const EXAMPLE_LOOK_PAUSE_MS = 3_000;

const DISCOURSE_OPENERS = new Set([
  "first",
  "now",
  "next",
  "then",
  "finally",
  "lastly",
  "so",
]);

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function splitCommaClauses(part: string): string[] {
  const trimmed = part.trim();
  const comma = trimmed.search(/,\s+/);
  if (comma === -1) return [trimmed];
  const left = trimmed.slice(0, comma).trim();
  const right = trimmed.slice(comma + 1).trim();
  const opener = DISCOURSE_OPENERS.has(left.toLowerCase().replace(/[^a-z]/g, ""));
  if ((opener || wordCount(left) >= 4) && wordCount(right) >= 4) {
    return [left, ...splitCommaClauses(right)];
  }
  return [trimmed];
}

/** Split examiner copy into announcement-style clauses (not conversational). */
export function splitExaminerClauses(text: string): string[] {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return [];
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const clauses: string[] = [];
  for (const sentence of sentences) {
    const chunks = sentence
      .split(/\s*[;:—–]\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const chunk of chunks) {
      clauses.push(...splitCommaClauses(chunk));
    }
  }
  return clauses.length ? clauses : [trimmed];
}

const PLACEHOLDER_RE = /REPLACE_WITH_|TODO_SCRIPT|PLACEHOLDER/i;
const PREP_TEXT_RE = /you have some time to look at questions/i;

function isInstructionsSpeaker(speaker: AcademicListeningSpeaker): boolean {
  return (
    speaker.role === "instructions" ||
    speaker.speaker_id.toLowerCase() === "examiner"
  );
}

function parseInstructionKind(raw: unknown): InstructionKind | undefined {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "section_prep" || v === "prep_time") return "section_prep";
  if (v === "sub_block" || v === "task_instruction") return "sub_block";
  if (v === "example" || v === "example_announce") return "example";
  return undefined;
}

function resolvePauseMs(options: {
  pause: number | undefined;
  text: string;
  instructionKind?: InstructionKind;
}): number | undefined {
  const { pause, text, instructionKind } = options;
  if (instructionKind === "sub_block") {
    return pause ?? SUB_BLOCK_PAUSE_MS;
  }
  if (instructionKind === "example") {
    return pause ?? EXAMPLE_LOOK_PAUSE_MS;
  }
  if (instructionKind === "section_prep") {
    return pause ?? EXAM_PREP_PAUSE_MS;
  }
  return pause;
}

function parseAnswerFields(line: Record<string, unknown>): {
  answer?: string;
  acceptable_answers?: string[];
} {
  const extra = Array.isArray(line.acceptable_answers)
    ? line.acceptable_answers.map((item) => String(item).trim()).filter(Boolean)
    : [];
  if (Array.isArray(line.answer)) {
    const variants = line.answer.map((item) => String(item).trim()).filter(Boolean);
    return {
      answer: variants[0],
      acceptable_answers: [...new Set([...variants, ...extra])],
    };
  }
  if (line.answer == null && extra.length === 0) return {};
  const canonical = line.answer != null ? String(line.answer).trim() : extra[0];
  const acceptable = [...new Set([canonical, ...extra].filter(Boolean))];
  return {
    answer: canonical,
    acceptable_answers: acceptable.length > 1 ? acceptable : extra.length ? extra : undefined,
  };
}

export function normalizeScript(raw: unknown): AcademicListeningScript {
  if (!raw || typeof raw !== "object") {
    throw new Error("Script must be a JSON object.");
  }
  const data = raw as Record<string, unknown>;
  const section = Number(data.section);
  if (![1, 2, 3, 4].includes(section)) {
    throw new Error("section must be 1, 2, 3, or 4.");
  }

  const speakersRaw = Array.isArray(data.speakers) ? data.speakers : [];
  const linesRaw = Array.isArray(data.lines) ? data.lines : [];
  if (speakersRaw.length === 0) {
    throw new Error("speakers[] is required.");
  }
  if (linesRaw.length === 0) {
    throw new Error("lines[] is required — paste original scripts; do not invent content.");
  }

  const speakers: AcademicListeningSpeaker[] = speakersRaw.map((row, index) => {
    const s = (row ?? {}) as Record<string, unknown>;
    const speaker_id = String(s.speaker_id ?? "").trim();
    if (!speaker_id) {
      throw new Error(`speakers[${index}] needs speaker_id`);
    }
    const gender =
      String(s.gender ?? "").trim().toLowerCase() === "female" ? "female" : "male";
    const roleRaw = String(s.role ?? "").trim().toLowerCase();
    return {
      speaker_id,
      accent: resolveAccent(s.accent ?? s.voice_id),
      gender,
      display_name: s.display_name ? String(s.display_name) : undefined,
      voice_id: s.voice_id ? String(s.voice_id).trim() : undefined,
      role:
        roleRaw === "instructions" || speaker_id.toLowerCase() === "examiner"
          ? "instructions"
          : "content",
    };
  });

  const speakerIds = new Set(speakers.map((s) => s.speaker_id));
  const lines: AcademicListeningLine[] = linesRaw.map((row, index) => {
    const line = (row ?? {}) as Record<string, unknown>;
    const speaker_id = String(line.speaker_id ?? "").trim();
    const text = String(line.text ?? "").trim();
    if (!speaker_id || !speakerIds.has(speaker_id)) {
      throw new Error(`lines[${index}] has unknown speaker_id "${speaker_id}"`);
    }
    if (!text) {
      throw new Error(`lines[${index}] has empty text`);
    }
    if (PLACEHOLDER_RE.test(text)) {
      throw new Error(
        `lines[${index}] still contains placeholder text. Provide original scripts before rendering.`
      );
    }
    const pause = Number(line.pause_after_ms);
    const note = String(line.note ?? "");
    const qn = Number(line.question_number);
    const instruction_kind = parseInstructionKind(line.instruction_kind);
    const answers = parseAnswerFields(line);
    const paceRaw = String(line.pace ?? "").trim().toLowerCase();
    const pace: LinePace | undefined =
      paceRaw === "slow" ||
      paceRaw === "dictation" ||
      paceRaw === "normal" ||
      paceRaw === "medium"
        ? (paceRaw as LinePace)
        : undefined;
    return {
      speaker_id,
      text,
      pause_after_ms: resolvePauseMs({
        pause: Number.isFinite(pause) ? Math.max(0, pause) : undefined,
        text,
        instructionKind: instruction_kind,
      }),
      key_detail: Boolean(line.key_detail),
      pace,
      note: note || undefined,
      question_number: Number.isInteger(qn) && qn > 0 ? qn : undefined,
      answer: answers.answer,
      acceptable_answers: answers.acceptable_answers,
      instruction_kind,
    };
  });

  assertSectionShape(section as 1 | 2 | 3 | 4, speakers);
  const sub_blocks = parseSubBlocks(data.sub_blocks);
  assertPrepPerSubBlock(lines, sub_blocks);

  return {
    programme: "ielts_academic",
    section: section as 1 | 2 | 3 | 4,
    version: String(data.version ?? "v1").trim() || "v1",
    title: data.title ? String(data.title) : undefined,
    question_count: Number(data.question_count) || 10,
    speakers,
    lines,
    sub_blocks,
  };
}

function parseSubBlocks(raw: unknown): ListeningSubBlock[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  if (raw.length < 2 || raw.length > 3) {
    throw new Error("sub_blocks must contain 2 or 3 task groups per section.");
  }
  return raw.map((row, index) => {
    const block = (row ?? {}) as Record<string, unknown>;
    const questionsRaw = Array.isArray(block.questions)
      ? block.questions.map(Number)
      : String(block.range ?? "")
          .split(/[-–—]/)
          .map((part) => Number(part.trim()));
    const questions = questionsRaw.filter((n) => Number.isInteger(n) && n > 0);
    if (questions.length !== 2) {
      throw new Error(
        `sub_blocks[${index}] needs questions: [from, to] or range: "from-to"`
      );
    }
    const type = String(block.type ?? block.task_type ?? "").trim();
    if (!type) throw new Error(`sub_blocks[${index}] needs type`);
    return {
      questions: [questions[0], questions[1]] as [number, number],
      type,
      word_limit: block.word_limit ? String(block.word_limit) : undefined,
    };
  });
}

function assertPrepPerSubBlock(
  lines: AcademicListeningLine[],
  subBlocks: ListeningSubBlock[] | undefined
) {
  const prepLines = lines.filter((line) => line.instruction_kind === "section_prep");
  if (!subBlocks?.length) return;
  if (prepLines.length !== subBlocks.length) {
    throw new Error(
      `Expected ${subBlocks.length} sub-block prep pauses, found ${prepLines.length}.`
    );
  }
}

function assertSectionShape(
  section: 1 | 2 | 3 | 4,
  speakers: AcademicListeningSpeaker[]
) {
  const n = speakers.filter((s) => !isInstructionsSpeaker(s)).length;
  if (section === 1 && n !== 2) {
    throw new Error("Section 1 must have exactly 2 content speakers (dialogue), plus optional examiner.");
  }
  if (section === 2 && n !== 1) {
    throw new Error("Section 2 must have exactly 1 content speaker (monologue), plus optional examiner.");
  }
  if (section === 3 && (n < 2 || n > 4)) {
    throw new Error("Section 3 must have 2–4 content speakers (discussion), plus optional examiner.");
  }
  if (section === 4 && n !== 1) {
    throw new Error("Section 4 must have exactly 1 content speaker (lecture), plus optional examiner.");
  }
}

export function scriptWordCount(script: AcademicListeningScript): number {
  return script.lines.reduce(
    (sum, line) =>
      sum +
      line.text.split(/\s+/).filter(Boolean).length,
    0
  );
}

export function linesToTranscript(script: AcademicListeningScript): string {
  const names = new Map(
    script.speakers.map((s) => [s.speaker_id, s.display_name || s.speaker_id])
  );
  return script.lines
    .map((line) => `${names.get(line.speaker_id)}: ${line.text}`)
    .join("\n");
}
