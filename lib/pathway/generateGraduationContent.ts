import OpenAI from "openai";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import { getWritingTask } from "@/lib/pathway/graduationTestConfig";

export type McqQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type ReadingQuestion = {
  id: string;
  type: "tfng" | "completion";
  question: string;
  options?: string[];
  correctAnswer: string;
};

export type GraduationTestContent = {
  grammar: McqQuestion[];
  vocabulary: McqQuestion[];
  reading: { passage: string; questions: ReadingQuestion[] };
  listening: {
    transcript: string;
    questions: Array<{
      id: string;
      type: "mcq" | "form";
      question: string;
      options?: string[];
      correctAnswer: string;
    }>;
  };
  writing: ReturnType<typeof getWritingTask>;
  speaking: Array<{ id: string; prompt: string }>;
};

function fallbackMcq(prefix: string, topics: string[], count: number): McqQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    question: `(${topics[i % topics.length]}) Choose the correct option:`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: i % 4,
  }));
}

function buildFallback(code: string, focus: string): GraduationTestContent {
  const grammarTopics = focus.split(",").map((s) => s.trim()).slice(0, 5);
  return {
    grammar: fallbackMcq("g", grammarTopics.length ? grammarTopics : ["grammar"], 20),
    vocabulary: fallbackMcq("v", ["definition", "collocation", "academic word"], 20),
    reading: {
      passage: `This academic passage is designed for ${code} learners. ${focus}. Students read carefully and answer questions about main ideas and details.`,
      questions: Array.from({ length: 10 }, (_, i) => ({
        id: `r-${i + 1}`,
        type: i < 5 ? ("tfng" as const) : ("completion" as const),
        question:
          i < 5
            ? "The passage states that practice improves performance."
            : "Complete: Students should review material ___ a weekly basis.",
        options: i < 5 ? ["True", "False", "Not Given"] : undefined,
        correctAnswer: i < 5 ? "True" : "on",
      })),
    },
    listening: {
      transcript: `Welcome to the ${code} listening section. Today we discuss ${focus.split(",")[0] ?? "study skills"}. Remember to listen carefully as the recording plays once.`,
      questions: Array.from({ length: 10 }, (_, i) => ({
        id: `l-${i + 1}`,
        type: i % 2 === 0 ? ("mcq" as const) : ("form" as const),
        question: i % 2 === 0 ? "What is the main topic?" : "Fill in: The session focuses on ___ skills.",
        options: i % 2 === 0 ? ["Study skills", "Sports", "Cooking", "Travel"] : undefined,
        correctAnswer: i % 2 === 0 ? "Study skills" : "language",
      })),
    },
    writing: getWritingTask(code),
    speaking: [
      { id: "s-1", prompt: `Describe your experience learning English at ${code} level.` },
      { id: "s-2", prompt: "What skill do you want to improve most and why?" },
    ],
  };
}

export async function generateGraduationTestContent(input: {
  cefrCode: string;
  levelName: string;
  focusAreas: string;
}): Promise<GraduationTestContent> {
  const display = getPathwayLevelDisplay(input.cefrCode);
  const writing = getWritingTask(input.cefrCode);

  if (!process.env.OPENAI_API_KEY) {
    return buildFallback(input.cefrCode, display.focusAreas);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate a CEFR graduation exam as JSON for Speakify LMS.
Schema:
{
  "grammar":[{"id":"g1","question":string,"options":[4 strings],"correctIndex":0-3}] (20 items),
  "vocabulary":[{"id":"v1","question":string,"options":[4 strings],"correctIndex":0-3}] (20 items),
  "reading":{"passage":string,"questions":[{"id":"r1","type":"tfng"|"completion","question":string,"options":["True","False","Not Given"]?,"correctAnswer":string}]} (10 items),
  "listening":{"transcript":string (120-180 words),"questions":[{"id":"l1","type":"mcq"|"form","question":string,"options"?,"correctAnswer":string}]} (10 items),
  "speaking":[{"id":"s1","prompt":string},{"id":"s2","prompt":string}]
}
Match ${input.cefrCode} difficulty. Grammar focus: ${display.focusAreas}.`,
        },
        {
          role: "user",
          content: `Level: ${input.levelName} (${input.cefrCode})`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return {
      grammar: parsed.grammar?.slice(0, 20) ?? buildFallback(input.cefrCode, display.focusAreas).grammar,
      vocabulary: parsed.vocabulary?.slice(0, 20) ?? buildFallback(input.cefrCode, display.focusAreas).vocabulary,
      reading: parsed.reading ?? buildFallback(input.cefrCode, display.focusAreas).reading,
      listening: parsed.listening ?? buildFallback(input.cefrCode, display.focusAreas).listening,
      writing,
      speaking: parsed.speaking?.slice(0, 2) ?? buildFallback(input.cefrCode, display.focusAreas).speaking,
    };
  } catch (err) {
    console.warn("[generateGraduationContent]", err);
    return buildFallback(input.cefrCode, display.focusAreas);
  }
}
