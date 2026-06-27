/**
 * Daily vocabulary agent — 3:00 AM
 * Generates 10 word cards × 10 CEFR levels → daily_ai_tasks (draft)
 * Manual: npm run agent:vocabulary
 */

const path = require("path");
const crypto = require("crypto");
const cron = require("node-cron");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MODEL = "gpt-4o";
const TEMPERATURE = 0.75;
const CRON_SCHEDULE = "0 3 * * *";
const WORDS_PER_LEVEL = 10;
const AGENT_NAME = "vocabulary_agent";

const {
  SPEAKIFY_CEFR_LEVELS: CEFR_LEVELS,
  VOCAB_LEVEL_BANKS,
  normalizeSpeakifyCefrLevel,
} = require("../lib/vocabularyLevels");

const TOPICS = [
  "education",
  "technology",
  "health",
  "environment",
  "work",
  "travel",
  "culture",
  "Vision2030",
  "urbanization",
  "communication",
];

/** Target correct_index per word slot — avoids all answers being option A */
const QUIZ_INDEX_TARGETS = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];

const SYSTEM_MESSAGE = `You are an expert IELTS vocabulary curriculum designer for Saudi Arabian learners.
Create CEFR-appropriate vocabulary with accurate Modern Standard Arabic translations.
Content must be culturally appropriate for Saudi students — no inappropriate, offensive, or politically sensitive material.
Return ONLY valid JSON. No markdown. No commentary.`;

function log(...args) {
  console.log("[VocabularyAgent]", ...args);
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
    "C2.1": "8.0-8.5",
    "C2.2": "8.5-9.0",
  };
  return map[level] ?? "5.0-5.5";
}

function getDifficultyForLevel(level) {
  const band = level.charAt(0);
  if (band === "A") return level.endsWith(".1") ? "beginner" : "elementary";
  if (band === "B") return level.endsWith(".1") ? "intermediate" : "upper_intermediate";
  if (band === "C") return level.endsWith(".1") ? "advanced" : "mastery";
  return "advanced";
}

function pickTopic(level, index) {
  const bank = VOCAB_LEVEL_BANKS[level];
  if (bank) {
    const themes = bank.split(",").map((t) => t.trim());
    return themes[index % themes.length];
  }
  const levelNum = CEFR_LEVELS.indexOf(level);
  return TOPICS[(levelNum + index) % TOPICS.length];
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

function buildWordsUserMessage(cefrLevel, topic, excludeWords) {
  const excludeList =
    excludeWords.length > 0
      ? `\nDo NOT use these words (already generated today): ${excludeWords.join(", ")}.`
      : "";

  return `Generate exactly ${WORDS_PER_LEVEL} vocabulary word cards for CEFR level ${cefrLevel}.
Primary topic theme: ${topic}.
Level vocabulary bank focus: ${VOCAB_LEVEL_BANKS[cefrLevel] ?? topic}.
${excludeList}

Each word MUST use this exact JSON shape:
{
  "word": "string",
  "part_of_speech": "noun|verb|adjective|adverb",
  "cefr_level": "${cefrLevel}",
  "ielts_band_target": "${getBandForLevel(cefrLevel)}",
  "definition": "string",
  "definition_arabic": "string",
  "pronunciation_ipa": "string",
  "example_sentence": "string",
  "ielts_example": "string",
  "word_family": { "noun": "string", "verb": "string", "adjective": "string", "adverb": "string" },
  "collocations": ["string", "string", "string", "string"],
  "memory_hook": "string",
  "saudi_context": "string",
  "mini_quiz": {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct_index": 0,
    "explanation": "string"
  }
}

Rules:
- All ${WORDS_PER_LEVEL} headwords must be unique and appropriate for ${cefrLevel} only.
- definition_arabic is mandatory (Modern Standard Arabic).
- mini_quiz must have exactly 4 options; correct_index 0-3.
- Vary correct_index across words (not all 0).
- Saudi context must feel authentic for Saudi IELTS students.
- No culturally inappropriate content.

Return JSON: { "words": [ ...${WORDS_PER_LEVEL} items... ] }`;
}

function redistributeQuizOptions(miniQuiz, targetIndex) {
  const options = Array.isArray(miniQuiz.options)
    ? miniQuiz.options.map(String)
    : [];
  if (options.length !== 4) {
    throw new Error("mini_quiz must have exactly 4 options");
  }

  const currentIndex = Number(miniQuiz.correct_index);
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex > 3) {
    throw new Error("mini_quiz correct_index must be 0-3");
  }

  const correctAnswer = options[currentIndex];
  const distractors = options.filter((_, i) => i !== currentIndex);
  const newOptions = [...distractors];
  newOptions.splice(targetIndex, 0, correctAnswer);

  return {
    ...miniQuiz,
    options: newOptions.slice(0, 4),
    correct_index: targetIndex,
  };
}

