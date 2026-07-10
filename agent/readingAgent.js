/**
 * Daily reading agent — 4:00 AM
 * Generates 1 academic passage × 10 CEFR levels → daily_ai_tasks (draft)
 * Manual: npm run agent:reading-bank
 */

const path = require("path");
const crypto = require("crypto");
const cron = require("node-cron");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");
const { dailyTaskPublishFields } = require("./dailyTaskPublish.js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MODEL = "gpt-4o";
const TEMPERATURE = 0.7;
const CRON_SCHEDULE = "0 4 * * *";
const PASSAGES_PER_LEVEL = 1;
const MIN_QUESTIONS = 8;
const MAX_QUESTIONS = 12;
const MAX_RETRIES = 3;
const AGENT_NAME = "reading_agent";

const CEFR_LEVELS = [
  "A1.1",
  "A1.2",
  "A2.1",
  "A2.2",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
  "C1.1",
  "C1.2",
];

const TOPICS = [
  "education",
  "technology",
  "environment",
  "health",
  "urban development",
  "Saudi Vision 2030",
  "science",
  "culture",
  "economics",
  "travel",
];

const MCQ_INDEX_TARGETS = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

const SYSTEM_MESSAGE = `You are an expert IELTS Academic Reading test creator for Saudi Arabian learners.
Write culturally appropriate academic passages and questions aligned to the specified CEFR level.
Every question MUST include a correct_answer and a clear explanation referencing the passage.
Return ONLY valid JSON. No markdown. No commentary.`;

function log(...args) {
  console.log("[ReadingAgent]", ...args);
}

function md5(value) {
  return crypto.createHash("md5").update(String(value)).digest("hex");
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

function getTodayBounds(dateKey) {
  return {
    start: `${dateKey}T00:00:00.000Z`,
    end: `${dateKey}T23:59:59.999Z`,
  };
}

function getBandForLevel(level) {
  const map = {
    "A1.1": "3.0-3.5",
    "A1.2": "3.5-4.0",
    "A2.1": "4.0-4.5",
    "A2.2": "4.5-5.0",
    "B1.1": "5.0-5.5",
    "B1.2": "5.5-6.0",
    "B2.1": "6.0-6.5",
    "B2.2": "6.5-7.0",
    "C1.1": "7.0-7.5",
    "C1.2": "7.5-8.0",
  };
  return map[level] ?? "5.0-5.5";
}

function getDifficultyForLevel(level) {
  const band = level.charAt(0);
  if (band === "A") return level.endsWith(".1") ? "beginner" : "elementary";
  if (band === "B") return level.endsWith(".1") ? "intermediate" : "upper_intermediate";
  return "advanced";
}

function getPassageWordRange(level) {
  if (level.startsWith("A")) return { min: 300, max: 400 };
  if (level.startsWith("B")) return { min: 600, max: 800 };
  return { min: 900, max: 1100 };
}

function getEstimatedMinutes(level) {
  if (level.startsWith("A")) return 15;
  if (level.startsWith("B")) return 20;
  return 25;
}

function pickTopic(level) {
  const idx = CEFR_LEVELS.indexOf(level);
  return TOPICS[idx >= 0 ? idx : 0];
}

function wordCount(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonFromResponse(raw) {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  return JSON.parse(candidate);
}

function normalizeQuestionType(type) {
  const t = String(type ?? "").toLowerCase().replace(/\s+/g, "_");
  if (t.includes("true") || t === "tfng" || t === "t_f_ng") {
    return "true_false_not_given";
  }
  if (t.includes("multiple") || t === "mcq") return "multiple_choice";
  if (t.includes("sentence") || t.includes("completion")) {
    return "sentence_completion";
  }
  return t;
}

function shuffleMcqOptions(question, targetIndex) {
  const options = Array.isArray(question.options)
    ? question.options.map(String)
    : [];
  if (options.length !== 4) {
    throw new Error("multiple_choice must have exactly 4 options");
  }

  const correctText = String(question.correct_answer ?? "").trim();
  let correctIdx = options.findIndex(
    (o) => o.trim().toLowerCase() === correctText.toLowerCase()
  );

  if (correctIdx < 0 && /^[a-d]$/i.test(correctText)) {
    correctIdx = correctText.toUpperCase().charCodeAt(0) - 65;
  }

  if (correctIdx < 0 && Number.isInteger(question.correct_index)) {
    correctIdx = question.correct_index;
  }

  if (correctIdx < 0 || correctIdx > 3) {
    throw new Error("multiple_choice missing valid correct_answer");
  }

  const correctOption = options[correctIdx];
  const distractors = options.filter((_, i) => i !== correctIdx);
  const newOptions = [...distractors];
  newOptions.splice(targetIndex, 0, correctOption);

  return {
    ...question,
    options: newOptions.slice(0, 4),
    correct_answer: correctOption,
    correct_index: targetIndex,
  };
}

function normalizeQuestions(questions) {
  let mcqSlot = 0;

  return questions.map((q, index) => {
    const type = normalizeQuestionType(q.type);
    let normalized = {
      id: q.id ?? index + 1,
      type,
      question: String(q.question ?? q.stem ?? "").trim(),
      correct_answer: String(q.correct_answer ?? q.answer ?? "").trim(),
      explanation: String(q.explanation ?? "").trim(),
    };

    if (!normalized.question || !normalized.correct_answer || !normalized.explanation) {
      throw new Error(`Question ${index + 1} missing question, correct_answer, or explanation`);
    }

    if (type === "true_false_not_given") {
      normalized.options = ["True", "False", "Not Given"];
      const ans = normalized.correct_answer.toLowerCase();
      if (!["true", "false", "not given"].includes(ans)) {
        throw new Error(`Question ${index + 1}: T/F/NG answer must be True, False, or Not Given`);
      }
      normalized.correct_answer =
        ans === "not given"
          ? "Not Given"
          : ans.charAt(0).toUpperCase() + ans.slice(1);
    } else if (type === "multiple_choice") {
      normalized.options = Array.isArray(q.options)
        ? q.options.map(String).slice(0, 4)
        : [];
      while (normalized.options.length < 4) normalized.options.push("");
      normalized = shuffleMcqOptions(
        normalized,
        MCQ_INDEX_TARGETS[mcqSlot % MCQ_INDEX_TARGETS.length]
      );
      mcqSlot += 1;
    } else if (type === "sentence_completion") {
      normalized.max_words = Number(q.max_words ?? q.word_limit ?? 3);
    } else {
      throw new Error(`Question ${index + 1}: unsupported type "${q.type}"`);
    }

    return normalized;
  });
}

function buildAnswerKey(questions) {
  return {
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      correct_answer: q.correct_answer,
      correct_index: q.correct_index ?? null,
    })),
  };
}

