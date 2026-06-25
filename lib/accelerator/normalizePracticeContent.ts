import { validateQuestion } from "./validatePracticeContent";

export type FormattedOption = {
  letter: string;
  text: string;
  value: string;
};

/** Canonical normalized question shape for the practice UI */
export type PracticeQuestion = {
  key: string;
  number: number | string;
  /** Display label (alias for questionText) */
  label: string;
  questionText: string;
  questionType: string;
  /** @deprecated use questionType */
  type: string;
  instructions: string;
  options: string[];
  formattedOptions: FormattedOption[];
  correctIndex: number | null;
  explanation: string;
  audioUrl: string | null;
  validationErrors: string[];
  raw: Record<string, unknown>;
};

export type NormalizedListeningSection = {
  id: number;
  label: string;
  type: string;
  transcript: string;
  voice: string;
  speakers: unknown[];
  audioUrl: string | null;
  questions: PracticeQuestion[];
  validationErrors: string[];
};

export type NormalizedReadingPassage = {
  id: number;
  title: string;
  text: string;
  questions: PracticeQuestion[];
  validationErrors: string[];
};

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function parseOptions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item, i) => {
        if (item == null) return "";
        if (typeof item === "string") return normalizeOptionString(item.trim(), i);
        if (typeof item === "object") {
          const o = item as Record<string, unknown>;
          const key = o.key ?? o.letter ?? o.id ?? LETTERS[i] ?? "";
          const label = o.label ?? o.text ?? o.value ?? o.option ?? o.choice ?? "";
          if (key && label) {
            return normalizeOptionString(`${key}. ${String(label).trim()}`, i);
          }
          return normalizeOptionString(String(label || key || "").trim(), i);
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v], i) => normalizeOptionString(`${k}. ${String(v ?? "").trim()}`, i))
      .filter((s) => s.length > 2);
  }
  return [];
}

function normalizeOptionString(opt: string, index: number): string {
  const trimmed = opt.trim();
  if (!trimmed) return "";
  if (/^[A-Ha-h]\s*[\).:\-]/i.test(trimmed)) return trimmed;
  const letter = LETTERS[index] ?? String(index + 1);
  return `${letter}. ${trimmed}`;
}

export function formatMcqOptions(options: string[]): FormattedOption[] {
  return options.map((opt, i) => {
    const trimmed = String(opt ?? "").trim();
    const prefixed = trimmed.match(/^([A-Ha-h])\s*[\).:\-]\s*(.+)$/);
    if (prefixed) {
      return {
        letter: prefixed[1].toUpperCase(),
        text: prefixed[2].trim(),
        value: trimmed,
      };
    }
    return {
      letter: LETTERS[i] ?? String(i + 1),
      text: trimmed,
      value: trimmed,
    };
  });
}

function extractQuestionNumber(
  q: Record<string, unknown>,
  fallback: number
): number | string {
  if (q.number != null && q.number !== "") return q.number as number | string;
  if (q.questionNumber != null) return q.questionNumber as number | string;
  if (q.id != null && /^\d+$/.test(String(q.id))) return q.id as string;

  const raw = String(
    q.question_text ?? q.question ?? q.prompt ?? q.stem ?? q.text ?? ""
  ).trim();
  const m = raw.match(/^(\d+)\s*[.)/:\-]\s*/);
  if (m) return m[1];
  return fallback;
}

function extractQuestionText(q: Record<string, unknown>): string {
  const raw = String(
    q.question_text ??
      q.question ??
      q.prompt ??
      q.stem ??
      q.text ??
      q.label ??
      q.questionText ??
      q.statement ??
      ""
  ).trim();

  if (!raw) return "";

  return raw.replace(/^\d+\s*[.)/:\-]\s*/, "").trim() || raw;
}

function extractInstructions(
  q: Record<string, unknown>,
  sectionInstructions?: string
): string {
  return String(
    q.instructions ?? q.instruction ?? q.directions ?? sectionInstructions ?? ""
  ).trim();
}

