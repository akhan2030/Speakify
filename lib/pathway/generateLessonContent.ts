import OpenAI from "openai";
import type { PathwayDayType } from "@/lib/pathway/dayStructure";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import { isPlaceholderLessonContent } from "@/lib/pathway/lessonContentValidation";
import { isAbortError, openaiChatWithTimeout } from "@/lib/openaiTimeout";

export type LessonContent = Record<string, unknown>;

const LESSON_OPENAI_TIMEOUT_MS = 45000;

function requireOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
  return key;
}

function parseJsonContent(raw: string): LessonContent {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = jsonBlock ? jsonBlock[1].trim() : trimmed;
  return JSON.parse(toParse) as LessonContent;
}

function logOpenAiPreview(label: string, raw: string) {
  console.log(`${label}:`, raw.substring(0, 200));
}

function normalizeVocabularyItems(
  items: Array<Record<string, unknown>>
): Array<Record<string, string>> {
  return items.slice(0, 15).map((v, i) => ({
    id: String(v.id ?? `v-${i + 1}`),
    word: String(v.word ?? "").trim(),
    partOfSpeech: String(v.partOfSpeech ?? v.part_of_speech ?? "noun"),
    definition: String(v.definition ?? "").trim(),
    example: String(v.example ?? "").trim(),
    ieltsExample: String(v.ieltsExample ?? v.ielts_example ?? v.example ?? "").trim(),
    arabic: String(v.arabic ?? "").trim(),
  }));
}

/** Monday vocabulary — dedicated gpt-4o call (per product spec). */
async function generateMondayVocabulary(
  openai: OpenAI,
  cefrCode: string,
  week: number,
  focusAreas: string
): Promise<Array<Record<string, string>>> {
  console.log("Calling OpenAI for vocabulary...");
  const completion = await openaiChatWithTimeout(
    openai,
    {
      model: "gpt-4o",
      max_tokens: 2000,
      temperature: 0.5,
      messages: [
        {
          role: "user",
          content: `Generate 15 real English vocabulary words for CEFR level ${cefrCode} students in Saudi Arabia.
Week ${week} focus: ${focusAreas}
Return ONLY valid JSON in this exact format, no markdown:
{
  "vocabulary": [
    {
      "word": "persevere",
      "definition": "to continue trying despite difficulties",
      "arabic": "يثابر، يواصل",
      "example": "She persevered with her studies despite working full time.",
      "ielts_example": "Students must persevere through challenges to achieve their target band."
    }
  ]
}
Rules: exactly 15 unique academic words appropriate for ${cefrCode}; real Arabic translations; Saudi or IELTS context in examples; never use placeholders like word1 or word2.`,
        },
      ],
    },
    LESSON_OPENAI_TIMEOUT_MS
  );

  const raw = completion.choices[0]?.message?.content ?? "{}";
  logOpenAiPreview("OpenAI vocabulary response", raw);
  const parsed = parseJsonContent(raw);
  const list = parsed.vocabulary;
  if (!Array.isArray(list) || list.length < 5) {
    throw new Error("OpenAI vocabulary response did not include enough words.");
  }
  const normalized = normalizeVocabularyItems(list);
  const bad = normalized.filter(
    (v) => /^word\d+$/i.test(v.word) || !v.word || !v.definition
  );
  if (bad.length > 0) {
    throw new Error("OpenAI returned placeholder vocabulary — retry generation.");
  }
  return normalized;
}