function buildUserMessage(cefrLevel, topic, wordRange, retryNote) {
  const retry = retryNote ? `\nIMPORTANT FIX: ${retryNote}\n` : "";

  return `Create ONE IELTS Academic Reading passage for CEFR level ${cefrLevel}.
${retry}
Topic: ${topic}
Passage length: YOU MUST write ${wordRange.min} to ${wordRange.max} words in the passage field. Count carefully — shorter passages will be rejected.
Questions: ${MIN_QUESTIONS} to ${MAX_QUESTIONS} total

Include a MIX of these question types:
1. true_false_not_given — statement + answer True / False / Not Given
2. multiple_choice — exactly 4 options, correct_answer must be the full text of the correct option (not A/B/C/D letter)
3. sentence_completion — complete the sentence with words FROM the passage (max 3 words unless stated)

Return JSON:
{
  "title": "short academic title",
  "topic": "${topic}",
  "cefr_level": "${cefrLevel}",
  "passage": "full passage text — ${wordRange.min}-${wordRange.max} words",
  "questions": [
    {
      "id": 1,
      "type": "true_false_not_given" | "multiple_choice" | "sentence_completion",
      "question": "string",
      "options": ["only for multiple_choice — 4 strings"],
      "correct_answer": "string",
      "explanation": "why this is correct, citing passage logic"
    }
  ]
}

Rules:
- At least 2 question types must appear in the set.
- Every question needs correct_answer AND explanation.
- Language and complexity must match ${cefrLevel} only.
- Culturally appropriate for Saudi learners; no offensive content.
- Do not copy from real IELTS papers — original content only.`;
}

