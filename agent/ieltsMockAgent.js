/**
 * Daily IELTS Academic Full Mock Agent — 6:00 AM
 * Generates exactly one complete 4-section mock exam per day.
 * Manual: npm run agent:mock
 */

const path = require("path");
const crypto = require("crypto");
const cron = require("node-cron");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const AGENT_NAME = "ieltsMockAgent";
const MODEL = "gpt-4o";
const TEMPERATURE = 0.72;
const MAX_TOKENS = 16000;
const CRON_SCHEDULE = "0 6 * * *";
const RETRY_DELAY_MS = 10 * 60 * 1000;

const TOPIC_CATEGORIES = [
  "Environment & Climate",
  "Technology & Innovation",
  "Health & Medicine",
  "Education & Learning",
  "Society & Culture",
  "Business & Economy",
  "Science & Research",
  "Urban Development",
  "Travel & Tourism",
  "Media & Communication",
  "Psychology & Behaviour",
  "History & Heritage",
  "Food & Agriculture",
  "Sports & Wellbeing",
  "Architecture & Design",
  "Language & Identity",
  "Energy & Sustainability",
  "Law & Justice",
  "Family & Community",
  "Art & Creativity",
];

const SYSTEM_MESSAGE =
  "You are an expert Cambridge IELTS Academic test creator for Saudi Arabian learners. " +
  "Content must be culturally appropriate — no offensive, politically sensitive, or inappropriate material. " +
  "Return ONLY valid JSON — no markdown, no code fences, no commentary.";

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
  if (missing.length) {
    throw new Error(`Missing env in .env.local: ${missing.join(", ")}`);
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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJsonFromResponse(raw) {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1].trim() : text);
}

