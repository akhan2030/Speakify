/**
 * Daily grammar agent — 7:00 AM
 * Generates 1 grammar lesson × 10 CEFR levels → daily_ai_tasks (draft)
 * Manual: npm run agent:grammar-bank
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
const CRON_SCHEDULE = "0 7 * * *";
const LESSONS_PER_LEVEL = 1;
const EXAMPLE_COUNT = 5;
const QUESTION_COUNT = 10;
const MAX_RETRIES = 3;
const AGENT_NAME = "grammar_agent";

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

/** Grammar focus rotated by level index */
const GRAMMAR_FOCUS = [
  { topic: "articles", rule: "Definite and indefinite articles (a/an/the)" },
  { topic: "present_simple", rule: "Present simple for habits and facts" },
  { topic: "past_simple", rule: "Past simple regular and irregular verbs" },
  { topic: "future_forms", rule: "Will vs going to for future" },
  { topic: "present_perfect", rule: "Present perfect for experience and recent past" },
  { topic: "passive_voice", rule: "Passive voice in academic contexts" },
  { topic: "conditionals", rule: "First and second conditionals" },
  { topic: "relative_clauses", rule: "Defining and non-defining relative clauses" },
  { topic: "reported_speech", rule: "Reported speech and tense backshift" },
  { topic: "complex_structures", rule: "Inversion and advanced noun phrases" },
];

const QUESTION_TYPE_TARGETS = {
  fill_in_blank: 4,
  error_correction: 3,
  sentence_rewrite: 3,
};

const SYSTEM_MESSAGE = `You are an expert IELTS grammar curriculum designer for Saudi Arabian learners.
Create CEFR-appropriate grammar lessons with accurate Arabic L1 interference notes.
Every practice question MUST include correct_answer and explanation.
Return ONLY valid JSON. No markdown. No commentary.`;

function log(...args) {
  console.log("[GrammarAgent]", ...args);
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

function pickGrammarFocus(cefrLevel) {
  const idx = CEFR_LEVELS.indexOf(cefrLevel);
  return GRAMMAR_FOCUS[idx >= 0 ? idx : 0];
}

function getEstimatedMinutes(level) {
  if (level.startsWith("A")) return 15;
  if (level.startsWith("B")) return 20;
  return 25;
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
  if (t.includes("fill") || t.includes("blank")) return "fill_in_blank";
  if (t.includes("error") || t.includes("correct")) return "error_correction";
  if (t.includes("rewrite") || t.includes("transform")) return "sentence_rewrite";
  return t;
}

function normalizeExamples(examples) {
  const list = Array.isArray(examples) ? examples : [];
  return list.map((ex, i) => ({
    id: ex.id ?? i + 1,
    sentence: String(ex.sentence ?? ex.example ?? "").trim(),
    explanation: String(ex.explanation ?? ex.note ?? "").trim(),
  }));
}

function normalizeQuestions(questions) {
  return questions.map((q, index) => {
    const type = normalizeQuestionType(q.type);
    const normalized = {
      id: q.id ?? index + 1,
      type,
      question: String(q.question ?? q.prompt ?? q.stem ?? "").trim(),
      correct_answer: String(q.correct_answer ?? q.answer ?? q.correct ?? "").trim(),
      explanation: String(q.explanation ?? "").trim(),
    };

    if (!normalized.question || !normalized.correct_answer || !normalized.explanation) {
      throw new Error(
        `Question ${index + 1} missing question, correct_answer, or explanation`
      );
    }

    if (type === "sentence_rewrite" && q.original_sentence) {
      normalized.original_sentence = String(q.original_sentence).trim();
    }

    return normalized;
  });
}

function validateQuestionMix(questions) {
  const counts = { fill_in_blank: 0, error_correction: 0, sentence_rewrite: 0 };
  for (const q of questions) {
    if (counts[q.type] !== undefined) counts[q.type] += 1;
  }

  for (const [type, min] of Object.entries(QUESTION_TYPE_TARGETS)) {
    if (counts[type] < min) {
      throw new Error(
        `Need at least ${min} ${type} questions, got ${counts[type]}`
      );
    }
  }
}

function buildAnswerKey(questions) {
  return {
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      correct_answer: q.correct_answer,
    })),
  };
}

function buildMarkingRubric() {
  return {
    pass_score: Math.ceil(QUESTION_COUNT * 0.7),
    total: QUESTION_COUNT,
    criteria: [
      "Accuracy of target grammar structure",
      "Appropriate form for context",
      "Spelling and word formation",
    ],
  };
}

