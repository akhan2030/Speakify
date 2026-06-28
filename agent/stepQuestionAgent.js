/**
 * STEP question agent — generates section-aligned MCQ practice sets → step_practice_bank.
 * Manual: npm run agent:step-questions
 * Cron: daily at 05:30 UTC (after reading/listening IELTS agents)
 */

const path = require("path");
const crypto = require("crypto");
const cron = require("node-cron");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MODEL = "gpt-4o";
const TEMPERATURE = 0.65;
const CRON_SCHEDULE = "30 5 * * *";
const MAX_RETRIES = 3;
const AGENT_NAME = "step_question_agent";

/** One section per daily run, rotated */
const SECTION_ROTATION = [
  "reading",
  "structure",
  "listening",
  "compositional_analysis",
];

const SECTION_COUNTS = {
  reading: { passages: 1, questions: 8 },
  structure: { items: 10 },
  listening: { recordings: 1, questions: 6 },
  compositional_analysis: { items: 6 },
};

const SYSTEM_MESSAGE = `You are an expert STEP (Saudi Standardized Test of English Proficiency) item writer.
STEP is administered by Qiyas (ETEC). Format: 100 four-option MCQs, score 0–100.
Sections: Reading 40%, Structure 30%, Listening 20%, Compositional Analysis 10%.
No speaking. No essay writing.

Every question MUST have: stem, options {A,B,C,D}, correct (A|B|C|D), explanation.
Reading: numbered paragraphs, questions follow paragraph order, include word_meaning items.
Listening: include full transcript and recordingNumber; questions test details/numbers/idioms.
Structure: one grammar point per item; plausible distractors.
Compositional Analysis: punctuation, word order, sentence combining, underline-error types.

Use Saudi/Gulf contexts where natural. Return ONLY valid JSON. No markdown.`;

function log(...args) {
  console.log(`[${AGENT_NAME}]`, ...args);
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

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTodaySection() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return SECTION_ROTATION[dayIndex % SECTION_ROTATION.length];
}

function buildUserPrompt(section) {
  const counts = SECTION_COUNTS[section];

  if (section === "reading") {
    return `Generate STEP Reading Comprehension practice.
Return JSON: { "passages": [{ "id": "p1", "paragraphs": [{"number":1,"text":"..."}], "boldTerms": [], "questions": [...] }] }
Create ${counts.passages} passage(s) with ${counts.questions} total questions.
Include word_meaning_in_context, general_understanding, and main_idea_or_title types.`;
  }

  if (section === "structure") {
    return `Generate STEP Structure (grammar) practice.
Return JSON: { "items": [{ "id": "s1", "section": "structure", "questionType": "...", "stem": "...", "options": {"A":"","B":"","C":"","D":""}, "correct": "A", "explanation": "...", "grammarPoint": "..." }] }
Create ${counts.items} items covering tenses, articles, prepositions, subject-verb agreement, modals.`;
  }

  if (section === "listening") {
    return `Generate STEP Listening Comprehension practice.
Return JSON: { "recordings": [{ "id": "r1", "recordingNumber": 1, "transcript": "...", "speakers": [], "setting": "...", "questions": [...] }] }
Create ${counts.recordings} dialogue(s) with ${counts.questions} total questions.
Include numbers, idioms, and inference items.`;
  }

  return `Generate STEP Compositional Analysis practice.
Return JSON: { "items": [{ "id": "c1", "section": "compositional_analysis", "questionType": "...", "stem": "...", "options": {"A":"","B":"","C":"","D":""}, "correct": "A", "explanation": "..." }] }
Create ${counts.items} items: punctuation, word order, sentence combining, identify_incorrect_underlined.`;
}

async function generateSectionContent(openai, section) {
  const userPrompt = buildUserPrompt(section);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty model response");

      const parsed = JSON.parse(raw);
      return parsed;
    } catch (err) {
      log(`Attempt ${attempt}/${MAX_RETRIES} failed for ${section}:`, err.message);
      if (attempt === MAX_RETRIES) throw err;
    }
  }
}

function countQuestions(section, content) {
  if (section === "reading") {
    return (content.passages || []).reduce(
      (sum, p) => sum + (p.questions?.length || 0),
      0
    );
  }
  if (section === "listening") {
    return (content.recordings || []).reduce(
      (sum, r) => sum + (r.questions?.length || 0),
      0
    );
  }
  return (content.items || []).length;
}

async function storePracticeSet(supabase, section, content, dateKey) {
  const questionCount = countQuestions(section, content);
  const contentHash = md5(JSON.stringify(content));

  const { data: existing } = await supabase
    .from("step_practice_bank")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing) {
    log(`Duplicate content hash — skipping insert for ${section}`);
    return { section, inserted: false, questionCount };
  }

  const row = {
    section,
    title: `STEP ${section} — ${dateKey}`,
    generation_date: dateKey,
    question_count: questionCount,
    content,
    content_hash: contentHash,
    agent: AGENT_NAME,
    status: "draft",
  };

  const { error } = await supabase.from("step_practice_bank").insert(row);

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return { section, inserted: true, questionCount };
}

async function runStepQuestionGeneration(options = {}) {
  const section = options.section || getTodaySection();
  const dateKey = options.dateKey || getTodayDateKey();

  log("========================================");
  log(`STEP question agent — section: ${section}, date: ${dateKey}`);
  log("========================================");

  assertEnv();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY);

  const content = await generateSectionContent(openai, section);
  const result = await storePracticeSet(supabase, section, content, dateKey);

  log(`Stored ${result.questionCount} questions for ${section} (inserted: ${result.inserted})`);
  log("========================================");

  return { section, dateKey, ...result, content };
}

cron.schedule(CRON_SCHEDULE, () => {
  log("Cron triggered — generating STEP practice questions...");
  runStepQuestionGeneration().catch((err) => {
    log("Cron run failed:", err.message);
  });
});

if (require.main === module) {
  const sectionArg = process.argv.find((a) => a.startsWith("--section="));
  const section = sectionArg ? sectionArg.split("=")[1] : undefined;

  runStepQuestionGeneration({ section })
    .then(() => {
      log("Done. Process stays alive for cron. Ctrl+C to exit.");
    })
    .catch((err) => {
      log("Fatal error:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runStepQuestionGeneration,
  SECTION_ROTATION,
  SECTION_COUNTS,
  buildUserPrompt,
};