function wordCount(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function answerInSource(answer, source) {
  const a = normalizeText(answer);
  const s = normalizeText(source);
  if (!a || !s) return false;
  if (s.includes(a)) return true;
  const tokens = a.split(" ").filter((t) => t.length > 2);
  if (!tokens.length) return false;
  return tokens.every((t) => s.includes(t));
}

function mcqLetterDistribution(questions) {
  const letters = [];
  for (const q of questions) {
    if (q.type !== "multiple_choice" && q.type !== "mcq") continue;
    const opts = q.options ?? [];
    if (opts.length !== 4) return { ok: false, reason: `MCQ missing 4 options (Q${q.number})` };
    const ans = String(q.answer ?? "").trim();
    const idx = opts.findIndex(
      (o) => normalizeText(o) === normalizeText(ans) || String(o).startsWith(ans)
    );
    if (idx < 0) return { ok: false, reason: `MCQ answer not in options (Q${q.number})` };
    letters.push(["A", "B", "C", "D"][idx]);
  }
  if (letters.length < 4) return { ok: true };
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  for (const l of letters) counts[l] += 1;
  const max = Math.max(...Object.values(counts));
  if (max > Math.ceil(letters.length * 0.6)) {
    return { ok: false, reason: "MCQ correct answers too clustered on one letter" };
  }
  return { ok: true };
}

function collectListeningQuestions(listening) {
  const out = [];
  for (const part of listening?.parts ?? []) {
    for (const q of part.questions ?? []) out.push({ ...q, part });
  }
  return out;
}

function collectReadingQuestions(reading) {
  const out = [];
  for (const passage of reading?.passages ?? []) {
    for (const q of passage.questions ?? []) out.push({ ...q, passage });
  }
  return out;
}

function validateContent(payload) {
  const errors = [];
  const { listening, reading, writing, speaking } = payload;

  const lQuestions = collectListeningQuestions(listening);
  if (lQuestions.length < 30) errors.push(`Listening has ${lQuestions.length} questions (need ~40)`);

  for (const q of lQuestions) {
    const part = q.part ?? {};
    const source = part.transcript ?? part.audio_script ?? "";
    if (q.type === "form_completion" || q.type === "note_completion" || q.type === "sentence_completion") {
      if (!answerInSource(q.answer, source)) {
        errors.push(`Listening Q${q.number}: answer "${q.answer}" not in transcript`);
      }
    }
  }

  const lMcq = mcqLetterDistribution(lQuestions);
  if (!lMcq.ok) errors.push(`Listening: ${lMcq.reason}`);

  const passages = reading?.passages ?? [];
  if (passages.length < 3) errors.push("Reading needs 3 passages");

  const minWords = [800, 900, 1000];
  passages.forEach((p, i) => {
    const wc = wordCount(p.text);
    if (wc < (minWords[i] ?? 800) - 100) {
      errors.push(`Reading passage ${p.number ?? i + 1}: ${wc} words (min ~${minWords[i]})`);
    }
  });

  const rQuestions = collectReadingQuestions(reading);
  for (const q of rQuestions) {
    const src = q.passage?.text ?? "";
    const ans = String(q.answer ?? "").toUpperCase();
    if (["TRUE", "FALSE", "NOT GIVEN", "YES", "NO"].includes(ans)) continue;
    if (q.type === "multiple_choice" || q.type === "mcq") continue;
    if (q.answer && !answerInSource(q.answer, src)) {
      errors.push(`Reading Q${q.number}: answer not found in passage`);
    }
  }

  const rMcq = mcqLetterDistribution(rQuestions);
  if (!rMcq.ok) errors.push(`Reading: ${rMcq.reason}`);

  if (!writing?.task1?.prompt) errors.push("Writing task1 missing prompt");
  if (!writing?.task2?.prompt) errors.push("Writing task2 missing prompt");
  if (wordCount(writing?.task1?.model_answer_band6) < 120) {
    errors.push("Writing task1 band6 model answer too short");
  }
  if (wordCount(writing?.task2?.model_answer_band6) < 200) {
    errors.push("Writing task2 band6 model answer too short");
  }

  if (!(speaking?.part1?.questions?.length >= 4)) errors.push("Speaking part1 needs 5 questions");
  if (!(speaking?.part2?.cue_card)) errors.push("Speaking part2 missing cue card");
  if (!(speaking?.part3?.questions?.length >= 3)) errors.push("Speaking part3 needs 4 questions");

  for (const part of listening?.parts ?? []) {
    for (const key of ["speaker1", "speaker2"]) {
      const sp = part[key];
      if (!sp?.name || !sp?.voice) continue;
      const voice = String(sp.voice).toLowerCase();
      const name = String(sp.name);
      const maleVoices = new Set(["onyx", "echo", "fable", "ash"]);
      const femaleVoices = new Set(["nova", "shimmer", "alloy", "coral"]);
      if (maleVoices.has(voice) && /\b(emma|sarah|anna|emily|sophie|fatima|noura|layla)\b/i.test(name)) {
        errors.push(`Listening ${key}: male voice with female name ${name}`);
      }
      if (femaleVoices.has(voice) && /\b(james|john|david|michael|thomas|daniel|ahmed|omar|khalid)\b/i.test(name)) {
        errors.push(`Listening ${key}: female voice with male name ${name}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

async function fetchRecentTopics(supabase) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("generated_mock_tests")
    .select("topic")
    .eq("test_type", "full_mock")
    .gte("created_at", thirtyDaysAgo);

  if (error) {
    log("Recent topics lookup failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.topic).filter(Boolean);
}

function pickTopicCategory(recentTopics) {
  const recent = new Set(recentTopics.map((t) => String(t).toLowerCase()));
  const available = TOPIC_CATEGORIES.filter((c) => !recent.has(c.toLowerCase()));
  const pool = available.length ? available : TOPIC_CATEGORIES;
  const dayIndex = Math.floor(Date.now() / 86400000) % pool.length;
  return pool[dayIndex];
}

async function getNextMockNumber(supabase) {
  const { data, error } = await supabase
    .from("generated_mock_tests")
    .select("mock_number")
    .eq("test_type", "full_mock")
    .order("mock_number", { ascending: false })
    .limit(1);

  if (error) throw new Error(`mock_number lookup failed: ${error.message}`);
  const max = data?.[0]?.mock_number ?? 0;
  return max + 1;
}

async function alreadyGeneratedToday(supabase, dateKey) {
  const { data, error } = await supabase
    .from("generated_mock_tests")
    .select("id, mock_number, status")
    .eq("test_type", "full_mock")
    .eq("generation_date", dateKey)
    .eq("generated_by", AGENT_NAME)
    .maybeSingle();

  if (error) return null;
  return data;
}

function buildPrompt(topic, mockNumber, avoidTopics) {
  const avoidList = avoidTopics.length
    ? `\nDo NOT reuse these topics from the last 30 days: ${avoidTopics.join(", ")}`
    : "";

  return `Generate ONE complete IELTS Academic FULL MOCK EXAM #${String(mockNumber).padStart(2, "0")}.
Primary theme category: ${topic}${avoidList}

Return a single JSON object with keys: listening, reading, writing, speaking.

LISTENING — exactly 40 questions across 4 parts:
{
  "section": "listening",
  "parts": [
    {
      "part": 1,
      "type": "form_completion",
      "topic": "social conversation topic",
      "transcript": "300-400 word realistic conversation between 2 speakers",
      "speaker1": { "name": "James Harrison", "voice": "onyx", "gender": "male" },
      "speaker2": { "name": "Emma Clarke", "voice": "nova", "gender": "female" },
      "questions": [{ "number": 1, "type": "form_completion", "question": "Name: ___", "answer": "exact word", "options": null }]
    },
    { "part": 2, "type": "multiple_choice", "speaker": "monologue", "questions": [] },
    { "part": 3, "type": "matching", "speakers": 3, "questions": [] },
    { "part": 4, "type": "note_completion", "continuous": true, "questions": [] }
  ]
}

READING — 3 passages, 40 questions total:
{
  "section": "reading",
  "passages": [
    { "number": 1, "title": "...", "text": "800-900 words Band 5-6", "topic": "...", "questions": [{ "number": 1, "type": "true_false_not_given", "question": "...", "answer": "TRUE", "explanation": "..." }] },
    { "number": 2, "text": "900-1000 words Band 6-7", "questions": [] },
    { "number": 3, "text": "1000-1100 words Band 7-8", "questions": [] }
  ]
}

WRITING:
{
  "section": "writing",
  "task1": { "type": "bar_chart", "prompt": "...", "data": {}, "word_limit": 150, "time_minutes": 20, "model_answer_band6": "...", "model_answer_band7": "...", "marking_rubric": { "TA": "...", "CC": "...", "LR": "...", "GRA": "..." } },
  "task2": { "type": "discussion", "prompt": "...", "word_limit": 250, "time_minutes": 40, "model_answer_band6": "...", "model_answer_band7": "...", "marking_rubric": { "TR": "...", "CC": "...", "LR": "...", "GRA": "..." } }
}

SPEAKING:
{
  "section": "speaking",
  "part1": { "topic": "...", "questions": ["5 personal questions"], "model_answers": { "band6": [], "band7": [] } },
  "part2": { "cue_card": "...", "bullet_points": ["4 points"], "prep_seconds": 60, "talk_seconds": 120, "model_answer_band6": "...", "model_answer_band7": "..." },
  "part3": { "questions": ["4 discussion questions"], "model_answers": { "band6": [], "band7": [] } }
}

Rules:
- All completion answers must appear word-for-word in the transcript or passage.
- Multiple choice: exactly 4 options each; spread correct answers across A/B/C/D.
- Culturally appropriate for Saudi students.
- Male TTS voices (onyx, echo) must use male names; female voices (nova, shimmer) must use female names.`;
}

async function callOpenAI(openai, prompt) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_MESSAGE },
      { role: "user", content: prompt },
    ],
  });
  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty OpenAI response");
  return parseJsonFromResponse(raw);
}

async function logAgentRun(supabase, entry) {
  const { error } = await supabase.from("agent_logs").insert({
    agent_name: AGENT_NAME,
    run_date: entry.runDate,
    started_at: entry.startedAt,
    completed_at: entry.completedAt,
    status: entry.status,
    tasks_generated: entry.tasksGenerated ?? 0,
    tasks_failed: entry.tasksFailed ?? 0,
    errors: entry.errors?.length ? entry.errors : null,
    notes: entry.notes ?? null,
  });
  if (error) log("agent_logs insert failed:", error.message);
}

async function generateOneMock({ supabase, openai, dateKey, isRetry = false }) {
  const startedAt = new Date().toISOString();

  const existing = await alreadyGeneratedToday(supabase, dateKey);
  if (existing) {
    log(`Mock already exists for ${dateKey} (#${String(existing.mock_number).padStart(2, "0")})`);
    return { tasksGenerated: 0, tasksFailed: 0, skipped: true, mockNumber: existing.mock_number };
  }

  const recentTopics = await fetchRecentTopics(supabase);
  const selectedTopic = pickTopicCategory(recentTopics);
  const nextMockNumber = await getNextMockNumber(supabase);

  log(`Generating Mock Exam #${String(nextMockNumber).padStart(2, "0")} — ${selectedTopic}`);

  const prompt = buildPrompt(selectedTopic, nextMockNumber, recentTopics);
  const content = await callOpenAI(openai, prompt);

  const listening = content.listening ?? content;
  const reading = content.reading ?? {};
  const writing = content.writing ?? {};
  const speaking = content.speaking ?? {};

  const validation = validateContent({ listening, reading, writing, speaking });
  if (!validation.ok) {
    throw new Error(`Validation failed: ${validation.errors.slice(0, 5).join("; ")}`);
  }

  const contentHash = md5(`${selectedTopic}${dateKey}`);
  const totalQuestions =
    collectListeningQuestions(listening).length + collectReadingQuestions(reading).length;

  const row = {
    test_type: "full_mock",
    test_number: nextMockNumber,
    topic: selectedTopic,
    listening,
    reading,
    writing,
    speaking,
    status: "published",
    mock_number: nextMockNumber,
    generated_by: AGENT_NAME,
    generation_date: dateKey,
    content_hash: contentHash,
    total_questions: totalQuestions,
    is_available: true,
    topics: [selectedTopic],
    passage_1: reading.passages?.[0] ?? {},
    passage_2: reading.passages?.[1] ?? {},
    passage_3: reading.passages?.[2] ?? {},
  };

  const { data: dup } = await supabase
    .from("generated_mock_tests")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (dup) {
    log("Duplicate content_hash — skipping insert");
    return { tasksGenerated: 0, tasksFailed: 0, skipped: true };
  }

  const { error } = await supabase.from("generated_mock_tests").insert(row);
  if (error) throw new Error(`Insert failed: ${error.message}`);

  const completedAt = new Date().toISOString();
  log(`Saved Mock Exam #${String(nextMockNumber).padStart(2, "0")} (${selectedTopic})`);

  await logAgentRun(supabase, {
    runDate: dateKey,
    startedAt,
    completedAt,
    status: "success",
    tasksGenerated: 1,
    tasksFailed: 0,
    notes: `mock_number=${nextMockNumber}, topic=${selectedTopic}${isRetry ? ", retry=1" : ""}`,
  });

  return { tasksGenerated: 1, tasksFailed: 0, mockNumber: nextMockNumber, topic: selectedTopic };
}

async function runIeltsMockGeneration(trigger = "manual") {
  assertEnv();
  const dateKey = getTodayDateKey();
  const startedAt = new Date().toISOString();
  const supabase = getSupabase();
  const openai = getOpenAI();

  log("========================================");
  log(`IELTS Full Mock Agent — ${trigger}`);
  log(`Date: ${dateKey}`);
  log("========================================");

  try {
    const result = await generateOneMock({ supabase, openai, dateKey });
    log("Done.", result);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`Generation failed: ${message}`);

    await logAgentRun(supabase, {
      runDate: dateKey,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "failed",
      tasksGenerated: 0,
      tasksFailed: 1,
      errors: [message],
      notes: `trigger=${trigger}, will retry in 10 min`,
    });

    if (trigger !== "retry") {
      log("Scheduling retry in 10 minutes…");
      setTimeout(() => {
        runIeltsMockGeneration("retry").catch((e) => {
          log("Retry failed:", e.message);
        });
      }, RETRY_DELAY_MS);
    }

    return { tasksGenerated: 0, tasksFailed: 1, errors: [message] };
  }
}

let running = false;

async function runScheduled(trigger) {
  if (running) {
    log(`Skipping ${trigger} — already running`);
    return { tasksGenerated: 0, tasksFailed: 0 };
  }
  running = true;
  try {
    const result = await runIeltsMockGeneration(trigger);
    return result ?? { tasksGenerated: 0, tasksFailed: 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ieltsMockAgent] Generation failed:", message);
    return { tasksGenerated: 0, tasksFailed: 1, errors: [message] };
  } finally {
    running = false;
  }
}

if (require.main === module) {
  cron.schedule(CRON_SCHEDULE, () => {
    log("Cron triggered — 6:00 AM daily");
    runScheduled("cron").catch((e) => log("Cron error:", e.message));
  });

  if (process.env.IELTS_MOCK_CRON_ONLY === "1") {
    log("Cron-only mode — waiting for 6:00 AM daily");
  } else {
    runScheduled("manual")
      .then((r) => process.exit(r?.tasksFailed ? 1 : 0))
      .catch((err) => {
        console.error("[ieltsMockAgent] Fatal error:", err.message);
        process.exit(1);
      });
  }
}

module.exports = { runIeltsMockGeneration, generateOneMock, validateContent, AGENT_NAME };