async function generateMondayInputLesson(
  openai: OpenAI,
  input: {
    cefrCode: string;
    week: number;
    focusAreas: string;
  }
): Promise<LessonContent> {
  const vocabulary = await generateMondayVocabulary(
    openai,
    input.cefrCode,
    input.week,
    input.focusAreas
  );

  const wordList = vocabulary.map((v) => v.word).join(", ");
  console.log("Calling OpenAI for Monday grammar + reading...");

  const completion = await openaiChatWithTimeout(
    openai,
    {
      model: "gpt-4o",
      max_tokens: 4000,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert IELTS teacher for Saudi Arabian students. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Create Monday Input lesson content for CEFR ${input.cefrCode}, week ${input.week}.
Focus: ${input.focusAreas}
Use these 15 vocabulary words in the reading passage: ${wordList}
Include Saudi Arabia context (Riyadh, university, Vision 2030, etc.).

Return JSON only:
{
  "grammarTitle": "...",
  "grammarExplanation": "3-4 paragraphs separated by \\n\\n",
  "grammarExamples": ["5 real sentences"],
  "saudiContext": "paragraph",
  "commonMistakes": ["3 mistakes Saudi Arabic speakers make"],
  "passage": "300-500 word academic reading using the vocabulary",
  "comprehension": [{"id":"c-1","question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]
}
Exactly 5 comprehension questions. correctIndex must vary.`,
        },
      ],
    },
    LESSON_OPENAI_TIMEOUT_MS
  );

  const raw = completion.choices[0]?.message?.content ?? "{}";
  logOpenAiPreview("OpenAI Monday lesson response", raw);
  const parsed = parseJsonContent(raw);

  const content: LessonContent = {
    ...parsed,
    vocabulary,
  };

  if (isPlaceholderLessonContent(content, "input")) {
    throw new Error("Generated Monday content still looks like a template.");
  }
  return content;
}

function dayPrompt(
  dayType: PathwayDayType,
  cefrCode: string,
  week: number,
  focusAreas: string,
  previousVocab: Array<{ word?: string; definition?: string }>
): string {
  const schemas: Record<PathwayDayType, string> = {
    input: "",
    practice: `TUESDAY Practice JSON: grammarExercises (10 fill blanks), vocabExercises (10 MCQ match), listening { transcript 150 words Saudi context, questions 3-5 MCQs }. Real content only.`,
    application: `WEDNESDAY Application JSON: speakingPrompt, speakingTips[3], writing {prompt, instruction, minWords, maxWords}, writingTips[3], bandDescriptors {band5,band6,band7}, modelAnswer {speaking, writing}.`,
    review: `THURSDAY Review JSON: reviewBanner, vocabReview (10 MCQs), grammarReview (5 MCQs). Previous words: ${JSON.stringify(previousVocab.slice(0, 15).map((v) => v.word))}`,
    assessment: `FRIDAY Assessment JSON: quiz (20 items: 8 grammar, 6 vocabulary, 6 reading), timerMinutes 30. Real questions only.`,
  };

  return `Generate Speakify pathway lesson for CEFR ${cefrCode}, week ${week}, day ${dayType}.
Focus: ${focusAreas}
Saudi context required. Return ONLY valid JSON. ${schemas[dayType]}`;
}

async function generateDayWithOpenAI(
  openai: OpenAI,
  input: {
    dayType: PathwayDayType;
    cefrCode: string;
    week: number;
    focusAreas: string;
    previousVocab?: Array<{ word?: string; definition?: string }>;
  }
): Promise<LessonContent> {
  console.log(`Calling OpenAI for ${input.dayType} lesson...`);
  const completion = await openaiChatWithTimeout(
    openai,
    {
      model: "gpt-4o",
      max_tokens: 4000,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert IELTS and CEFR curriculum designer for Saudi Arabian students. Return only valid JSON with real words — never placeholders.",
        },
        {
          role: "user",
          content: dayPrompt(
            input.dayType,
            input.cefrCode,
            input.week,
            input.focusAreas,
            input.previousVocab ?? []
          ),
        },
      ],
    },
    LESSON_OPENAI_TIMEOUT_MS
  );

  const raw = completion.choices[0]?.message?.content ?? "{}";
  logOpenAiPreview(`OpenAI ${input.dayType} response`, raw);
  const parsed = parseJsonContent(raw);

  if (isPlaceholderLessonContent(parsed, input.dayType)) {
    throw new Error(`Generated ${input.dayType} content looks like a template.`);
  }
  return parsed;
}

export async function generateLessonContentWithAI(input: {
  dayType: PathwayDayType;
  cefrCode: string;
  week: number;
  focusAreas: string;
  levelSlug?: string;
  previousVocab?: Array<{ word?: string; definition?: string }>;
}): Promise<LessonContent> {
  const display = getPathwayLevelDisplay(input.cefrCode, input.focusAreas);
  const focus = input.focusAreas || display.focusAreas;
  const apiKey = requireOpenAiKey();
  const openai = new OpenAI({ apiKey });

  console.log(
    "[generateLessonContentWithAI] OPENAI_API_KEY present, length:",
    apiKey.length
  );

  try {
    if (input.dayType === "input") {
      return await generateMondayInputLesson(openai, {
        cefrCode: input.cefrCode,
        week: input.week,
        focusAreas: focus,
      });
    }

    return await generateDayWithOpenAI(openai, {
      ...input,
      focusAreas: focus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("OpenAI error:", message);
    if (isAbortError(err)) throw err;
    throw new Error(message || "OpenAI lesson generation failed");
  }
}

/** @deprecated Placeholder content removed — use generateLessonContentWithAI only. */
export function getStaticLessonContent(): never {
  throw new Error(
    "Static placeholder lesson content is disabled. Configure OPENAI_API_KEY in .env.local."
  );
}

export async function generateLessonContent(input: {
  dayType: PathwayDayType;
  cefrCode: string;
  week: number;
  focusAreas: string;
  levelSlug?: string;
  previousVocab?: Array<{ word?: string; definition?: string }>;
}): Promise<LessonContent> {
  return generateLessonContentWithAI(input);
}