function validatePassage(content, cefrLevel) {
  const range = getPassageWordRange(cefrLevel);
  const count = wordCount(content.passage);

  if (count < range.min - 30 || count > range.max + 50) {
    throw new Error(
      `Passage word count ${count} outside ${range.min}-${range.max} for ${cefrLevel}`
    );
  }

  const questions = content.questions ?? [];
  if (questions.length < MIN_QUESTIONS || questions.length > MAX_QUESTIONS) {
    throw new Error(
      `Expected ${MIN_QUESTIONS}-${MAX_QUESTIONS} questions, got ${questions.length}`
    );
  }

  const types = new Set(questions.map((q) => q.type));
  if (types.size < 2) {
    throw new Error("Questions must include at least 2 different types");
  }
}

async function getTodayPassageCount(supabase, generationDate, cefrLevel) {
  const { start, end } = getTodayBounds(generationDate);
  const { count, error } = await supabase
    .from("daily_ai_tasks")
    .select("id", { count: "exact", head: true })
    .eq("skill", "reading")
    .eq("task_type", "reading_passage")
    .eq("cefr_level", cefrLevel)
    .gte("generated_at", start)
    .lte("generated_at", end);

  if (error) throw error;
  return count ?? 0;
}

async function hashExists(supabase, contentHash) {
  const { data, error } = await supabase
    .from("daily_ai_tasks")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function generatePassageForLevel(openai, cefrLevel, topic) {
  const wordRange = getPassageWordRange(cefrLevel);
  const maxTokens = cefrLevel.startsWith("C") ? 12000 : 8000;

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const retryNote = lastError ? lastError.message : null;
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          {
            role: "user",
            content: buildUserMessage(cefrLevel, topic, wordRange, retryNote),
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      const parsed = parseJsonFromResponse(raw);

      const passage = String(parsed.passage ?? "").trim();
      const title = String(parsed.title ?? `Reading: ${topic}`).trim();
      if (!passage) throw new Error("Missing passage text");

      const questions = normalizeQuestions(
        Array.isArray(parsed.questions) ? parsed.questions : []
      );

      const content = {
        title,
        topic: String(parsed.topic ?? topic).trim(),
        cefr_level: cefrLevel,
        ielts_band_target: getBandForLevel(cefrLevel),
        word_count: wordCount(passage),
        passage,
        questions,
      };

      validatePassage(content, cefrLevel);
      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        log(`    Retry ${attempt}/${MAX_RETRIES} for ${cefrLevel}: ${lastError.message}`);
        await sleep(1200);
      }
    }
  }

  throw lastError ?? new Error(`Failed to generate ${cefrLevel}`);
}

async function saveReadingTask(supabase, content, generationDate) {
  const contentHash = md5(
    `${content.title.toLowerCase()}${content.cefr_level}${generationDate}`
  );

  if (await hashExists(supabase, contentHash)) {
    log(`  Skip duplicate: ${content.title} (${content.cefr_level})`);
    return { saved: false, reason: "duplicate_hash" };
  }

  const answerKey = buildAnswerKey(content.questions);
  const total = content.questions.length;

  const payload = {
    skill: "reading",
    task_type: "reading_passage",
    cefr_level: content.cefr_level,
    ielts_band_target: content.ielts_band_target,
    difficulty: getDifficultyForLevel(content.cefr_level),
    topic: content.topic,
    title: `Reading: ${content.title}`,
    content,
    answer_key: answerKey,
    marking_rubric: {
      pass_score: Math.ceil(total * 0.7),
      total,
    },
    estimated_minutes: getEstimatedMinutes(content.cefr_level),
    ...dailyTaskPublishFields(),
    content_hash: contentHash,
    tags: [content.cefr_level, "reading", "reading_passage", content.topic],
  };

  const { error } = await supabase.from("daily_ai_tasks").insert(payload);
  if (error) {
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return { saved: false, reason: "duplicate_db" };
    }
    throw new Error(`Insert daily_ai_tasks (${content.title}): ${error.message}`);
  }

  return { saved: true, contentHash };
}

