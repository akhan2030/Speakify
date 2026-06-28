import type {
  StepCompositionalItem,
  StepListeningRecording,
  StepMcqQuestion,
  StepReadingPassage,
  StepStructureItem,
} from "./types";
import type { StepSectionId } from "./examModel";

export type BankReadingPayload = {
  kind: "reading";
  passages: StepReadingPassage[];
};

export type BankListeningPayload = {
  kind: "listening";
  recordings: StepListeningRecording[];
};

export type BankStructurePayload = {
  kind: "structure";
  items: StepStructureItem[];
};

export type BankCompositionalPayload = {
  kind: "compositional_analysis";
  items: StepCompositionalItem[];
};

export type ParsedBankContent =
  | BankReadingPayload
  | BankListeningPayload
  | BankStructurePayload
  | BankCompositionalPayload;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function parseBankContent(
  section: StepSectionId,
  raw: unknown
): ParsedBankContent | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (section === "reading" && Array.isArray(obj.passages)) {
    return { kind: "reading", passages: obj.passages as StepReadingPassage[] };
  }
  if (section === "listening" && Array.isArray(obj.recordings)) {
    return {
      kind: "listening",
      recordings: obj.recordings as StepListeningRecording[],
    };
  }
  if (section === "structure" && Array.isArray(obj.items)) {
    return { kind: "structure", items: obj.items as StepStructureItem[] };
  }
  if (
    section === "compositional_analysis" &&
    Array.isArray(obj.items)
  ) {
    return {
      kind: "compositional_analysis",
      items: obj.items as StepCompositionalItem[],
    };
  }
  return null;
}

export function passagePlainText(passage: StepReadingPassage): string {
  return passage.paragraphs.map((p) => p.text).join("\n\n");
}

export function passageTitle(passage: StepReadingPassage, index: number): string {
  const firstLine = passage.paragraphs[0]?.text?.slice(0, 80) ?? "";
  return passage.id ? `Passage ${index + 1}` : `Passage ${index + 1}`;
}

/** Client-safe question — no correct answer or explanation */
export type ClientMcqQuestion = Omit<StepMcqQuestion, "correct" | "explanation"> & {
  correct?: never;
  explanation?: never;
};

export function stripAnswerKey<T extends StepMcqQuestion>(
  questions: T[]
): ClientMcqQuestion[] {
  return questions.map(({ correct: _c, explanation: _e, ...rest }) => rest);
}

export function pickRandom<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}
