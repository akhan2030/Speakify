import OpenAI from "openai";
import { FULL_MOCK_TEST } from "@/lib/readingMockTestContent";
import type { MockExamContent, ReadingPassage } from "./types";

function fallbackReadingContent(): MockExamContent {
  const passages: ReadingPassage[] = FULL_MOCK_TEST.passages.map((p, i) => ({
    id: p.id,
    index: p.index,
    title: p.title,
    difficulty: i === 0 ? "Band 5–6" : i === 1 ? "Band 6–7" : "Band 7–9",
    paragraphs: p.paragraphs.map((para) => ({
      id: para.id,
      label: para.label,
      text: para.text,
    })),
    questions: p.questions.map((q) => ({
      id: q.id,
      globalNumber: q.globalNumber,
      kind: q.kind,
      typeLabel: q.typeLabel ?? q.kind,
      text: q.text ?? "",
      correct: q.correct,
      options: q.options,
      headings: q.headings,
    })),
    startNumber: p.startNumber,
    endNumber: p.endNumber,
  }));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    reading: { passages, totalQuestions: 40 },
  };
}

/** Instant placeholder — no API call. Used to render the exam shell immediately. */
export function getFallbackExamContent(): MockExamContent {
  return fallbackReadingContent();
}

export async function generateReadingExamContent(): Promise<MockExamContent> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackReadingContent();
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You create ORIGINAL IELTS Academic Reading mock content. Never copy real IELTS materials.
Return JSON: { "passages": [ { "index": 1, "title": string, "difficulty": string, "paragraphs": [{"label":"A","text": string}], "questions": [{"globalNumber": number, "kind": string, "typeLabel": string, "text": string, "correct": string, "options": [{"key":"A","label": string}]?, "headings": [{"key":"i","label": string}]?, "wordBank": [string]? }] } ] }
Passage 1: 800-900 words, TFNG Q1-7 + sentence completion Q8-13 (max 2 words).
Passage 2: 1000-1100 words, matching headings Q14-19 + MCQ Q20-26.
Passage 3: 1200-1400 words, YNNG Q27-33 + summary with word bank Q34-40.
Topics: daily life/environment; psychology/education; science/history. All original.`,
        },
        {
          role: "user",
          content:
            "Generate a complete 3-passage IELTS Academic reading mock test with exactly 40 questions numbered 1-40.",
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      passages?: Array<{
        index: number;
        title: string;
        difficulty: string;
        paragraphs: { label: string; text: string }[];
        questions: ReadingPassage["questions"];
      }>;
    };

    if (!parsed.passages?.length) return fallbackReadingContent();

    const passages: ReadingPassage[] = parsed.passages.map((p, idx) => {
      const startNumber = p.questions[0]?.globalNumber ?? idx * 13 + 1;
      const endNumber = p.questions[p.questions.length - 1]?.globalNumber ?? startNumber + 12;
      return {
        id: `reading-p${p.index}`,
        index: p.index,
        title: p.title,
        difficulty: p.difficulty,
        paragraphs: p.paragraphs.map((para, pi) => ({
          id: `p${p.index}-${pi}`,
          label: para.label,
          text: para.text,
        })),
        questions: p.questions.map((q) => ({
          ...q,
          id: `r-q${q.globalNumber}`,
        })),
        startNumber,
        endNumber,
      };
    });

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      reading: {
        passages,
        totalQuestions: passages.reduce((n, p) => n + p.questions.length, 0),
      },
    };
  } catch (err) {
    console.error("[generateReadingExamContent]", err);
    return fallbackReadingContent();
  }
}

export function getReadingQuestions(content: MockExamContent) {
  return content.reading.passages.flatMap((p) => p.questions);
}

export function buildReadingAnswerKey(content: MockExamContent) {
  const map: Record<string, string> = {};
  for (const q of getReadingQuestions(content)) {
    if (q.correct) map[q.id] = q.correct;
  }
  return map;
}
