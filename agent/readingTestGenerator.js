const path = require("path");
const cron = require("node-cron");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.7;
const MAX_TOKENS_DEFAULT = 4000;
const MAX_TOKENS_MATCHING_HEADINGS = 6000;
const MAX_TOKENS_RETRY = 6000;
const MIN_PASSAGE_WORDS = 400;
const MAX_RETRIES = 3;
const TESTS_PER_DAY = 5;
const CRON_SCHEDULE = "0 2 * * *";

const SYSTEM_MESSAGE =
  "You are an expert IELTS Academic Reading test creator trained by Cambridge Assessment English. You create authentic academic passages and questions that follow official IELTS format exactly. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanation — just the raw JSON object.";

const MOCK_TEST_SPECS = [
  {
    testNumber: 1,
    passages: [
      { topic: "Science and Technology", type: "multiple-choice", questions: 13 },
      { topic: "Environment and Ecology", type: "true-false-not-given", questions: 13 },
      { topic: "History and Archaeology", type: "sentence-completion", questions: 14 },
    ],
  },
  {
    testNumber: 2,
    passages: [
      { topic: "Psychology and Behaviour", type: "multiple-choice", questions: 13 },
      { topic: "Economics and Business", type: "matching-headings", questions: 13 },
      { topic: "Health and Medicine", type: "short-answer", questions: 14 },
    ],
  },
  {
    testNumber: 3,
    passages: [
      { topic: "Education and Learning", type: "true-false-not-given", questions: 13 },
      { topic: "Architecture and Design", type: "sentence-completion", questions: 13 },
      { topic: "Marine Biology", type: "multiple-choice", questions: 14 },
    ],
  },
  {
    testNumber: 4,
    passages: [
      { topic: "Astronomy and Space", type: "matching-headings", questions: 13 },
      { topic: "Agriculture and Food", type: "short-answer", questions: 13 },
      { topic: "Transport and Infrastructure", type: "true-false-not-given", questions: 14 },
    ],
  },
  {
    testNumber: 5,
    passages: [
      { topic: "Arts and Culture", type: "sentence-completion", questions: 13 },
      { topic: "Linguistics and Language", type: "multiple-choice", questions: 13 },
      { topic: "Sociology and Society", type: "short-answer", questions: 14 },
    ],
  },
];

function log(...args) {
  console.log("[ReadingGen]", ...args);
}

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function assertEnv() {
  const missing = [];
  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!getSupabaseUrl()) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in .env.local: ${missing.join(", ")}`
    );
  }
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function wordCount(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseJsonFromResponse(raw) {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  return JSON.parse(candidate);
}

function getMaxTokens(questionType, attempt) {
  if (attempt > 1) return MAX_TOKENS_RETRY;
  if (questionType === "matching-headings") return MAX_TOKENS_MATCHING_HEADINGS;
  return MAX_TOKENS_DEFAULT;
}

function buildUserMessage(topic, questionType, numberOfQuestions) {
  return `Create a complete IELTS Academic Reading passage.

Topic: ${topic}
Question Type: ${questionType}
Number of Questions: ${numberOfQuestions}

Return this exact JSON structure:
{
  "title": "string",
  "topic": "string",
  "difficulty": "medium",
  "content": "string (paragraphs labeled A through G, formal academic English)",
  "questionType": "string",
  "questions": [
    {
      "id": 1,
      "questionNumber": 1,
      "type": "string",
      "text": "string",
      "options": [],
      "answer": "string",
      "explanation": "string"
    }
  ]
}

Content length:
- The content field should be between 450 and 700 words.
- Write a complete academic passage with paragraphs labeled A through G.
- Aim for 500+ words minimum.

