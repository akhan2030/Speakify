export const SPEAKING_CRITERION_WEIGHT_PERCENT = 25;

export const SPEAKING_CRITERIA_LABELS = [
  "Fluency and Coherence",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
  "Pronunciation",
] as const;

export type SpeakingCriterionLabel = (typeof SPEAKING_CRITERIA_LABELS)[number];

export function speakingCriteriaLabels(): SpeakingCriterionLabel[] {
  return [...SPEAKING_CRITERIA_LABELS];
}

export function speakingCriteriaSubtitle(): string {
  const criteria = speakingCriteriaLabels()
    .map((label) => `${label} (${SPEAKING_CRITERION_WEIGHT_PERCENT}%)`)
    .join("; ");
  return `Each criterion carries ${SPEAKING_CRITERION_WEIGHT_PERCENT}% of your band score. ${criteria}.`;
}

export function submitLabelForSpeakingSession(): string {
  return `Submit for AI score — 4 criteria, ${SPEAKING_CRITERION_WEIGHT_PERCENT}% each`;
}
