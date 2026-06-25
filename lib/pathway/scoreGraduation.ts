import OpenAI from "openai";
import {
  SECTION_WEIGHTS,
  computeOverallScore,
  type GraduationSkill,
} from "@/lib/pathway/graduationTestConfig";
import type { GraduationTestContent } from "@/lib/pathway/generateGraduationContent";

function scoreMcq(
  questions: Array<{ id: string; correctIndex?: number; correctAnswer?: string }>,
  answers: Record<string, number | string>
) {
  if (!questions.length) return 0;
  let correct = 0;
  for (const q of questions) {
    const ans = answers[q.id];
    if (q.correctIndex != null && ans === q.correctIndex) correct += 1;
    else if (
      q.correctAnswer != null &&
      String(ans).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
    ) {
      correct += 1;
    }
  }
  return Math.round((correct / questions.length) * 1000) / 10;
}

function scoreReading(
  questions: GraduationTestContent["reading"]["questions"],
  answers: Record<string, string>
) {
  if (!questions.length) return 0;
  let correct = 0;
  for (const q of questions) {
    const ans = String(answers[q.id] ?? "").trim().toLowerCase();
    const expected = String(q.correctAnswer).trim().toLowerCase();
    if (ans === expected) correct += 1;
  }
  return Math.round((correct / questions.length) * 1000) / 10;
}

function scoreListening(
  questions: GraduationTestContent["listening"]["questions"],
  answers: Record<string, string>
) {
  if (!questions.length) return 0;
  let correct = 0;
  for (const q of questions) {
    const ans = String(answers[q.id] ?? "").trim().toLowerCase();
    const expected = String(q.correctAnswer).trim().toLowerCase();
    if (ans === expected) correct += 1;
  }
  return Math.round((correct / questions.length) * 1000) / 10;
}

export async function scoreWritingSection(input: {
  cefrCode: string;
  prompt: string;
  answer: string;
}) {
  const text = input.answer?.trim() ?? "";
  if (!text) return 0;

  if (!process.env.OPENAI_API_KEY) {
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.min(100, Math.max(40, words * 2));
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Score IELTS-style writing for CEFR ${input.cefrCode} on 0-100 using official descriptors. JSON: {"score":number,"feedback":string}`,
      },
      {
        role: "user",
        content: `Prompt: ${input.prompt}\n\nStudent writing:\n${text}`,
      },
    ],
  });

  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return Math.min(100, Math.max(0, Number(parsed.score) || 0));
  } catch {
    return 60;
  }
}

export async function scoreSpeakingSection(input: {
  cefrCode: string;
  transcripts: string[];
}) {
  const combined = input.transcripts.filter(Boolean).join("\n\n").trim();
  if (!combined) return 0;

  if (!process.env.OPENAI_API_KEY) {
    const words = combined.split(/\s+/).filter(Boolean).length;
    return Math.min(100, Math.max(35, words * 1.5));
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Score speaking for CEFR ${input.cefrCode} on 0-100 for fluency, accuracy, and range combined. JSON: {"score":number}`,
      },
      { role: "user", content: combined },
    ],
  });

  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return Math.min(100, Math.max(0, Number(parsed.score) || 0));
  } catch {
    return 55;
  }
}

export async function scoreGraduationAttempt(
  content: GraduationTestContent,
  answers: {
    grammar?: Record<string, number>;
    vocabulary?: Record<string, number>;
    reading?: Record<string, string>;
    listening?: Record<string, string>;
    writing?: string;
    speaking?: string[];
  },
  cefrCode: string
) {
  const scores: Record<GraduationSkill, number> = {
    grammar: scoreMcq(content.grammar, answers.grammar ?? {}),
    vocabulary: scoreMcq(content.vocabulary, answers.vocabulary ?? {}),
    reading: scoreReading(content.reading.questions, answers.reading ?? {}),
    listening: scoreListening(content.listening.questions, answers.listening ?? {}),
    writing: await scoreWritingSection({
      cefrCode,
      prompt: content.writing.prompt,
      answer: answers.writing ?? "",
    }),
    speaking: await scoreSpeakingSection({
      cefrCode,
      transcripts: answers.speaking ?? [],
    }),
  };

  const overallScore = computeOverallScore(scores);
  const passed = overallScore >= 70;

  const weakAreas = (Object.keys(SECTION_WEIGHTS) as GraduationSkill[]).filter(
    (skill) => scores[skill] < 70
  );

  return { scores, overallScore, passed, weakAreas };
}