function normalizeQuestionType(type: string, options: string[]): string {
  const t = type.toLowerCase().replace(/_/g, " ").trim();
  if (t.includes("multiple choice") || t === "mcq") return "multiple_choice";
  if (t.includes("form") && t.includes("completion")) return "form_completion";
  if (t.includes("true false") || t.includes("true/false") || t === "tfng") {
    return "true_false_not_given";
  }
  if (t.includes("yes no") || t.includes("yes/no") || t === "ynng") {
    return "yes_no_not_given";
  }
  if (t.includes("matching")) return "matching";
  if (t.includes("completion") || t.includes("blank")) return "completion";
  if (options.length >= 2) return "multiple_choice";
  return "short_answer";
}

function extractCorrectIndex(q: Record<string, unknown>): number | null {
  if (typeof q.correct_index === "number") return q.correct_index;
  if (typeof q.correctIndex === "number") return q.correctIndex;
  const ans = q.correct_answer ?? q.answer ?? q.correctAnswer;
  if (typeof ans === "number") return ans;
  if (typeof ans === "string") {
    const letter = ans.trim().toUpperCase().match(/^([A-D])/)?.[1];
    if (letter) return letter.charCodeAt(0) - 65;
  }
  return null;
}

function buildQuestion(
  q: Record<string, unknown>,
  sectionNum: number,
  index: number,
  sectionInstructions?: string
): PracticeQuestion {
  const num = extractQuestionNumber(q, index + 1);
  const key = `Q${num}`;
  const options = parseOptions(
    q.options ?? q.choices ?? q.answer_options ?? q.choices_list
  );
  const questionType = normalizeQuestionType(
    String(q.question_type ?? q.type ?? ""),
    options
  );
  const questionText = extractQuestionText(q);
  const instructions = extractInstructions(q, sectionInstructions);
  const correctIndex = extractCorrectIndex(q);
  const explanation = String(q.explanation ?? q.rationale ?? "").trim();
  const audioUrl =
    String(q.audio_url ?? q.audioUrl ?? "").trim() || null;

  const canonical = {
    question_text: questionText,
    question_type: questionType,
    type: questionType,
    options,
    audio_url: audioUrl,
    label: questionText,
  };

  const validationErrors: string[] = [];
  if (!validateQuestion(canonical)) {
    if (!questionText) validationErrors.push("question_text missing");
    if (questionType === "multiple_choice" && options.length < 2) {
      validationErrors.push("options missing for multiple_choice");
    }
  }
  if (questionType === "multiple_choice" && options.length > 0 && options.length < 2) {
    validationErrors.push("options missing for multiple_choice");
  }

  return {
    key,
    number: num,
    label: questionText || `Question ${num} (text missing)`,
    questionText: questionText || `Question ${num} (text missing)`,
    questionType,
    type: questionType,
    instructions,
    options,
    formattedOptions: formatMcqOptions(options),
    correctIndex,
    explanation,
    audioUrl,
    validationErrors,
    raw: q,
  };
}

function questionsFromSection(
  sectionNum: number,
  questionsRaw: unknown,
  answerKey: unknown,
  sectionInstructions?: string
): PracticeQuestion[] {
  const questions = Array.isArray(questionsRaw) ? questionsRaw : [];
  const out: PracticeQuestion[] = [];

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i] as Record<string, unknown>;

    if (Array.isArray(q.questions)) {
      out.push(
        ...questionsFromSection(
          Number(q.part ?? q.section ?? sectionNum),
          q.questions,
          q.answer_key ?? q.answerKey,
          sectionInstructions
        )
      );
      continue;
    }

    out.push(buildQuestion(q, sectionNum, i, sectionInstructions));
  }

  if (out.length === 0 && answerKey && typeof answerKey === "object") {
    for (const [k, ans] of Object.entries(answerKey as Record<string, unknown>)) {
      const num = k.replace(/^Q/i, "");
      out.push({
        key: k.startsWith("Q") ? k : `Q${k}`,
        number: num,
        label: `Question ${num} (prompt missing in content)`,
        questionText: `Question ${num} (prompt missing in content)`,
        questionType: "short_answer",
        type: "short_answer",
        instructions: sectionInstructions ?? "",
        options: [],
        formattedOptions: [],
        correctIndex: null,
        explanation: "",
        audioUrl: null,
        validationErrors: ["question_text missing", "generated from answer_key only"],
        raw: { answer_key: ans },
      });
    }
  }

  return out;
}