function buildUserMessage(cefrLevel, focus, retryNote) {
  const retry = retryNote ? `\nIMPORTANT FIX: ${retryNote}\n` : "";

  return `Create ONE complete grammar lesson package for CEFR level ${cefrLevel}.
${retry}
Grammar focus: ${focus.rule}
Topic tag: ${focus.topic}
IELTS band target: ${getBandForLevel(cefrLevel)}

Include ALL of the following:

1. LESSON — rule explanation, exactly ${EXAMPLE_COUNT} worked examples, common Saudi learner mistakes (4-6 items), Arabic L1 interference notes (3-5 items with Arabic comparison where helpful)

2. PRACTICE — exactly ${QUESTION_COUNT} questions with this mix:
   - at least ${QUESTION_TYPE_TARGETS.fill_in_blank} fill_in_blank
   - at least ${QUESTION_TYPE_TARGETS.error_correction} error_correction
   - at least ${QUESTION_TYPE_TARGETS.sentence_rewrite} sentence_rewrite
   Every question needs correct_answer AND explanation.

3. IELTS EXAMPLE — one authentic-style sentence from academic writing OR speaking that demonstrates this grammar point, with brief analysis.

Return JSON:
{
  "title": "short lesson title",
  "grammar_topic": "${focus.topic}",
  "grammar_rule": "${focus.rule}",
  "cefr_level": "${cefrLevel}",
  "lesson": {
    "rule_explanation": "clear explanation for ${cefrLevel} learners",
    "examples": [
      { "id": 1, "sentence": "string", "explanation": "why this form is used" }
    ],
    "saudi_learner_mistakes": [
      { "mistake": "incorrect example", "correction": "correct form", "reason": "why Saudis make this error" }
    ],
    "arabic_l1_interference": [
      { "english_pattern": "string", "arabic_note": "MSA comparison", "tip": "how to avoid the error" }
    ]
  },
  "practice_questions": [
    {
      "id": 1,
      "type": "fill_in_blank" | "error_correction" | "sentence_rewrite",
      "question": "string",
      "original_sentence": "only for sentence_rewrite — sentence to transform",
      "correct_answer": "string",
      "explanation": "string"
    }
  ],
  "ielts_example": {
    "skill": "writing" | "speaking",
    "context": "Task 1 report / Task 2 essay / Speaking Part 3 etc.",
    "sentence": "example sentence using the grammar structure",
    "analysis": "how the structure supports IELTS band score"
  }
}

Rules:
- Language complexity must match ${cefrLevel} only.
- Culturally appropriate for Saudi IELTS learners.
- Arabic notes should use Modern Standard Arabic where Arabic is shown.
- Original content only — do not copy from textbooks.`;
}

function validateLesson(content) {
  const lesson = content.lesson ?? {};
  if (!String(lesson.rule_explanation ?? "").trim()) {
    throw new Error("Missing lesson.rule_explanation");
  }

  const examples = normalizeExamples(lesson.examples);
  if (examples.length < EXAMPLE_COUNT) {
    throw new Error(`Expected ${EXAMPLE_COUNT} examples, got ${examples.length}`);
  }
  for (const ex of examples) {
    if (!ex.sentence || !ex.explanation) {
      throw new Error("Each example needs sentence and explanation");
    }
  }
  lesson.examples = examples.slice(0, EXAMPLE_COUNT);

  const mistakes = Array.isArray(lesson.saudi_learner_mistakes)
    ? lesson.saudi_learner_mistakes
    : [];
  if (mistakes.length < 3) {
    throw new Error("saudi_learner_mistakes must have at least 3 items");
  }

  const l1 = Array.isArray(lesson.arabic_l1_interference)
    ? lesson.arabic_l1_interference
    : [];
  if (l1.length < 2) {
    throw new Error("arabic_l1_interference must have at least 2 items");
  }

  content.lesson = lesson;

  const questions = normalizeQuestions(
    Array.isArray(content.practice_questions) ? content.practice_questions : []
  );
  if (questions.length !== QUESTION_COUNT) {
    throw new Error(
      `Expected ${QUESTION_COUNT} practice questions, got ${questions.length}`
    );
  }
  validateQuestionMix(questions);
  content.practice_questions = questions;

  const ielts = content.ielts_example ?? {};
  if (!String(ielts.sentence ?? "").trim() || !String(ielts.analysis ?? "").trim()) {
    throw new Error("ielts_example missing sentence or analysis");
  }
  if (!["writing", "speaking"].includes(String(ielts.skill ?? "").toLowerCase())) {
    throw new Error("ielts_example.skill must be writing or speaking");
  }
}