function normalizeWordEntry(entry, cefrLevel, topic, slotIndex) {
  const collocations = Array.isArray(entry.collocations)
    ? entry.collocations.map(String).filter(Boolean).slice(0, 4)
    : [];
  while (collocations.length < 4) {
    collocations.push("");
  }

  const wordFamily =
    entry.word_family && typeof entry.word_family === "object"
      ? entry.word_family
      : {};

  let miniQuiz = entry.mini_quiz && typeof entry.mini_quiz === "object"
    ? entry.mini_quiz
    : null;

  if (!miniQuiz) {
    throw new Error(`Word "${entry.word}" missing mini_quiz`);
  }

  const targetIndex = QUIZ_INDEX_TARGETS[slotIndex % QUIZ_INDEX_TARGETS.length];
  miniQuiz = redistributeQuizOptions(miniQuiz, targetIndex);

  return {
    word: String(entry.word ?? "").trim(),
    part_of_speech: String(entry.part_of_speech ?? "noun").trim(),
    cefr_level: cefrLevel,
    ielts_band_target: String(
      entry.ielts_band_target ?? getBandForLevel(cefrLevel)
    ).trim(),
    definition: String(entry.definition ?? "").trim(),
    definition_arabic: String(
      entry.definition_arabic ?? entry.arabic_translation ?? ""
    ).trim(),
    pronunciation_ipa: String(
      entry.pronunciation_ipa ?? entry.ipa ?? ""
    ).trim(),
    example_sentence: String(entry.example_sentence ?? "").trim(),
    ielts_example: String(entry.ielts_example ?? "").trim(),
    word_family: wordFamily,
    collocations,
    memory_hook: String(entry.memory_hook ?? "").trim(),
    saudi_context: String(entry.saudi_context ?? "").trim(),
    mini_quiz: miniQuiz,
    topic,
  };
}

function validateWordData(row) {
  const required = [
    "word",
    "definition",
    "definition_arabic",
    "pronunciation_ipa",
    "example_sentence",
    "ielts_example",
    "memory_hook",
    "saudi_context",
  ];
  for (const key of required) {
    if (!String(row[key] ?? "").trim()) {
      throw new Error(`Word "${row.word || "?"}" missing ${key}`);
    }
  }
  if (!row.collocations || row.collocations.filter(Boolean).length !== 4) {
    throw new Error(`Word "${row.word}" must have 4 collocations`);
  }
  const quiz = row.mini_quiz;
  if (!quiz?.question || !Array.isArray(quiz.options) || quiz.options.length !== 4) {
    throw new Error(`Word "${row.word}" has invalid mini_quiz`);
  }
  if (!Number.isInteger(quiz.correct_index) || quiz.correct_index < 0 || quiz.correct_index > 3) {
    throw new Error(`Word "${row.word}" mini_quiz correct_index must be 0-3`);
  }
  if (!String(quiz.explanation ?? "").trim()) {
    throw new Error(`Word "${row.word}" mini_quiz missing explanation`);
  }
  if (!row.answer_key?.correct_index && row.answer_key?.correct_index !== 0) {
    throw new Error(`Word "${row.word}" missing answer_key`);
  }
}

async function getTodayTaskWords(supabase, generationDate, cefrLevel) {
  const { start, end } = getTodayBounds(generationDate);
  const { data, error } = await supabase
    .from("daily_ai_tasks")
    .select("content, content_hash, title")
    .eq("skill", "vocabulary")
    .eq("task_type", "word_card")
    .eq("cefr_level", cefrLevel)
    .gte("generated_at", start)
    .lte("generated_at", end);

  if (error) throw error;

  const words = (data ?? [])
    .map((row) => row.content?.word ?? row.title?.replace(/^Vocabulary:\s*/i, ""))
    .filter(Boolean);

  return { count: data?.length ?? 0, words, hashes: (data ?? []).map((r) => r.content_hash) };
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

async function generateWordsForLevel(openai, cefrLevel, topic, excludeWords) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_MESSAGE },
      {
        role: "user",
        content: buildWordsUserMessage(cefrLevel, topic, excludeWords),
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonFromResponse(raw);
  const list = Array.isArray(parsed.words) ? parsed.words : [];

  if (list.length < WORDS_PER_LEVEL) {
    throw new Error(
      `Level ${cefrLevel}: expected ${WORDS_PER_LEVEL} words, got ${list.length}`
    );
  }

  return list.slice(0, WORDS_PER_LEVEL).map((entry, index) =>
    normalizeWordEntry(entry, cefrLevel, topic, index)
  );
}

