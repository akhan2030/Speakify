export const GRADUATION_TOTAL_SECONDS = 90 * 60;
export const GRADUATION_PASS_SCORE = 70;
export const RETEST_COOLDOWN_DAYS = 7;

export const SECTION_WEIGHTS = {
  grammar: 0.2,
  vocabulary: 0.2,
  reading: 0.2,
  listening: 0.15,
  writing: 0.15,
  speaking: 0.1,
} as const;

export type GraduationSkill = keyof typeof SECTION_WEIGHTS;

export const SECTION_META: Record<
  GraduationSkill,
  { title: string; timeLimitSeconds: number; questionCount: string }
> = {
  grammar: { title: "Grammar", timeLimitSeconds: 15 * 60, questionCount: "20 questions" },
  vocabulary: { title: "Vocabulary", timeLimitSeconds: 10 * 60, questionCount: "20 questions" },
  reading: { title: "Reading", timeLimitSeconds: 15 * 60, questionCount: "1 passage · 10 questions" },
  listening: { title: "Listening", timeLimitSeconds: 10 * 60, questionCount: "1 audio · 10 questions" },
  writing: { title: "Writing", timeLimitSeconds: 15 * 60, questionCount: "1 task" },
  speaking: { title: "Speaking", timeLimitSeconds: 5 * 60, questionCount: "2 questions" },
};

export const GRADUATION_SECTION_ORDER: GraduationSkill[] = [
  "grammar",
  "vocabulary",
  "reading",
  "listening",
  "writing",
  "speaking",
];

export function computeOverallScore(scores: Partial<Record<GraduationSkill, number>>) {
  const overall = Object.entries(SECTION_WEIGHTS).reduce(
    (total, [skill, weight]) =>
      total + (Number(scores[skill as GraduationSkill]) || 0) * weight,
    0
  );
  return Math.round(overall * 10) / 10;
}

export function gradeFromScore(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function getWritingTask(cefrCode: string) {
  const band = cefrCode.charAt(0).toUpperCase();
  if (band === "A") {
    return {
      prompt:
        "Write 3–5 sentences about your daily routine and one hobby you enjoy.",
      minWords: 30,
      maxWords: 80,
      instruction: "Write 3–5 sentences about the given topic.",
    };
  }
  if (band === "B") {
    return {
      prompt:
        "Write a paragraph (100–150 words) explaining whether online learning is better than classroom learning. Give reasons and examples.",
      minWords: 100,
      maxWords: 150,
      instruction: "Write a paragraph of 100–150 words.",
    };
  }
  return {
    prompt:
      "Write a short essay (200–250 words) discussing how technology has changed communication in education and society.",
    minWords: 200,
    maxWords: 250,
    instruction: "Write a short essay of 200–250 words.",
  };
}

export function generateCertificateId(cefrCode: string) {
  const year = new Date().getFullYear();
  const cefrPart = cefrCode.replace(".", "");
  const digits = String(Math.floor(10000 + Math.random() * 90000));
  return `SPK-${cefrPart}-${year}-${digits}`;
}

export function retestAvailableDate(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + RETEST_COOLDOWN_DAYS);
  return d;
}