async function getTodayLessonCount(supabase, generationDate, cefrLevel) {
  const { start, end } = getTodayBounds(generationDate);
  const { count, error } = await supabase
    .from("daily_ai_tasks")
    .select("id", { count: "exact", head: true })
    .eq("skill", "grammar")
    .eq("task_type", "grammar_lesson")
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

async function generateLessonForLevel(openai, cefrLevel, focus) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const retryNote = lastError ? lastError.message : null;
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: 10000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          {
            role: "user",
            content: buildUserMessage(cefrLevel, focus, retryNote),
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      const parsed = parseJsonFromResponse(raw);

      const content = {
        title: String(parsed.title ?? focus.rule).trim(),
        grammar_topic: String(parsed.grammar_topic ?? focus.topic).trim(),
        grammar_rule: String(parsed.grammar_rule ?? focus.rule).trim(),
        cefr_level: cefrLevel,
        ielts_band_target: getBandForLevel(cefrLevel),
        lesson: parsed.lesson ?? {},
        practice_questions: parsed.practice_questions ?? [],
        ielts_example: parsed.ielts_example ?? {},
      };

      validateLesson(content);
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

async function saveGrammarTask(supabase, content, generationDate) {
  const contentHash = md5(
    `${content.grammar_topic.toLowerCase()}${content.cefr_level}${generationDate}`
  );

  if (await hashExists(supabase, contentHash)) {
    log(`  Skip duplicate: ${content.title} (${content.cefr_level})`);
    return { saved: false, reason: "duplicate_hash" };
  }

  const answerKey = buildAnswerKey(content.practice_questions);
  const markingRubric = buildMarkingRubric();

  const payload = {
    skill: "grammar",
    task_type: "grammar_lesson",
    cefr_level: content.cefr_level,
    ielts_band_target: content.ielts_band_target,
    difficulty: getDifficultyForLevel(content.cefr_level),
    topic: content.grammar_topic,
    title: `Grammar: ${content.title}`,
    content,
    answer_key: answerKey,
    marking_rubric: markingRubric,
    estimated_minutes: getEstimatedMinutes(content.cefr_level),
    ...dailyTaskPublishFields(),
    content_hash: contentHash,
    tags: [
      content.cefr_level,
      "grammar",
      "grammar_lesson",
      content.grammar_topic,
    ],
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
    console.error("[GrammarAgent] agent_logs insert failed:", error.message);
  }
}

async function runGrammarGeneration() {
  assertEnv();

  const generationDate = getTodayDateKey();
  const startedAt = new Date().toISOString();
  const supabase = getSupabase();
  const openai = getOpenAI();

  let tasksGenerated = 0;
  let tasksFailed = 0;
  const errors = [];

  log("========================================");
  log("Speakify Grammar Agent — AI Practice Bank");
  log(`Date: ${generationDate}`);
  log(`Target: ${CEFR_LEVELS.length} lessons (1 per CEFR level)`);
  log("========================================");

  try {
    for (const cefrLevel of CEFR_LEVELS) {
      const existing = await getTodayLessonCount(
        supabase,
        generationDate,
        cefrLevel
      );

      if (existing >= LESSONS_PER_LEVEL) {
        log(`  Skip ${cefrLevel} — lesson already generated today`);
        tasksGenerated += LESSONS_PER_LEVEL;
        continue;
      }

      const focus = pickGrammarFocus(cefrLevel);
      log(`  Generating lesson for ${cefrLevel} (${focus.rule})...`);

      try {
        const content = await generateLessonForLevel(openai, cefrLevel, focus);
        const result = await saveGrammarTask(supabase, content, generationDate);

        if (result.saved) {
          tasksGenerated += 1;
          log(
            `  Saved ${cefrLevel} ✓ — "${content.title}" (${content.practice_questions.length} questions)`
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
    log("Next run: 7:00 AM tomorrow");
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
    await runGrammarGeneration();
  } catch (err) {
    console.error("[GrammarAgent] Fatal error:", err.message);
  } finally {
    generationRunning = false;
  }
}

if (require.main === module) {
  cron.schedule(CRON_SCHEDULE, () => {
    log("Cron triggered — 7:00 AM daily run");
    runScheduledGeneration("cron").catch((err) => {
      console.error("[GrammarAgent] Cron failed:", err.message);
    });
  });

  runScheduledGeneration("manual")
    .then(() => {
      if (process.env.GRAMMAR_AGENT_EXIT === "1") {
        process.exit(0);
      }
      log("Process alive — waiting for next cron run (7:00 AM)");
    })
    .catch((err) => {
      console.error("[GrammarAgent] Startup failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runGrammarGeneration,
  CEFR_LEVELS,
  GRAMMAR_FOCUS,
  pickGrammarFocus,
  getTodayDateKey,
  getBandForLevel,
  normalizeQuestions,
  validateQuestionMix,
  md5,
};