async function saveWordTask(supabase, wordData, generationDate) {
  const contentHash = md5(
    `${wordData.word.toLowerCase()}${wordData.cefr_level}${generationDate}`
  );

  if (await hashExists(supabase, contentHash)) {
    log(`  Skip duplicate hash: ${wordData.word} (${wordData.cefr_level})`);
    return { saved: false, reason: "duplicate_hash" };
  }

  const payload = {
    skill: "vocabulary",
    task_type: "word_card",
    cefr_level: wordData.cefr_level,
    ielts_band_target: wordData.ielts_band_target,
    difficulty: getDifficultyForLevel(wordData.cefr_level),
    topic: wordData.topic,
    title: `Vocabulary: ${wordData.word}`,
    content: wordData,
    answer_key: { correct_index: wordData.mini_quiz.correct_index },
    marking_rubric: { pass_score: 1, total: 1 },
    estimated_minutes: 5,
    status: "draft",
    content_hash: contentHash,
    tags: [
      wordData.cefr_level,
      "vocabulary",
      "word_card",
      wordData.topic,
    ],
  };

  validateWordData({ ...wordData, answer_key: payload.answer_key });

  const { error } = await supabase.from("daily_ai_tasks").insert(payload);
  if (error) {
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return { saved: false, reason: "duplicate_db" };
    }
    throw new Error(`Insert daily_ai_tasks (${wordData.word}): ${error.message}`);
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
    console.error("[VocabularyAgent] agent_logs insert failed:", error.message);
  }
}

async function runVocabularyGeneration() {
  assertEnv();

  const generationDate = getTodayDateKey();
  const startedAt = new Date().toISOString();
  const supabase = getSupabase();
  const openai = getOpenAI();

  let tasksGenerated = 0;
  let tasksFailed = 0;
  const errors = [];

  log("========================================");
  log("Speakify Vocabulary Agent — AI Practice Bank");
  log(`Date: ${generationDate}`);
  log(`Levels: ${CEFR_LEVELS.length} × ${WORDS_PER_LEVEL} words = ${CEFR_LEVELS.length * WORDS_PER_LEVEL} drafts`);
  log("========================================");

  try {
    for (const cefrLevel of CEFR_LEVELS) {
      const topic = pickTopic(cefrLevel, 0);
      const today = await getTodayTaskWords(supabase, generationDate, cefrLevel);

      if (today.count >= WORDS_PER_LEVEL) {
        log(`  Skip ${cefrLevel} — already has ${today.count} word cards today`);
        tasksGenerated += today.count;
        continue;
      }

      const needed = WORDS_PER_LEVEL - today.count;
      log(`  Generating ${needed} words for ${cefrLevel} (topic: ${topic})...`);

      try {
        const rows = await generateWordsForLevel(
          openai,
          cefrLevel,
          topic,
          today.words
        );

        for (const row of rows) {
          try {
            const result = await saveWordTask(supabase, row, generationDate);
            if (result.saved) {
              tasksGenerated += 1;
            } else {
              tasksFailed += 1;
            }
          } catch (wordErr) {
            tasksFailed += 1;
            errors.push(`${cefrLevel}/${row.word}: ${wordErr.message}`);
            log(`  ✗ ${row.word}: ${wordErr.message}`);
          }
        }

        log(`  Saved ${cefrLevel} ✓`);
        await sleep(800);
      } catch (levelErr) {
        tasksFailed += needed;
        errors.push(`${cefrLevel}: ${levelErr.message}`);
        log(`  ✗ ${cefrLevel} failed: ${levelErr.message}`);
      }
    }

    log("========================================");
    log(`Done — ${tasksGenerated} drafts saved, ${tasksFailed} skipped/failed`);
    log("All content saved as status: draft (not published)");
    log("Next run: 3:00 AM tomorrow");
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
    await runVocabularyGeneration();
  } catch (err) {
    console.error("[VocabularyAgent] Fatal error:", err.message);
  } finally {
    generationRunning = false;
  }
}

if (require.main === module) {
  cron.schedule(CRON_SCHEDULE, () => {
    log("Cron triggered — 3:00 AM daily run");
    runScheduledGeneration("cron").catch((err) => {
      console.error("[VocabularyAgent] Cron failed:", err.message);
    });
  });

  runScheduledGeneration("manual")
    .then(() => {
      if (process.env.VOCAB_AGENT_EXIT === "1") {
        process.exit(0);
      }
      log("Process alive — waiting for next cron run (3:00 AM)");
    })
    .catch((err) => {
      console.error("[VocabularyAgent] Startup failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runVocabularyGeneration,
  CEFR_LEVELS,
  getTodayDateKey,
  getBandForLevel,
  getDifficultyForLevel,
  md5,
};