function listeningPartItems(content: Record<string, unknown>): Record<string, unknown>[] {
  const root =
    (content.listening as Record<string, unknown> | undefined) ?? content;
  if (Array.isArray(root.sections)) return root.sections as Record<string, unknown>[];
  if (Array.isArray(root.parts)) return root.parts as Record<string, unknown>[];
  if (Array.isArray(content.sections)) return content.sections as Record<string, unknown>[];
  if (Array.isArray(content.parts)) return content.parts as Record<string, unknown>[];
  if (Array.isArray(root.questions)) {
    const first = root.questions[0] as Record<string, unknown> | undefined;
    if (
      first &&
      (first.part != null ||
        first.section != null ||
        first.transcript ||
        Array.isArray(first.questions))
    ) {
      return root.questions as Record<string, unknown>[];
    }
  }
  return [];
}

export function normalizeListeningContent(
  content: Record<string, unknown>
): NormalizedListeningSection[] {
  const raw = listeningPartItems(content);
  if (!raw.length) return [];

  return raw.map((item, idx) => {
    const sec = item as Record<string, unknown>;
    const id = Number(sec.section ?? sec.part ?? idx + 1);
    const type = String(sec.type ?? sec.section_type ?? "listening");
    const transcript = String(
      sec.transcript ?? sec.audio_script ?? sec.script ?? content.transcript ?? ""
    ).trim();
    const speaker = sec.speaker as { voice?: string } | undefined;
    const speaker1 = sec.speaker1 as { voice?: string } | undefined;
    const voice = String(
      speaker?.voice ?? speaker1?.voice ?? sec.voice ?? "onyx"
    ).toLowerCase();
    const speakers = [
      ...(Array.isArray(sec.speakers) ? sec.speakers : []),
      ...(sec.speaker1 ? [sec.speaker1] : []),
      ...(sec.speaker2 ? [sec.speaker2] : []),
      ...(sec.speaker ? [sec.speaker] : []),
    ];
    const sectionInstructions = String(sec.instructions ?? sec.situation ?? "").trim();
    const questions = questionsFromSection(
      id,
      sec.questions,
      sec.answer_key ?? sec.answerKey,
      sectionInstructions
    );
    const sectionAudioUrl =
      String(
        sec.audio_url ?? sec.audioUrl ?? content.audio_url ?? content.audioUrl ?? ""
      ).trim() || null;

    const validationErrors: string[] = [];
    if (!transcript && !sectionAudioUrl) {
      validationErrors.push("transcript/audio_url missing");
    }
    if (!questions.length) validationErrors.push("no questions");
    for (const q of questions) {
      validationErrors.push(...q.validationErrors.map((e) => `${q.key}: ${e}`));
    }

    return {
      id,
      label: `Section ${id} — ${type.replace(/_/g, " ")}`,
      type,
      transcript,
      voice,
      speakers,
      audioUrl: sectionAudioUrl,
      questions,
      validationErrors,
    };
  });
}

export function normalizeReadingContent(
  content: Record<string, unknown>
): NormalizedReadingPassage[] {
  const readingRoot =
    (content.reading as Record<string, unknown> | undefined) ?? content;
  const raw = (readingRoot.passages as unknown[]) ?? [];
  if (!raw.length) return [];

  return raw.map((item, idx) => {
    const p = item as Record<string, unknown>;
    const id = Number(p.passage ?? p.passage_number ?? idx + 1);
    const questions = questionsFromSection(
      id,
      p.questions,
      p.answer_key ?? p.answerKey,
      String(p.instructions ?? "").trim() || undefined
    );
    const validationErrors: string[] = [];
    if (!String(p.text ?? "").trim()) validationErrors.push("passage text missing");
    for (const q of questions) {
      validationErrors.push(...q.validationErrors.map((e) => `${q.key}: ${e}`));
    }

    return {
      id,
      title: String(p.title ?? `Passage ${id}`),
      text: String(p.text ?? ""),
      questions,
      validationErrors,
    };
  });
}
