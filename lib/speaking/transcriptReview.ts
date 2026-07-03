export type TranscriptEntry = {
  role: "student" | "examiner";
  text: string;
  part?: number;
  action?: string;
  timestamp?: string;
};

export type TranscriptFlag = {
  span: string;
  category: "grammar" | "lexical" | "fluency" | "pronunciation" | "saudi" | "general";
  issue: string;
  correction?: string;
};

export type TranscriptPair = {
  part: number;
  question: string;
  answer: string;
  flags: TranscriptFlag[];
};

export type TranscriptReview = {
  pairs: TranscriptPair[];
  flagCount: number;
};

export type HighlightSegment = {
  text: string;
  flag?: TranscriptFlag;
};

const OPENING_QUESTION =
  "Good morning. My name is Sarah, and I'll be conducting your IELTS Speaking test today. First, could you tell me your full name please?";

const SKIP_ANSWERS = new Set([
  "i have finished speaking about the topic on the cue card.",
]);

function categorize(category: string): TranscriptFlag["category"] {
  const value = String(category || "").toLowerCase();
  if (value.includes("gram")) return "grammar";
  if (value.includes("lex") || value.includes("vocab")) return "lexical";
  if (value.includes("fluen")) return "fluency";
  if (value.includes("pronun")) return "pronunciation";
  return "general";
}

function correctionFromNote(note: string) {
  const match = String(note || "").match(/:\s*['"]([^'"]+)['"]\s*$/);
  return match?.[1];
}

export function collectTranscriptFlags(feedback: Record<string, unknown>): TranscriptFlag[] {
  const flags: TranscriptFlag[] = [];
  const seen = new Set<string>();

  const add = (
    span: string,
    category: TranscriptFlag["category"],
    issue: string,
    correction?: string
  ) => {
    const cleaned = String(span || "").trim();
    if (!cleaned || cleaned.length < 2) return;
    const key = `${cleaned.toLowerCase()}|${correction ?? ""}|${category}`;
    if (seen.has(key)) return;
    seen.add(key);
    flags.push({
      span: cleaned,
      category,
      issue: String(issue || "").trim() || "Review this phrase",
      correction: correction?.trim() || undefined,
    });
  };

  const topImprovements = (feedback.topImprovements ?? []) as Array<{
    category?: string;
    issue?: string;
    example?: string;
    suggestion?: string;
    studentQuote?: string;
    improvedVersion?: string;
  }>;

  for (const item of topImprovements) {
    const cat = categorize(item.category || "");
    if (item.studentQuote) {
      add(item.studentQuote, cat, item.issue || item.suggestion || "", item.improvedVersion);
    } else if (item.example) {
      add(item.example, cat, item.issue || "", item.suggestion || item.improvedVersion);
    }
  }

  const saudiErrors = (feedback.saudiSpecificErrors ?? []) as Array<{
    type?: string;
    example?: string;
    correction?: string;
  }>;
  for (const err of saudiErrors) {
    if (err.example) {
      add(err.example, "saudi", err.type || "Saudi-specific error", err.correction);
    }
  }

  const criterionFeedback = (feedback.criterionFeedback ?? {}) as Record<
    string,
    {
      note?: string;
      evidence?: string;
      exampleError?: string;
      flaggedWords?: string[];
    }
  >;

  const grammar = criterionFeedback.grammar;
  if (grammar?.exampleError) {
    add(
      grammar.exampleError,
      "grammar",
      grammar.note || "Grammar issue",
      correctionFromNote(grammar.note || "")
    );
  } else if (grammar?.evidence) {
    add(grammar.evidence, "grammar", grammar.note || "Grammar issue");
  }

  const lexical = criterionFeedback.lexical;
  if (lexical?.evidence) {
    add(lexical.evidence, "lexical", lexical.note || "Lexical issue");
  }
  for (const word of lexical?.flaggedWords ?? []) {
    add(word, "lexical", `Repeated or basic vocabulary: "${word}"`);
  }

  const fluency = criterionFeedback.fluency;
  if (fluency?.evidence) {
    add(fluency.evidence, "fluency", fluency.note || "Fluency issue");
  }

  return flags.sort((a, b) => b.span.length - a.span.length);
}

export function buildTranscriptPairs(
  transcript: TranscriptEntry[]
): Omit<TranscriptPair, "flags">[] {
  const students = transcript.filter(
    (entry) =>
      entry.role === "student" &&
      entry.text?.trim() &&
      !SKIP_ANSWERS.has(entry.text.trim().toLowerCase())
  );
  const examiners = transcript.filter((entry) => entry.role === "examiner" && entry.text?.trim());

  return students.map((student, index) => ({
    part: student.part ?? 1,
    question: index === 0 ? OPENING_QUESTION : examiners[index - 1]?.text?.trim() || "Follow-up question",
    answer: student.text.trim(),
  }));
}

export function flagsForAnswer(answer: string, allFlags: TranscriptFlag[]): TranscriptFlag[] {
  const lowerAnswer = answer.toLowerCase();
  return allFlags.filter((flag) => {
    const span = flag.span.trim().toLowerCase();
    return span.length >= 2 && lowerAnswer.includes(span);
  });
}

export function buildTranscriptReview(
  transcript: TranscriptEntry[],
  feedback: Record<string, unknown>
): TranscriptReview {
  const allFlags = collectTranscriptFlags(feedback);
  const pairs = buildTranscriptPairs(transcript).map((pair) => ({
    ...pair,
    flags: flagsForAnswer(pair.answer, allFlags),
  }));

  return {
    pairs,
    flagCount: allFlags.length,
  };
}

export function buildHighlightedSegments(
  text: string,
  flags: TranscriptFlag[]
): HighlightSegment[] {
  if (!text) return [{ text: "" }];
  if (!flags.length) return [{ text }];

  const matches: { start: number; end: number; flag: TranscriptFlag }[] = [];

  for (const flag of flags) {
    const span = flag.span.trim();
    if (!span) continue;
    const lowerText = text.toLowerCase();
    const lowerSpan = span.toLowerCase();
    let idx = 0;
    while (idx < text.length) {
      const found = lowerText.indexOf(lowerSpan, idx);
      if (found === -1) break;
      matches.push({ start: found, end: found + span.length, flag });
      idx = found + Math.max(1, lowerSpan.length);
    }
  }

  if (!matches.length) return [{ text }];

  matches.sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
  );

  const accepted: typeof matches = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      accepted.push(match);
      lastEnd = match.end;
    }
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const match of accepted) {
    if (match.start > cursor) {
      segments.push({ text: text.slice(cursor, match.start) });
    }
    segments.push({
      text: text.slice(match.start, match.end),
      flag: match.flag,
    });
    cursor = match.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments.length ? segments : [{ text }];
}

export const FLAG_COLORS: Record<TranscriptFlag["category"], { bg: string; border: string }> = {
  grammar: { bg: "#fef3c7", border: "#f59e0b" },
  lexical: { bg: "#fff7ed", border: "#ea580c" },
  fluency: { bg: "#ecfeff", border: "#0891b2" },
  pronunciation: { bg: "#fdf2f8", border: "#db2777" },
  saudi: { bg: "#fffbeb", border: "#d97706" },
  general: { bg: "#f1f5f9", border: "#64748b" },
};
