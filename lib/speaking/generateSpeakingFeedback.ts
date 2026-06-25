export type SpeakingFeedback = {
  overallSummary: string;
  strengths: string[];
  weaknesses: string[];
  nextTarget: string;
  improvementPlan: string[];
};

type CriterionKey = "fc" | "lr" | "gra" | "p";

const CRITERIA: Array<{ key: CriterionKey; label: string; short: string }> = [
  { key: "fc", label: "Fluency and Coherence", short: "FC" },
  { key: "lr", label: "Lexical Resource", short: "LR" },
  { key: "gra", label: "Grammatical Range and Accuracy", short: "GRA" },
  { key: "p", label: "Pronunciation", short: "P" },
];

function roundHalf(n: number) {
  return Math.round(n * 2) / 2;
}

function formatBand(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function getNextTarget(overallBand: number): string {
  const band = roundHalf(overallBand);

  if (band <= 4) return "Band 4.5–5.0";
  if (band <= 4.5) return "Band 5.0–5.5";
  if (band <= 5) return "Band 5.5–6.0";
  if (band <= 5.5) return "Band 6.0–6.5";
  if (band <= 6) return "Band 6.5–7.0";
  if (band <= 6.5) return "Band 7.0–7.5";
  if (band <= 7) return "Band 7.5–8.0";
  return "Band 8.0+";
}

function getTargetGuidance(overallBand: number, nextTarget: string): string {
  const band = roundHalf(overallBand);

  if (band <= 4.5) {
    return `You are close to ${nextTarget}. At this stage, focus on answering in full sentences and maintaining a steady flow on familiar topics.`;
  }
  if (band <= 5) {
    return `To move toward ${nextTarget}, extend your answers with at least one reason or example and reduce long pauses between ideas.`;
  }
  if (band <= 5.5) {
    return `You are close to ${nextTarget}. Your main priority should be longer, better-organised answers with clearer vocabulary choices.`;
  }
  if (band <= 6) {
    return `You are performing at a competent Band ${formatBand(band)} level. To reach ${nextTarget}, speak with more extended answers and give deeper responses in Part 3.`;
  }
  if (band <= 6.5) {
    return `You are close to ${nextTarget}. Focus on flexibility with vocabulary and greater accuracy when using complex grammar under time pressure.`;
  }
  if (band <= 7) {
    return `Your performance is already good. To move toward ${nextTarget}, refine pronunciation features and use less common vocabulary more naturally.`;
  }
  if (band <= 7.5) {
    return `You are approaching advanced proficiency. To reach ${nextTarget}, maintain effortless fluency with precise, idiomatic language throughout all three parts.`;
  }
  return `You are performing at an advanced level. Continue refining precision, natural intonation, and sustained coherence across the full test.`;
}

function scoresByCriterion(fc: number, lr: number, gra: number, p: number) {
  return CRITERIA.map((c) => ({
    ...c,
    score: roundHalf({ fc, lr, gra, p }[c.key]),
  }));
}

function isBalanced(scores: ReturnType<typeof scoresByCriterion>) {
  const values = scores.map((s) => s.score);
  return new Set(values).size === 1;
}

function lowestCriteria(scores: ReturnType<typeof scoresByCriterion>) {
  const min = Math.min(...scores.map((s) => s.score));
  return scores.filter((s) => s.score === min);
}

function highestCriteria(scores: ReturnType<typeof scoresByCriterion>) {
  const max = Math.max(...scores.map((s) => s.score));
  return scores.filter((s) => s.score === max);
}

function fcWeaknesses(nextTarget: string): string[] {
  return [
    `Your Fluency and Coherence is holding back your move toward ${nextTarget}. Practise speaking for 40–60 seconds without losing the thread of your answer.`,
    "Use linking words and discourse markers such as “firstly”, “however”, “as a result”, and “for instance” to organise your ideas more clearly.",
    "In Part 2, develop each cue-card point in order. In Part 3, structure your answer with a clear opinion, reason, and example.",
  ];
}

function lrWeaknesses(nextTarget: string): string[] {
  return [
    `Your Lexical Resource is your main area to develop for ${nextTarget}. Build topic-specific word groups for common IELTS themes such as education, work, technology, and health.`,
    "Practise paraphrasing the examiner’s question instead of repeating the same words, and learn useful collocations rather than isolated vocabulary.",
    "Try to include a few less common but natural items in each answer, especially in Part 2 and Part 3.",
  ];
}

function graWeaknesses(nextTarget: string): string[] {
  return [
    `Your Grammatical Range and Accuracy needs attention to reach ${nextTarget}. Practise complex sentences with relative clauses, conditionals, and comparison structures.`,
    "Review tense control, articles, and prepositions — these small errors become more noticeable at higher bands.",
    "Record yourself, identify repeated grammar mistakes, and rewrite three sentences from each practice answer in a more accurate form.",
  ];
}

function pWeaknesses(nextTarget: string): string[] {
  return [
    `Your Pronunciation is the main barrier to ${nextTarget}. Focus on clear word stress so key meaning words stand out in each sentence.`,
    "Practise sentence stress, rhythm, and intonation — especially when listing ideas, giving examples, or expressing contrast.",
    "Read aloud for 5–10 minutes daily and copy the stress patterns of natural spoken English rather than speaking word by word.",
  ];
}

function fcImprovementPlan(): string[] {
  return [
    "Part 1: answer every question for 40–60 seconds with one reason and one example.",
    "Part 2: cover all cue-card points and aim for a full two-minute response.",
    "Part 3: give extended analytical answers using signposting language.",
    "Daily drill: speak for 2 minutes on one topic without long pauses.",
  ];
}

function lrImprovementPlan(): string[] {
  return [
    "Learn 10 collocations per week for high-frequency IELTS topics.",
    "Practise paraphrasing questions before you answer them.",
    "Replace basic words (good, bad, important, like) with more precise alternatives.",
    "Build a personal vocabulary bank from Part 2 and Part 3 practice topics.",
  ];
}

function graImprovementPlan(): string[] {
  return [
    "Write and speak 5 complex sentences daily using although, while, if, and which.",
    "Review one grammar area each week: tenses, articles, or prepositions.",
    "In practice answers, aim for one complex sentence in every Part 1 reply and two in Part 3.",
    "Self-correct quickly when you notice an error, then continue fluently.",
  ];
}

function pImprovementPlan(): string[] {
  return [
    "Shadow short audio clips and copy stress and rhythm.",
    "Practise emphasising content words in every sentence you record.",
    "Use rising and falling intonation correctly in questions and contrasts.",
    "Record one mock answer daily and check whether your meaning stays easy to follow.",
  ];
}

function balancedWeaknesses(nextTarget: string): string[] {
  return [
    `Your scores are balanced across all four criteria, which is a strong foundation for ${nextTarget}.`,
    "To move up, improve fluency and answer length without losing clarity.",
    "Expand vocabulary range and use more precise topic-specific language.",
    "Reduce grammar slips in complex sentences and keep pronunciation easy to follow throughout.",
  ];
}

function balancedImprovementPlan(): string[] {
  return [
    "Practise one full Part 1 session focusing on extended answers.",
    "Complete Part 2 cue cards with full preparation and two-minute speaking.",
    "Use Part 3 to develop opinions with reasons, examples, and comparisons.",
    "Repeat a full speaking mock every 3–5 days to measure progress.",
  ];
}

function strengthsFor(
  highest: ReturnType<typeof highestCriteria>,
  overallBand: number
): string[] {
  const items: string[] = [];

  for (const c of highest) {
    items.push(
      `Your ${c.label} (${formatBand(c.score)}) is a relative strength and helps support your overall Band ${formatBand(overallBand)} performance.`
    );
  }

  if (items.length === 0) {
    items.push(
      "You completed a full three-part speaking mock, which shows commitment and exam readiness."
    );
  }

  return items.slice(0, 3);
}

function weaknessItemsFor(
  lowest: ReturnType<typeof lowestCriteria>,
  nextTarget: string,
  balanced: boolean
): string[] {
  if (balanced) return balancedWeaknesses(nextTarget);

  const keys = new Set(lowest.map((c) => c.key));
  const items: string[] = [];

  if (keys.has("fc")) items.push(...fcWeaknesses(nextTarget));
  if (keys.has("lr")) items.push(...lrWeaknesses(nextTarget));
  if (keys.has("gra")) items.push(...graWeaknesses(nextTarget));
  if (keys.has("p")) items.push(...pWeaknesses(nextTarget));

  return items.slice(0, 4);
}

function improvementPlanFor(
  lowest: ReturnType<typeof lowestCriteria>,
  balanced: boolean
): string[] {
  if (balanced) return balancedImprovementPlan();

  const keys = new Set(lowest.map((c) => c.key));
  const items: string[] = [];

  if (keys.has("fc")) items.push(...fcImprovementPlan());
  if (keys.has("lr")) items.push(...lrImprovementPlan());
  if (keys.has("gra")) items.push(...graImprovementPlan());
  if (keys.has("p")) items.push(...pImprovementPlan());

  return Array.from(new Set(items)).slice(0, 5);
}

/**
 * Generates structured IELTS speaking feedback from overall and criterion band scores.
 */
export function generateSpeakingFeedback(
  overallBand: number,
  fc: number,
  lr: number,
  gra: number,
  p: number
): SpeakingFeedback {
  const overall = roundHalf(overallBand);
  const scores = scoresByCriterion(fc, lr, gra, p);
  const balanced = isBalanced(scores);
  const lowest = lowestCriteria(scores);
  const highest = highestCriteria(scores);
  const nextTarget = getNextTarget(overall);

  const criteriaSummary = scores
    .map((c) => `${c.short} ${formatBand(c.score)}`)
    .join(", ");

  let overallSummary = `You achieved an overall Speaking band of ${formatBand(overall)} (${criteriaSummary}). `;

  if (balanced) {
    overallSummary += `Your performance is evenly balanced across Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. ${getTargetGuidance(overall, nextTarget)}`;
  } else {
    const weakLabels = lowest.map((c) => `${c.label} (${formatBand(c.score)})`).join(" and ");
    overallSummary += `Your main development area is ${weakLabels}. ${getTargetGuidance(overall, nextTarget)}`;
  }

  return {
    overallSummary,
    strengths: strengthsFor(highest, overall),
    weaknesses: weaknessItemsFor(lowest, nextTarget, balanced),
    nextTarget,
    improvementPlan: improvementPlanFor(lowest, balanced),
  };
}