Rules:
- For multiple-choice: 4 options per question as [{ "label": "A", "text": "..." }, { "label": "B", "text": "..." }, { "label": "C", "text": "..." }, { "label": "D", "text": "..." }], empty array for other types
- For true-false-not-given: answer must be TRUE, FALSE, or NOT GIVEN
- For matching-headings: provide 10 heading options for 7 paragraphs, questions ask to match paragraph letters to heading numbers
- For sentence-completion: give incomplete sentence, answer is maximum 3 words from passage
- For short-answer: question with answer of maximum 3 words taken directly from passage
- Every answer must be directly supported by the passage text
- Questions must follow the order they appear in the passage
- Generate exactly ${numberOfQuestions} questions`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generatePassage(openai, topic, questionType, numberOfQuestions) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const maxTokens = getMaxTokens(questionType, attempt);

    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          {
            role: "user",
            content: buildUserMessage(topic, questionType, numberOfQuestions),
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      const parsed = parseJsonFromResponse(raw);

      if (!parsed.content || !Array.isArray(parsed.questions)) {
        throw new Error("Response missing content or questions array");
      }

      const words = wordCount(parsed.content);
      if (words < MIN_PASSAGE_WORDS) {
        throw new Error(
          `Passage too short (${words} words; minimum ${MIN_PASSAGE_WORDS})`
        );
      }

      parsed.topic = parsed.topic || topic;
      parsed.questionType = parsed.questionType || questionType;
      parsed.difficulty = parsed.difficulty || "medium";

      return parsed;
    } catch (err) {
      lastError = err;
      log(
        `  Retry ${attempt}/${MAX_RETRIES} failed for ${topic} (${questionType}, max_tokens=${maxTokens}):`,
        err.message
      );
      if (attempt < MAX_RETRIES) {
        await sleep(2000 * attempt);
      }
    }
  }

  throw lastError ?? new Error("Passage generation failed");
}

async function getTodayTestStatus(supabase, generationDate) {
  const { data, error } = await supabase
    .from("generated_mock_tests")
    .select("test_number")
    .eq("generation_date", generationDate);

  if (error) {
    throw new Error(`Failed to check existing tests: ${error.message}`);
  }

  const existingNumbers = new Set(
    (data ?? []).map((row) => Number(row.test_number))
  );

  return {
    count: existingNumbers.size,
    existingNumbers,
  };
}

async function saveMockTest(supabase, generationDate, spec, passages) {
  const topics = spec.passages.map((p) => p.topic);
  const totalQuestions = spec.passages.reduce((sum, p) => sum + p.questions, 0);

  const payload = {
    test_number: spec.testNumber,
    generation_date: generationDate,
    passage_1: passages[0],
    passage_2: passages[1],
    passage_3: passages[2],
    total_questions: totalQuestions,
    topics,
    is_available: true,
    times_used: 0,
  };

  const { error } = await supabase.from("generated_mock_tests").upsert(payload, {
    onConflict: "generation_date,test_number",
  });

  if (error) {
    throw new Error(
      `Failed to save Mock Test ${spec.testNumber}: ${error.message}`
    );
  }
}

async function generateMockTest(openai, spec) {
  const passages = [];

  for (let i = 0; i < spec.passages.length; i += 1) {
    const p = spec.passages[i];
    const label = `${i + 1}/3`;
    log(
      `Passage ${label} — ${p.topic} (${p.type})...`
    );

    try {
      const passage = await generatePassage(
        openai,
        p.topic,
        p.type,
        p.questions
      );
      const words = wordCount(passage.content);
      const qCount = passage.questions?.length ?? 0;
      log(`Passage ${i + 1} done — ${words} words, ${qCount} questions`);
      passages.push(passage);
    } catch (err) {
      log(`Passage ${i + 1} FAILED — ${err.message}`);
      throw err;
    }

    if (i < spec.passages.length - 1) {
      await sleep(1500);
    }
  }

  return passages;
}

async function runReadingTestGeneration() {
  assertEnv();

  const generationDate = getTodayDateKey();
  const supabase = getSupabase();
  const openai = getOpenAI();

  log("========================================");
  log("Starting IELTS Reading Test Generation");
  log(`Date: ${generationDate}`);
  log("========================================");

  log("Checking existing tests for today...");
  const { count: existingCount, existingNumbers } = await getTodayTestStatus(
    supabase,
    generationDate
  );

  if (existingCount >= TESTS_PER_DAY) {
    log("Today's tests already exist");
    log("========================================");
    return { skipped: true, count: existingCount };
  }

  log(
    `Found ${existingCount} test(s) for today — generating up to ${TESTS_PER_DAY - existingCount} more`
  );

  let saved = 0;

  for (const spec of MOCK_TEST_SPECS) {
    if (existingNumbers.has(spec.testNumber)) {
      continue;
    }

    log(`Generating Mock Test ${spec.testNumber} of ${TESTS_PER_DAY}...`);

    try {
      const passages = await generateMockTest(openai, spec);
      await saveMockTest(supabase, generationDate, spec, passages);
      saved += 1;
      log(`Mock Test ${spec.testNumber} saved to Supabase ✓`);
    } catch (err) {
      log(`Mock Test ${spec.testNumber} aborted — ${err.message}`);
    }

    await sleep(2000);
  }

  const { count: finalCount } = await getTodayTestStatus(supabase, generationDate);

  log("========================================");
  if (finalCount >= TESTS_PER_DAY) {
    log(`Generation complete — ${finalCount} tests ready`);
  } else {
    log(
      `Generation finished with ${finalCount}/${TESTS_PER_DAY} tests — re-run to fill gaps`
    );
  }
  log("Next run scheduled: 2:00 AM tomorrow");
  log("========================================");

  return { skipped: false, saved, count: finalCount };
}

let generationRunning = false;

async function runScheduledGeneration(trigger) {
  if (generationRunning) {
    log(`Skipping ${trigger} — generation already in progress`);
    return;
  }

  generationRunning = true;
  try {
    await runReadingTestGeneration();
  } catch (err) {
    console.error("[ReadingGen] Fatal error:", err.message);
  } finally {
    generationRunning = false;
  }
}

cron.schedule(CRON_SCHEDULE, () => {
  log("Cron triggered — 2:00 AM daily run");
  runScheduledGeneration("cron").catch((err) => {
    console.error("[ReadingGen] Cron failed:", err.message);
  });
});

if (require.main === module) {
  runScheduledGeneration("startup")
    .then(() => {
      log("Process alive — waiting for next cron run");
    })
    .catch((err) => {
      console.error("[ReadingGen] Startup failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runReadingTestGeneration,
  MOCK_TEST_SPECS,
  getTodayDateKey,
};
