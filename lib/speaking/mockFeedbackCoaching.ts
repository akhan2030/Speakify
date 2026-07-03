export type CriterionKey =
  | "fluencyCoherence"
  | "lexicalResource"
  | "grammaticalRange"
  | "pronunciation";

export type SpeakingCriteria = Record<CriterionKey, number>;

export const CRITERION_META: Record<
  CriterionKey,
  { label: string; practiceFocus: string }
> = {
  fluencyCoherence: {
    label: "Fluency & Coherence",
    practiceFocus: "fluency",
  },
  lexicalResource: {
    label: "Lexical Resource",
    practiceFocus: "lexical",
  },
  grammaticalRange: {
    label: "Grammatical Range",
    practiceFocus: "grammar",
  },
  pronunciation: {
    label: "Pronunciation",
    practiceFocus: "pronunciation",
  },
};

const COACHING_TABLE: Record<
  CriterionKey,
  { lt5: string; r5: string; r6: string; r7: string }
> = {
  fluencyCoherence: {
    lt5:
      "Frequent pauses are breaking your flow. Practice thinking in English, not translating.",
    r5: "You're getting ideas across but hesitating on connectors. Drill linking phrases.",
    r6: "Good flow — now work on self-correction without losing pace.",
    r7: "Strong fluency. Focus on discourse markers for Band 8.",
  },
  lexicalResource: {
    lt5:
      "You're relying on basic vocabulary. Start with 10 topic-specific words per week.",
    r5: "You're using fewer unique words than a Band 6.5 speaker. Upgrade your adjectives first.",
    r6: "Good range. Now add idiomatic expressions and collocations.",
    r7: "Excellent range. Polish with less common vocabulary.",
  },
  grammaticalRange: {
    lt5:
      "Stick to simple sentences you're confident with, then add one complex structure per answer.",
    r5: "You have the basics — now practice relative clauses and conditionals.",
    r6: "Solid grammar. Mix in more passive voice and perfect tenses naturally.",
    r7: "Near-native accuracy. Focus on subtle tense consistency.",
  },
  pronunciation: {
    lt5: "Focus on word stress — it's the #1 thing examiners notice.",
    r5: "Clear sounds, but work on sentence-level intonation and stress patterns.",
    r6: "Good clarity. Practice connected speech (linking, elision).",
    r7: "Strong pronunciation. Refine intonation for emphasis.",
  },
};

const HEADLINE_BY_CRITERION: Record<CriterionKey, string> = {
  fluencyCoherence: "Fluency is holding you back — but it's the easiest to fix",
  lexicalResource: "Your biggest lever right now is lexical variety",
  grammaticalRange: "Grammar accuracy is your fastest path to the next band",
  pronunciation: "Pronunciation clarity will lift every answer you give",
};

export function coachingLineForCriterion(key: CriterionKey, score: number): string {
  const row = COACHING_TABLE[key];
  if (score < 5) return row.lt5;
  if (score < 6) return row.r5;
  if (score < 7) return row.r6;
  return row.r7;
}

export function findWeakestCriterion(criteria: SpeakingCriteria): CriterionKey {
  const entries = (Object.keys(criteria) as CriterionKey[]).map((key) => ({
    key,
    score: criteria[key],
  }));
  entries.sort((a, b) => a.score - b.score);
  return entries[0]?.key ?? "lexicalResource";
}

export function headlineInsight(
  criteria: SpeakingCriteria,
  targetBand = 6.5
): string {
  const weakest = findWeakestCriterion(criteria);
  const gap = targetBand - criteria[weakest];
  if (gap <= 0.5 && criteria[weakest] >= 6) {
    return "Grammar is solid — focus on vocabulary range to break through";
  }
  return HEADLINE_BY_CRITERION[weakest];
}

export const L1_INTERFERENCE_PATTERNS: { match: RegExp; explanation: string }[] = [
  {
    match: /article/i,
    explanation:
      "Arabic handles definiteness with 'al-' prefix, so English articles feel redundant. This is systematic, not careless — with practice, it becomes automatic.",
  },
  {
    match: /present perfect|present simple|tense/i,
    explanation:
      "Arabic doesn't distinguish 'I live' vs 'I have lived' the same way English does, so duration and life experience often get the wrong tense.",
  },
  {
    match: /agreement|subject.?verb|plural/i,
    explanation:
      "Arabic plural agreement rules differ from English, so singular/plural verb forms can slip through when you speak quickly.",
  },
  {
    match: /pronoun|he\/she|subject/i,
    explanation:
      "Arabic is a pro-drop language and marks gender differently, so extra pronouns or he/she swaps can feel natural in Arabic but sound odd in English.",
  },
  {
    match: /translation|word.?order/i,
    explanation:
      "Direct translation from Arabic word order can produce phrases that are grammatically possible but unnatural in English conversation.",
  },
];

export function l1Explanation(errorType: string): string | null {
  const normalized = errorType.toLowerCase();
  for (const pattern of L1_INTERFERENCE_PATTERNS) {
    if (pattern.match.test(normalized)) return pattern.explanation;
  }
  return "Arabic and English structure ideas differently — this pattern is common for Saudi speakers and improves with targeted practice.";
}

export const VOCAB_WORD_META: Record<
  string,
  { ipa: string; definition: string; example: string }
> = {
  sustainable: {
    ipa: "/səˈsteɪ.nə.bəl/",
    definition: "able to continue without harming the environment or depleting resources",
    example: "The city is investing in sustainable transport.",
  },
  infrastructure: {
    ipa: "/ˈɪn.frəˌstrʌk.tʃər/",
    definition: "basic physical systems of a country — roads, buildings, transport",
    example: "Better infrastructure attracts more international business.",
  },
  accommodate: {
    ipa: "/əˈkɒm.ə.deɪt/",
    definition: "to provide space or adjust for someone or something",
    example: "The hotel can accommodate up to 200 guests.",
  },
  contribute: {
    ipa: "/kənˈtrɪb.juːt/",
    definition: "to give or add something to help achieve a result",
    example: "Young entrepreneurs contribute fresh ideas to the economy.",
  },
  significantly: {
    ipa: "/sɪɡˈnɪf.ɪ.kənt.li/",
    definition: "in a way that is large or important enough to be noticed",
    example: "Tourism has grown significantly in the last decade.",
  },
  vibrant: {
    ipa: "/ˈvaɪ.brənt/",
    definition: "full of energy and life",
    example: "The city has a vibrant nightlife.",
  },
  pleasant: {
    ipa: "/ˈplez.ənt/",
    definition: "enjoyable and agreeable",
    example: "We had a pleasant conversation about travel.",
  },
  enjoyable: {
    ipa: "/ɪnˈdʒɔɪ.ə.bəl/",
    definition: "giving pleasure or satisfaction",
    example: "Learning English can be enjoyable with the right practice.",
  },
};

export function vocabMeta(word: string) {
  const key = word.toLowerCase();
  return (
    VOCAB_WORD_META[key] ?? {
      ipa: "",
      definition: "Use this word naturally in a sentence about your daily life or studies.",
      example: `Try: "This topic is very ${word} in modern society."`,
    }
  );
}