async function logAgentRun(supabase, run) {
  const { error } = await supabase.from("agent_logs").insert({
    agent_name: AGENT_NAME,
    run_date: run.runDate,
    started_at: run.startedAt,
    completed_at: run.completedAt ?? new Date().toISOString(),
    status: run.status,
    tasks_generated: run.tasksGenerated ?? 0,
    tasks_failed: run.tasksFailed ?? 0,
    errors: run.errors?.length ? run.errors : null,
    notes: run.notes ?? null,
  });

  if (error) {
    console.error("[ReadingAgent] agent_logs insert failed:", error.message);
  }
}

async function runReadingGeneration() {
  assertEnv();

  const generationDate = getTodayDateKey();
  const startedAt = new Date().toISOString();
  const supabase = getSupabase();
  const openai = getOpenAI();

  let tasksGenerated = 0;
  let tasksFailed = 0;
  const errors = [];

  log("========================================");
  log("Speakify Reading Agent — AI Practice Bank");
  log(`Date: ${generationDate}`);
  log(`Target: ${CEFR_LEVELS.length} passages (1 per CEFR level)`);
  log("========================================");

  try {
    for (const cefrLevel of CEFR_LEVELS) {
      const existing = await getTodayPassageCount(
        supabase,
        generationDate,
        cefrLevel
      );

      if (existing >= PASSAGES_PER_LEVEL) {
        log(`  Skip ${cefrLevel} — passage already generated today`);
        tasksGenerated += PASSAGES_PER_LEVEL;
        continue;
      }

      const topic = pickTopic(cefrLevel);
      log(`  Generating passage for ${cefrLevel} (${topic})...`);

      try {
        const content = await generatePassageForLevel(openai, cefrLevel, topic);
        const result = await saveReadingTask(supabase, content, generationDate);

        if (result.saved) {
          tasksGenerated += 1;
          log(
            `  Saved ${cefrLevel} ✓ — "${content.title}" (${content.word_count} words, ${content.questions.length} questions)`
          );
        } else {
          tasksFailed += 1;
        }

        await sleep(1000);
      } catch (levelErr) {
        tasksFailed += 1;
        errors.push(`${cefrLevel}: ${levelErr.message}`);
        log(`  ✗ ${cefrLevel} failed: ${levelErr.message}`);
      }
    }

    log("========================================");
    log(`Done — ${tasksGenerated} drafts saved, ${tasksFailed} failed/skipped`);
    log("All content saved as status: published (live for students)");
    log("Next run: 4:00 AM tomorrow");
    log("========================================");

    await logAgentRun(supabase, {
      runDate: generationDate,
      startedAt,
      completedAt: new Date().toISOString(),
      status: errors.length ? "partial" : "success",
      tasksGenerated,
      tasksFailed,
      errors,
    });

    return { tasksGenerated, tasksFailed, errors };
  } catch (err) {
    await logAgentRun(supabase, {
      runDate: generationDate,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "failed",
      tasksGenerated,
      tasksFailed,
      errors: [...errors, err.message],
    });
    throw err;
  }
}

let generationRunning = false;

async function runScheduledGeneration(trigger) {
  if (generationRunning) {
    log(`Skipping ${trigger} — already in progress`);
    return;
  }

  generationRunning = true;
  try {
    await runReadingGeneration();
  } catch (err) {
    console.error("[ReadingAgent] Fatal error:", err.message);
  } finally {
    generationRunning = false;
  }
}

if (require.main === module) {
  cron.schedule(CRON_SCHEDULE, () => {
    log("Cron triggered — 4:00 AM daily run");
    runScheduledGeneration("cron").catch((err) => {
      console.error("[ReadingAgent] Cron failed:", err.message);
    });
  });

  runScheduledGeneration("manual")
    .then(() => {
      if (process.env.READING_AGENT_EXIT === "1") {
        process.exit(0);
      }
      log("Process alive — waiting for next cron run (4:00 AM)");
    })
    .catch((err) => {
      console.error("[ReadingAgent] Startup failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runReadingGeneration,
  CEFR_LEVELS,
  getPassageWordRange,
  getTodayDateKey,
  getBandForLevel,
  normalizeQuestions,
  md5,
};
