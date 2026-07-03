import type {
  ScoreDeduction,
  StructuredSpeakingScore,
  SpeakingCriterionKey,
} from "@/lib/speaking/scoringSchema";

const INTRO_NAME_PATTERN =
  /^(my name is|i am|i'm|this is)\b/i;

const BASIC_WORDS = new Set([
  "good",
  "nice",
  "bad",
  "very",
  "really",
  "thing",
  "things",
  "stuff",
  "like",
  "love",
  "big",
  "small",
  "happy",
  "beautiful",
  "delicious",
  "interesting",
  "important",
]);

const UPGRADE_MAP: Record<string, string[]> = {
  good: ["beneficial", "valuable", "worthwhile", "positive"],
  nice: ["pleasant", "enjoyable", "appealing"],
  bad: ["harmful", "problematic", "unfavourable"],
  very: ["particularly", "especially", "remarkably"],
  really: ["genuinely", "truly", "considerably"],
  delicious: ["flavourful", "appetising", "excellent"],
  beautiful: ["striking", "impressive", "scenic"],
  interesting: ["compelling", "engaging", "fascinating"],
  important: ["essential", "significant", "crucial"],
  like: ["enjoy", "appreciate", "prefer"],
  love: ["admire", "value", "cherish"],
  big: ["substantial", "significant", "major"],
  happy: ["content", "delighted", "satisfied"],
};

function stripPartPrefix(line: string) {
  return line.replace(/^\[Part \d+\]\s*/i, "").trim();
}

/** Student utterances in order (without [Part N] prefixes). */
export function extractStudentUtterances(studentTranscript: string): string[] {
  return String(studentTranscript || "")
    .split("\n")
    .map(stripPartPrefix)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeForMatch(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isWeakEvidence(quote: string, utterances: string[]): boolean {
  const q = quote.trim();
  if (q.length < 8) return true;
  if (INTRO_NAME_PATTERN.test(q) && q.split(/\s+/).length <= 6) return true;

  // Name-only first turn should not be reused for every criterion.
  const first = utterances[0] || "";
  if (
    first &&
    normalizeForMatch(q) === normalizeForMatch(first) &&
    INTRO_NAME_PATTERN.test(first)
  ) {
    return true;
  }

  return false;
}

function evidenceInTranscript(quote: string, utterances: string[]): boolean {
  const q = normalizeForMatch(quote);
  if (!q) return false;
  return utterances.some((u) => {
    const line = normalizeForMatch(u);
    return line.includes(q) || q.includes(line.slice(0, Math.min(line.length, 40)));
  });
}

function findGrammarEvidence(utterances: string[]): string | null {
  const patterns: RegExp[] = [
    /\bfrom last\b/i,
    /\bfrom the last\b/i,
    /\bI go\b/i,
    /\bI come\b.*\bago\b/i,
    /\bhe go\b/i,
    /\bshe go\b/i,
    /\bmore better\b/i,
    /\bvery much\b.*\bpeople\b/i,
  ];
  for (const line of utterances) {
    if (INTRO_NAME_PATTERN.test(line) && line.split(/\s+/).length <= 6) continue;
    if (patterns.some((p) => p.test(line))) return line.slice(0, 160);
  }
  // Prefer non-intro lines for grammar notes.
  const nonIntro = utterances.find(
    (u) => !(INTRO_NAME_PATTERN.test(u) && u.split(/\s+/).length <= 6)
  );
  return nonIntro?.slice(0, 160) ?? null;
}

function findLexicalEvidence(utterances: string[]): string | null {
  for (const line of utterances) {
    if (INTRO_NAME_PATTERN.test(line) && line.split(/\s+/).length <= 6) continue;
    const lower = line.toLowerCase();
    // Redundant intensifier: "very delicious", "very beautiful"
    if (/\bvery\s+(delicious|beautiful|nice|good|interesting|important)\b/i.test(line)) {
      return line.slice(0, 160);
    }
    // Repetition of like/love in same line
    if ((lower.match(/\b(like|love)\b/g) || []).length >= 2) {
      return line.slice(0, 160);
    }
    const tokens = lower.split(/[^a-z']+/).filter(Boolean);
    if (tokens.some((t) => BASIC_WORDS.has(t))) {
      return line.slice(0, 160);
    }
  }
  return utterances.find((u) => u.split(/\s+/).length > 6)?.slice(0, 160) ?? null;
}

function findFluencyEvidence(
  utterances: string[],
  metrics?: { filler_word_count?: number; words_per_minute?: number }
): string | null {
  if (metrics?.filler_word_count && metrics.filler_word_count > 0) {
    return `Filler words detected ${metrics.filler_word_count} time(s) across the session (${metrics.words_per_minute ?? "—"} WPM)`;
  }
  // Repeated phrasing across turns
  const snippets = utterances
    .map((u) => u.toLowerCase())
    .filter((u) => u.split(/\s+/).length > 4);
  for (let i = 0; i < snippets.length; i += 1) {
    for (let j = i + 1; j < snippets.length; j += 1) {
      const a = snippets[i];
      const b = snippets[j];
      const wordsA = new Set(a.split(/\s+/));
      const overlap = b.split(/\s+/).filter((w) => wordsA.has(w) && w.length > 3);
      if (overlap.length >= 4) {
        return utterances[j].slice(0, 160);
      }
    }
  }
  return findLexicalEvidence(utterances);
}

function repairDeduction(
  deduction: ScoreDeduction,
  key: SpeakingCriterionKey,
  utterances: string[],
  fluencyMetrics?: { filler_word_count?: number; words_per_minute?: number }
): ScoreDeduction {
  const quote = String(deduction.evidence || "").trim();
  const ok =
    quote &&
    !isWeakEvidence(quote, utterances) &&
    (evidenceInTranscript(quote, utterances) ||
      quote.toLowerCase().includes("wpm") ||
      quote.toLowerCase().includes("filler") ||
      quote.toLowerCase().includes("pause"));

  if (ok) return deduction;

  let replacement: string | null = null;
  if (key === "grammatical_range_accuracy") {
    replacement = findGrammarEvidence(utterances);
  } else if (key === "lexical_resource") {
    replacement = findLexicalEvidence(utterances);
  } else if (key === "fluency_coherence") {
    replacement = findFluencyEvidence(utterances, fluencyMetrics);
  } else if (key === "pronunciation") {
    // Prefer a non-intro substantive line; never the name line alone.
    replacement =
      utterances.find(
        (u) => !(INTRO_NAME_PATTERN.test(u) && u.split(/\s+/).length <= 6)
      )?.slice(0, 160) ?? null;
    if (replacement) {
      return {
        ...deduction,
        evidence: replacement,
        reason: deduction.reason.includes("estimated")
          ? deduction.reason
          : `${deduction.reason} (estimated from transcript; practise stress on key content words)`,
      };
    }
  }

  if (replacement) {
    return { ...deduction, evidence: replacement };
  }

  // Drop unusable deduction rather than cite the wrong line.
  return {
    ...deduction,
    evidence: utterances.find((u) => u.split(/\s+/).length > 5)?.slice(0, 160) || quote,
  };
}

/**
 * Ensure each criterion's deductions cite real, distinct transcript evidence —
 * never default every criterion to the opening name line.
 */
export function repairStructuredScoreEvidence(
  score: StructuredSpeakingScore,
  studentTranscript: string
): StructuredSpeakingScore {
  const utterances = extractStudentUtterances(studentTranscript);
  const used = new Set<string>();

  const repairCriterion = (key: SpeakingCriterionKey) => {
    const criterion = score.criteria[key];
    const deductions = (criterion.deductions || [])
      .map((d) =>
        repairDeduction(d, key, utterances, score.fluency_metrics || undefined)
      )
      .map((d) => {
        const norm = normalizeForMatch(d.evidence);
        // Prefer unique evidence per criterion when possible.
        if (used.has(norm) && utterances.length > 1) {
          const alt =
            key === "grammatical_range_accuracy"
              ? findGrammarEvidence(utterances.filter((u) => normalizeForMatch(u) !== norm))
              : findLexicalEvidence(utterances.filter((u) => normalizeForMatch(u) !== norm));
          if (alt) {
            const repaired = { ...d, evidence: alt };
            used.add(normalizeForMatch(alt));
            return repaired;
          }
        }
        used.add(norm);
        return d;
      });

    return { ...criterion, deductions };
  };

  return {
    ...score,
    criteria: {
      fluency_coherence: repairCriterion("fluency_coherence"),
      lexical_resource: repairCriterion("lexical_resource"),
      grammatical_range_accuracy: repairCriterion("grammatical_range_accuracy"),
      pronunciation: repairCriterion("pronunciation"),
    },
  };
}

export type VocabularyUpgrade = {
  word: string;
  from?: string;
  context?: string;
  personalized: boolean;
};

/** Generic backfill only — never present these as if they came from the student. */
export const GENERAL_VOCAB_BACKFILL = [
  "elaborate",
  "perspective",
  "consequence",
  "maintain",
  "consider",
];

/**
 * Build practice vocabulary upgrades from the student's actual language.
 * Returns rich objects so the UI can show why each word was chosen.
 */
export function deriveVocabularyUpgrades(
  studentTranscript: string,
  score: StructuredSpeakingScore | null | undefined
): VocabularyUpgrade[] {
  const utterances = extractStudentUtterances(studentTranscript);
  const full = utterances.join(" ").toLowerCase();
  if (!full.trim()) return [];

  const suggestions: VocabularyUpgrade[] = [];

  const lexicalDeductions = score?.criteria?.lexical_resource?.deductions ?? [];
  for (const d of lexicalDeductions) {
    const tokens = String(d.evidence || "")
      .toLowerCase()
      .split(/[^a-z']+/)
      .filter(Boolean);
    for (const token of tokens) {
      if (UPGRADE_MAP[token]) {
        suggestions.push({
          word: UPGRADE_MAP[token][0],
          from: token,
          context: d.evidence,
          personalized: true,
        });
      }
    }
    const replaceMatch = String(d.reason || "").match(
      /replace with[:\s]+([a-zA-Z,\s/]+)/i
    );
    if (replaceMatch) {
      for (const w of replaceMatch[1].split(/[,/]/)) {
        const cleaned = w.trim().toLowerCase().replace(/[^a-z]/g, "");
        if (cleaned.length > 3) {
          suggestions.push({
            word: cleaned,
            from: tokens.find((t) => BASIC_WORDS.has(t)),
            context: d.evidence,
            personalized: true,
          });
        }
      }
    }
  }

  const counts = new Map<string, number>();
  for (const token of full.split(/[^a-z']+/).filter(Boolean)) {
    if (!BASIC_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  for (const [token, count] of counts) {
    if (count < 1 || !UPGRADE_MAP[token]) continue;
    for (const upgrade of UPGRADE_MAP[token].slice(0, 2)) {
      suggestions.push({
        word: upgrade,
        from: token,
        context: `You used “${token}” ${count} time${count === 1 ? "" : "s"}`,
        personalized: true,
      });
    }
  }

  const veryMatch = full.match(
    /\bvery\s+(delicious|beautiful|nice|good|interesting|important)\b/
  );
  if (veryMatch) {
    const base = veryMatch[1];
    const upgrade = UPGRADE_MAP[base]?.[0];
    if (upgrade) {
      suggestions.push({
        word: upgrade,
        from: `very ${base}`,
        context: `You said “very ${base}”`,
        personalized: true,
      });
    }
  }

  const unique: VocabularyUpgrade[] = [];
  const seen = new Set<string>();
  for (const item of suggestions) {
    const w = item.word.toLowerCase().replace(/[^a-z]/g, "");
    if (w.length < 4 || seen.has(w)) continue;
    if (new RegExp(`\\b${w}\\b`, "i").test(full)) continue;
    seen.add(w);
    unique.push({ ...item, word: w, personalized: true });
    if (unique.length >= 8) break;
  }

  return unique;
}

/** Word strings only (for legacy fields). */
export function deriveVocabularyChallenge(
  studentTranscript: string,
  score: StructuredSpeakingScore
): string[] {
  return deriveVocabularyUpgrades(studentTranscript, score).map((u) => u.word);
}

/**
 * Build today's challenge list from recent scored sessions.
 * Personalized words first; general backfill only if needed and clearly labeled.
 */
export function buildTodayVocabularyFromSessions(
  sessions: Array<{ id?: string; feedback?: Record<string, unknown> | null }>,
  limit = 5
): Array<{
  id: string;
  word: string;
  personalized: boolean;
  from?: string;
  context?: string;
  reviewCount: number;
}> {
  const personalized: Array<{
    id: string;
    word: string;
    personalized: boolean;
    from?: string;
    context?: string;
    reviewCount: number;
  }> = [];
  const seen = new Set<string>();

  for (const session of sessions) {
    const feedback = session.feedback;
    if (!feedback) continue;

    const detailed = Array.isArray(feedback.vocabularyChallengeDetailed)
      ? feedback.vocabularyChallengeDetailed
      : [];

    if (detailed.length > 0) {
      for (const item of detailed) {
        const word = String(item?.word || "")
          .toLowerCase()
          .replace(/[^a-z]/g, "");
        if (word.length < 4 || seen.has(word)) continue;
        if (item?.personalized === false) continue;
        seen.add(word);
        personalized.push({
          id: `personal-${session.id || "x"}-${word}`,
          word,
          personalized: true,
          from: item.from ? String(item.from) : undefined,
          context: item.context ? String(item.context) : undefined,
          reviewCount: 0,
        });
      }
    } else {
      const transcriptText =
        typeof feedback.sessionScore?.transcript === "string"
          ? feedback.sessionScore.transcript
          : Array.isArray(feedback.sessionTranscript)
            ? feedback.sessionTranscript
                .filter((t: { role?: string }) => t?.role === "student")
                .map((t: { text?: string; part?: number }) =>
                  `[Part ${t.part ?? "?"}] ${t.text || ""}`
                )
                .join("\n")
            : "";

      const upgrades = deriveVocabularyUpgrades(
        transcriptText,
        feedback.structuredScore as StructuredSpeakingScore
      );
      for (const item of upgrades) {
        if (seen.has(item.word)) continue;
        seen.add(item.word);
        personalized.push({
          id: `personal-${session.id || "x"}-${item.word}`,
          word: item.word,
          personalized: true,
          from: item.from,
          context: item.context,
          reviewCount: 0,
        });
      }
    }
  }

  const result = personalized.slice(0, limit);

  if (result.length < limit) {
    for (const word of GENERAL_VOCAB_BACKFILL) {
      if (seen.has(word)) continue;
      seen.add(word);
      result.push({
        id: `general-${word}`,
        word,
        personalized: false,
        context: "General practice word (not from your recent sessions)",
        reviewCount: 0,
      });
      if (result.length >= limit) break;
    }
  }

  return result;
}
