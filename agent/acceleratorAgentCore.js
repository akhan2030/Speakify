/**
 * Shared IELTS Accelerator content generation engine.
 * Generates complete full IELTS mock tests (4 sections, 40+40 questions, full timing).
 * Structure is identical across tracks — only difficulty changes.
 */

const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");
const { LISTENING_TRANSCRIPT_AUTHENTICITY_RULES } = require("./listeningTranscriptRules.js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MODEL = "gpt-4o";
const TEMPERATURE = 0.72;
const MAX_TOKENS = 16000;
const MAX_GENERATION_RETRIES = 2;
const SECTIONS = ["listening", "reading", "writing", "speaking"];

const TOPIC_CATEGORIES = [
  "Environment & Climate Change",
  "Technology & Digital Society",
  "Health & Medicine",
  "Education Systems & Learning",
  "Urban Development & Architecture",
  "Business & Global Economy",
  "Science & Research",
  "Media & Communication",
  "Psychology & Human Behaviour",
  "History & Cultural Heritage",
  "Food Security & Agriculture",
  "Sports & Physical Wellbeing",
  "Language & Identity",
  "Energy & Sustainability",
  "Law & Social Justice",
  "Family & Community Values",
  "Art & Creative Expression",
  "Travel & Cultural Exchange",
  "Wildlife & Biodiversity",
  "Space & Future Technology",
];

const TRACK_QUOTAS = {
  foundation: { full_mock: 1 },
  plus: { full_mock: 1 },
  elite: { full_mock: 1 },
};

const TRACK_CONFIGS = {
  foundation: {
    track: "foundation",
    targetBand: "5.0-5.5",
    difficulty: "foundation",
    cefr: "B1",
    agentName: "accelerator_foundation_agent",
    modelBand: "5.5",
    modelAnswerKey: "model_answer_band55",
    modelAnswersKey: "model_answers_band55",
    readingWordMins: [500, 600, 650],
    writingModelMin: { task1: 150, task2: 250 },
  },
  plus: {
    track: "plus",
    targetBand: "6.0-6.5",
    difficulty: "plus",
    cefr: "B2",
    agentName: "accelerator_plus_agent",
    modelBand: "6.5",
    modelAnswerKey: "model_answer_band65",
    modelAnswersKey: "model_answers_band65",
    readingWordMins: [700, 800, 850],
    writingModelMin: { task1: 150, task2: 250 },
  },
  elite: {
    track: "elite",
    targetBand: "7.0+",
    difficulty: "elite",
    cefr: "C1",
    agentName: "accelerator_elite_agent",
    modelBand: "7.5",
    modelAnswerKey: "model_answer_band75",
    modelAnswersKey: "model_answers_band75",
    readingWordMins: [900, 1000, 1050],
    writingModelMin: { task1: 150, task2: 250 },
  },
};

const TRACK_SYSTEM_PROMPTS = {
  foundation: `You are a senior IELTS examiner creating a complete Foundation level mock test for students targeting Band 5.0-5.5. Students are B1 level English learners, many are Saudi Arabic speakers with these known difficulties: article omission (a/an/the), verb tense consistency, subject-verb agreement.

STRICT RULES:
- Vocabulary: B1 frequency band only — everyday academic words
- Sentences: clear, mostly simple and compound structures
- Topics: concrete and familiar — education, health, technology, environment
- Saudi context: reference Gulf region, Vision 2030, KSA life naturally
- All answers must appear word-for-word in the text or transcript
- Correct answers must be distributed across A/B/C/D — never all one letter
- Model answers demonstrate Band 5.5 quality — good effort but not perfect
- Listening transcripts: slow deliberate delivery, clear signposting
${LISTENING_TRANSCRIPT_AUTHENTICITY_RULES}
- Return ONLY valid JSON — no markdown, no explanation outside JSON`,

  plus: `You are a senior IELTS examiner creating a complete Plus level mock test for students targeting Band 6.0-6.5. Students are B2 level English learners, many are Saudi Arabic speakers preparing for university or professional life.

STRICT RULES:
- Vocabulary: B2 academic word list levels 1-5
- Listening: natural speed, academic monologues and group discussions
- Section 1: university enrollment or professional conversation in Saudi/Gulf context
- Section 2: work presentation or campus facility announcement
- Section 3: 3 students in academic tutorial, overlapping ideas
- Section 4: academic lecture, abstract topic, less signposting
- Reading: semi-academic and analytical texts with inference required
- Writing Task 1: mixed chart types or process diagram
- Writing Task 2: discussion or opinion essay, semi-abstract topic
- Speaking Part 2: semi-abstract personal experience topic
- Speaking Part 3: broader social topic discussion
- All model answers at Band 6.5 quality
- Topics: Vision 2030, university life, career, Gulf society
- All answers must appear word-for-word in the text or transcript
- MCQ correct answers distributed across A/B/C/D
${LISTENING_TRANSCRIPT_AUTHENTICITY_RULES}
- Return ONLY valid JSON — no markdown, no explanation outside JSON`,

  elite: `You are a senior IELTS examiner creating a complete Elite level mock test for students targeting Band 7.0+. Students are C1 level English learners.

STRICT RULES:
- Vocabulary: C1 low-frequency academic, precise word choice required
- Listening: fast natural speech, overlapping speakers, complex lectures
- Section 1: professional high-stakes consultation, fast natural speed
- Section 2: complex policy briefing or research summary
- Section 3: 3-4 speakers in complex academic debate, fast speech
- Section 4: dense academic lecture, no signposting, abstract topic
- Reading: dense academic prose, implicit meaning throughout, writer attitude questions
- Writing Task 1: complex multi-data visual or map/diagram comparison
- Writing Task 2: abstract philosophical or ethical topic, nuanced argument
- Speaking Part 2: abstract idea or global issue cue card
- Speaking Part 3: philosophical and global abstract discussion
- All model answers at Band 7.5 quality
- Strict IELTS examiner format, no scaffolding, no extra guidance
- Topics: global policy, ethics, cultural identity, academic discourse
- All answers must appear word-for-word in the text or transcript
- MCQ correct answers distributed across A/B/C/D
${LISTENING_TRANSCRIPT_AUTHENTICITY_RULES}
- Return ONLY valid JSON — no markdown, no explanation outside JSON`,
};

function log(prefix, ...args) {
  console.log(`[${prefix}]`, ...args);
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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonFromResponse(raw) {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1].trim() : text);
}

function hashContent(content) {
  return crypto.createHash("md5").update(JSON.stringify(content)).digest("hex");
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

function pickTopicCategory(recentTopics, index) {
  const recent = new Set((recentTopics ?? []).map((t) => String(t).toLowerCase()));
  const pool = TOPIC_CATEGORIES.filter((c) => !recent.has(c.toLowerCase()));
  const list = pool.length ? pool : TOPIC_CATEGORIES;
  return list[index % list.length];
}

async function fetchRecentTopics(supabase, track) {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("accelerator_mock_tests")
    .select("topic")
    .eq("track", track)
    .gte("generated_at", since);
  if (error) {
    console.warn("[Accelerator] recent topics:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.topic).filter(Boolean);
}

async function getContentCounts(supabase, track) {
  const { data, error } = await supabase
    .from("accelerator_mock_tests")
    .select("test_type")
    .eq("track", track);

  if (error) throw new Error(`Content count lookup failed: ${error.message}`);

  let full_mock = 0;
  for (const row of data ?? []) {
    if (row.test_type === "full_mock") full_mock += 1;
  }
  return { full_mock };
}

function buildFullMockUserPrompt(config, topicCategory, testNumber) {
  const band = config.modelBand;
  const modelKey = config.modelAnswerKey;
  const modelsKey = config.modelAnswersKey;
  const [p1Min, p2Min, p3Min] = config.readingWordMins;

  const trackNotes = {
    foundation: `
LISTENING difficulty (Foundation / B1):
- Section 1 (Q1-10): form completion — two speakers, hotel booking in Riyadh, slow clear speech
- Section 2 (Q11-20): MCQ + matching — one speaker, tour guide or local announcement, simple language
- Section 3 (Q21-30): MCQ + matching — 2-3 students discussing assignment, guided and clear
- Section 4 (Q31-40): note completion — academic lecture, slow delivery, familiar science topic, clear signposting
READING word counts: Passage 1 ${p1Min}-600, Passage 2 ${p2Min}-700, Passage 3 ${p3Min}-750
WRITING: Task 1 simple bar/pie chart with Saudi-familiar data; Task 2 agree/disagree on concrete topic
SPEAKING: Part 1 personal familiar topics; Part 2 concrete personal cue card; Part 3 concrete discussion linked to Part 2`,

    plus: `
LISTENING difficulty (Plus / B2):
- Section 1 (Q1-10): university enrollment or professional conversation, natural speed
- Section 2 (Q11-20): community facility or work presentation, academic language
- Section 3 (Q21-30): 3 speakers in academic tutorial, overlapping ideas
- Section 4 (Q31-40): academic lecture, abstract topic, less signposting
READING word counts: Passage 1 ${p1Min}-800, Passage 2 ${p2Min}-900, Passage 3 ${p3Min}-950
WRITING: Task 1 mixed chart or process diagram; Task 2 discussion/opinion semi-abstract topic
SPEAKING: Part 2 semi-abstract personal experience; Part 3 broader social discussion`,

    elite: `
LISTENING difficulty (Elite / C1):
- Section 1 (Q1-10): professional high-stakes consultation, fast natural speed
- Section 2 (Q11-20): complex policy briefing or research presentation
- Section 3 (Q21-30): 3-4 speakers in complex academic debate, fast overlapping speech
- Section 4 (Q31-40): dense academic lecture, no signposting, abstract topic
READING word counts: Passage 1 ${p1Min}-1000, Passage 2 ${p2Min}-1100, Passage 3 ${p3Min}-1150
WRITING: Task 1 complex multi-data visual or map comparison; Task 2 abstract philosophical/ethical topic
SPEAKING: Part 2 abstract/global cue card; Part 3 philosophical global discussion`,
  };

  return `Generate ONE complete IELTS Academic FULL MOCK TEST #${testNumber} for the ${config.track} track.

Primary topic category: ${topicCategory}
${trackNotes[config.track]}

STRUCTURE IS FIXED — always exactly:
- Listening: 4 sections, 40 questions, 30 minutes
- Reading: 3 passages, 40 questions, 60 minutes
- Writing: Task 1 (150+ words, 20 min) + Task 2 (250+ words, 40 min)
- Speaking: Part 1 (5 questions) + Part 2 (cue card, 60s prep, 120s talk) + Part 3 (4 questions)

Return this exact JSON structure (fill all fields completely):
{
  "track": "${config.track}",
  "target_band": "${config.targetBand}",
  "test_type": "full_mock",
  "topic": "${topicCategory}",
  "listening": {
    "total_questions": 40,
    "total_minutes": 30,
    "sections": [
      { "section": 1, "questions": "1-10", "type": "form_completion", "situation": "...", "speakers": [], "transcript": "350-400 words", "questions": [/* 10 with number, type, question, answer */], "answer_key": { "Q1": "", "Q10": "" } },
      { "section": 2, "questions": "11-20", "type": "multiple_choice_and_matching", "speaker": {}, "transcript": "300-350 words", "questions": [/* 10 */], "answer_key": {} },
      { "section": 3, "questions": "21-30", "type": "multiple_choice_and_matching", "speakers": [], "transcript": "400-450 words", "questions": [/* 10 */], "answer_key": {} },
      { "section": 4, "questions": "31-40", "type": "note_completion", "speaker": {}, "transcript": "450-500 words", "questions": [/* 10 */], "answer_key": {} }
    ]
  },
  "reading": {
    "total_questions": 40,
    "total_minutes": 60,
    "passages": [
      { "passage": 1, "questions": "1-13", "title": "", "text": "", "question_types": ["true_false_not_given", "multiple_choice"], "questions": [/* 13 */], "answer_key": {} },
      { "passage": 2, "questions": "14-26", "title": "", "text": "", "question_types": ["matching_headings", "sentence_completion"], "questions": [/* 13 */], "answer_key": {} },
      { "passage": 3, "questions": "27-40", "title": "", "text": "", "question_types": ["summary_completion", "multiple_choice", "short_answer"], "questions": [/* 14 */], "answer_key": {} }
    ]
  },
  "writing": {
    "total_minutes": 60,
    "task1": { "type": "", "prompt": "", "data": {}, "time_recommended": 20, "word_minimum": 150, "${modelKey}": "", "marking_rubric": {} },
    "task2": { "type": "", "prompt": "", "time_recommended": 40, "word_minimum": 250, "${modelKey}": "", "marking_rubric": {} }
  },
  "speaking": {
    "total_minutes_range": "11-14",
    "part1": { "duration": "4-5 minutes", "topic": "", "questions": [/* 5 */], "${modelsKey}": [/* 5 */] },
    "part2": { "duration": "3-4 minutes", "prep_seconds": 60, "talk_seconds": 120, "cue_card": "", "bullet_points": [], "${modelKey}": "" },
    "part3": { "duration": "4-5 minutes", "questions": [/* 4 */], "${modelsKey}": [/* 4 */] }
  }
}

CRITICAL: Every listening/reading completion answer must appear word-for-word in the transcript or passage. MCQ must have exactly 4 options with answers spread across A/B/C/D.

QUESTION SCHEMA (required for every question object):
{
  "number": 1,
  "question_text": "Full question prompt shown to the student",
  "question_type": "multiple_choice | completion | true_false_not_given | matching | short_answer",
  "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
  "correct_index": 1,
  "correct_answer": "B",
  "explanation": "Brief marking note"
}
For listening sections also include "audio_url": null (TTS generated at runtime) and a complete "transcript" per section.
Use question_text (not prompt alone) and options (not choices alone).

MCQ RULE (mandatory): Every multiple choice question must have exactly 4 options labeled A, B, C, D. Never 3 options. Never 2 options. Always 4.

${LISTENING_TRANSCRIPT_AUTHENTICITY_RULES}`;
}

function collectListeningQuestions(listening) {
  const out = [];
  for (const sec of listening?.sections ?? listening?.parts ?? []) {
    const transcript = sec.transcript ?? sec.audio_script ?? "";
    for (const q of sec.questions ?? []) {
      out.push({ ...q, transcript, section: sec.section ?? sec.part });
    }
    for (const [key, ans] of Object.entries(sec.answer_key ?? {})) {
      if (!out.find((q) => String(q.number) === key.replace(/^Q/i, "") || q.key === key)) {
        out.push({ number: key, answer: ans, type: "completion", transcript, section: sec.section });
      }
    }
  }
  return out;
}

function collectReadingQuestions(reading) {
  const out = [];
  for (const passage of reading?.passages ?? []) {
    const text = passage.text ?? "";
    for (const q of passage.questions ?? []) {
      out.push({ ...q, text, passage: passage.passage ?? passage.passage_number });
    }
  }
  return out;
}

function isMcqQuestion(q) {
  const type = String(q.type ?? q.question_type ?? "").toLowerCase();
  return type.includes("multiple_choice") || type === "mcq";
}

function getMcqOptions(q) {
  return q.options ?? q.choices ?? [];
}

function validateMcqOptionCounts(content) {
  const allQ = [
    ...collectListeningQuestions(content.listening),
    ...collectReadingQuestions(content.reading),
  ];
  for (const q of allQ) {
    if (!isMcqQuestion(q)) continue;
    const opts = getMcqOptions(q);
    if (opts.length !== 4) {
      throw new Error(
        `Question ${q.number ?? "?"} has ${opts.length} options — must have exactly 4`
      );
    }
  }
}

function mcqDistributionCheck(questions) {
  const letters = [];
  for (const q of questions) {
    if (!isMcqQuestion(q)) continue;
    const opts = getMcqOptions(q);
    if (opts.length !== 4) {
      return {
        ok: false,
        reason: `Question ${q.number ?? "?"} has ${opts.length} options — must have exactly 4`,
      };
    }
    const ans = String(q.answer ?? q.correct_answer ?? "").trim();
    const idx = opts.findIndex(
      (o) =>
        normalizeText(o) === normalizeText(ans) ||
        String(o).toUpperCase().startsWith(ans.toUpperCase())
    );
    if (idx < 0) {
      return { ok: false, reason: `MCQ Q${q.number ?? "?"} answer not in options` };
    }
    letters.push(["A", "B", "C", "D"][idx]);
  }
  if (letters.length >= 4) {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    for (const l of letters) counts[l] += 1;
    if (Math.max(...Object.values(counts)) > Math.ceil(letters.length * 0.6)) {
      return { ok: false, reason: "MCQ answers too clustered on one letter" };
    }
  }
  return { ok: true };
}

function verifyMockTest(content, config) {
  const errors = [];
  const prefix = config.agentName;

  const listeningSections = content.listening?.sections ?? content.listening?.parts ?? [];
  if (listeningSections.length !== 4) {
    errors.push(`Listening: need 4 sections, got ${listeningSections.length}`);
  }

  const lQuestions = collectListeningQuestions(content.listening);
  if (lQuestions.length < 40) {
    errors.push(`Listening: need 40 questions, got ${lQuestions.length}`);
  }

  for (const q of lQuestions) {
    const type = String(q.type ?? q.question_type ?? "").toLowerCase();
    if (
      type.includes("completion") ||
      type.includes("form") ||
      type.includes("note") ||
      type.includes("sentence")
    ) {
      const ans = q.answer ?? q.correct_answer;
      if (ans && q.transcript && !answerInSource(ans, q.transcript)) {
        errors.push(`Listening ${q.number ?? "?"}: answer "${ans}" not in transcript`);
      }
    }
  }

  const lMcq = mcqDistributionCheck(lQuestions);
  if (!lMcq.ok) errors.push(`Listening: ${lMcq.reason}`);

  const passages = content.reading?.passages ?? [];
  if (passages.length !== 3) {
    errors.push(`Reading: need 3 passages, got ${passages.length}`);
  }

  passages.forEach((p, i) => {
    const wc = wordCount(p.text);
    const min = (config.readingWordMins[i] ?? 500) - 80;
    if (wc < min) {
      errors.push(`Reading passage ${p.passage ?? i + 1}: ${wc} words (min ~${config.readingWordMins[i]})`);
    }
  });

  const rQuestions = collectReadingQuestions(content.reading);
  if (rQuestions.length < 40) {
    errors.push(`Reading: need 40 questions, got ${rQuestions.length}`);
  }

  for (const q of rQuestions) {
    const type = String(q.type ?? q.question_type ?? "").toLowerCase();
    const ans = String(q.answer ?? q.correct_answer ?? "").toUpperCase();
    if (["TRUE", "FALSE", "NOT GIVEN", "YES", "NO"].includes(ans)) continue;
    if (type.includes("multiple_choice") || type.includes("matching")) continue;
    const rawAns = q.answer ?? q.correct_answer;
    if (rawAns && q.text && !answerInSource(rawAns, q.text)) {
      errors.push(`Reading Q${q.number ?? "?"}: answer not in passage`);
    }
  }

  const rMcq = mcqDistributionCheck(rQuestions);
  if (!rMcq.ok) errors.push(`Reading: ${rMcq.reason}`);

  const writing = content.writing ?? {};
  if (!writing.task1?.prompt) errors.push("Writing task1 missing prompt");
  if (!writing.task2?.prompt) errors.push("Writing task2 missing prompt");

  const modelKey = config.modelAnswerKey;
  const t1Model = writing.task1?.[modelKey] ?? writing.task1?.model_answer ?? "";
  const t2Model = writing.task2?.[modelKey] ?? writing.task2?.model_answer ?? "";
  if (wordCount(t1Model) < config.writingModelMin.task1 - 20) {
    errors.push(`Writing task1 model answer too short (${wordCount(t1Model)} words)`);
  }
  if (wordCount(t2Model) < config.writingModelMin.task2 - 30) {
    errors.push(`Writing task2 model answer too short (${wordCount(t2Model)} words)`);
  }

  const speaking = content.speaking ?? {};
  if (!(speaking.part1?.questions?.length >= 5)) errors.push("Speaking part1 needs 5 questions");
  if (!speaking.part2?.cue_card) errors.push("Speaking part2 missing cue card");
  if (!(speaking.part3?.questions?.length >= 4)) errors.push("Speaking part3 needs 4 questions");

  if (errors.length > 0) {
    log(prefix, "Quality check failed:", errors.slice(0, 6).join("; "));
    return { ok: false, errors };
  }
  return { ok: true, errors: [] };
}

async function callOpenAI(openai, systemPrompt, userPrompt) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty OpenAI response");
  return parseJsonFromResponse(raw);
}

function extractAnswerKey(content) {
  const listening = {};
  for (const sec of content.listening?.sections ?? []) {
    listening[`section_${sec.section}`] = sec.answer_key ?? {};
  }
  const reading = {};
  for (const p of content.reading?.passages ?? []) {
    reading[`passage_${p.passage}`] = p.answer_key ?? {};
  }
  return {
    listening,
    reading,
    writing: {
      task1: content.writing?.task1?.marking_rubric ?? {},
      task2: content.writing?.task2?.marking_rubric ?? {},
    },
    speaking: {},
  };
}

function extractModelAnswers(content, config) {
  const modelKey = config.modelAnswerKey;
  const modelsKey = config.modelAnswersKey;
  return {
    writing: {
      task1: content.writing?.task1?.[modelKey] ?? content.writing?.task1?.model_answer,
      task2: content.writing?.task2?.[modelKey] ?? content.writing?.task2?.model_answer,
    },
    speaking: {
      part1: content.speaking?.part1?.[modelsKey] ?? content.speaking?.part1?.model_answers,
      part2: content.speaking?.part2?.[modelKey] ?? content.speaking?.part2?.model_answer,
      part3: content.speaking?.part3?.[modelsKey] ?? content.speaking?.part3?.model_answers,
    },
  };
}

async function saveFullMock(supabase, { config, testNumber, topic, content }) {
  const contentHash = hashContent(content);

  const { data: existing } = await supabase
    .from("accelerator_mock_tests")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing) {
    console.log("[Accelerator] Content already exists, skipping...");
    return { saved: false, reason: "duplicate" };
  }

  validateMcqOptionCounts(content);

  const now = new Date().toISOString();
  const payload = {
    track: config.track,
    test_number: testNumber,
    test_type: "full_mock",
    section: null,
    difficulty: config.difficulty,
    target_band: config.targetBand,
    content,
    answer_key: extractAnswerKey(content),
    marking_rubric: {
      writing_task1: content.writing?.task1?.marking_rubric ?? {},
      writing_task2: content.writing?.task2?.marking_rubric ?? {},
    },
    model_answers: extractModelAnswers(content, config),
    topic,
    status: "published",
    published_at: now,
    content_hash: contentHash,
  };

  const { data, error } = await supabase
    .from("accelerator_mock_tests")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      console.log("[Accelerator] Duplicate hash, skipping...");
      return { saved: false, reason: "duplicate" };
    }
    throw new Error(`Save failed: ${error.message}`);
  }
  return { saved: true, row: data };
}

async function generateFullMock(openai, config, topicCategory, testNumber) {
  const systemPrompt = TRACK_SYSTEM_PROMPTS[config.track];
  const userPrompt = buildFullMockUserPrompt(config, topicCategory, testNumber);

  let lastErrors = [];
  for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES + 1; attempt += 1) {
    const retryNote =
      attempt > 1
        ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastErrors.join("\n")}\nFix ALL issues. Ensure exactly 40 listening + 40 reading questions with complete transcripts and passages.`
        : "";

    const content = await callOpenAI(openai, systemPrompt, userPrompt + retryNote);
    content.track = config.track;
    content.target_band = config.targetBand;
    content.test_type = "full_mock";
    content.topic = topicCategory;

    const verification = verifyMockTest(content, config);
    if (verification.ok) {
      return content;
    }

    lastErrors = verification.errors.slice(0, 12);
    log(config.agentName, `Attempt ${attempt} failed validation — retrying...`);
    await sleep(2000);
  }

  throw new Error(`Validation failed after ${MAX_GENERATION_RETRIES + 1} attempts`);
}

async function logAgentRun(supabase, agentName, run) {
  const { error } = await supabase.from("agent_logs").insert({
    agent_name: agentName,
    run_date: getTodayDateKey(),
    started_at: run.startedAt,
    completed_at: run.completedAt ?? new Date().toISOString(),
    status: run.status,
    tasks_generated: run.tasksGenerated ?? 0,
    tasks_failed: run.tasksFailed ?? 0,
    errors: run.errors?.length ? run.errors : null,
    notes: run.notes ?? null,
  });
  if (error) console.warn(`[${agentName}] agent_logs:`, error.message);
}

async function runTrackGeneration(trackKey) {
  assertEnv();
  const config = TRACK_CONFIGS[trackKey];
  const quotas = TRACK_QUOTAS[trackKey];
  if (!config || !quotas) throw new Error(`Unknown track: ${trackKey}`);

  const supabase = getSupabase();
  const openai = getOpenAI();
  const prefix = config.agentName;
  const startedAt = new Date().toISOString();
  let tasksGenerated = 0;
  let tasksFailed = 0;
  const errors = [];

  log(prefix, "========================================");
  log(prefix, `IELTS Accelerator — ${config.track.toUpperCase()} FULL MOCK (${config.targetBand})`);
  log(prefix, "Structure: 4 listening + 3 reading + 2 writing + 3 speaking");
  log(prefix, "========================================");

  const recentTopics = await fetchRecentTopics(supabase, config.track);
  const counts = await getContentCounts(supabase, config.track);
  log(prefix, "Current full_mock pool:", counts.full_mock);

  const fullNeeded = quotas.full_mock - counts.full_mock;
  if (fullNeeded <= 0) {
    log(prefix, `full_mock: quota met (${counts.full_mock}/${quotas.full_mock})`);
  } else {
    log(prefix, `full_mock: generating ${fullNeeded} complete test(s)...`);
    for (let i = 0; i < fullNeeded; i += 1) {
      const testNumber = counts.full_mock + i + 1;
      const topicCategory = pickTopicCategory(recentTopics, i);
      try {
        const content = await generateFullMock(openai, config, topicCategory, testNumber);
        const result = await saveFullMock(supabase, {
          config,
          testNumber,
          topic: topicCategory,
          content,
        });
        if (result.saved) {
          tasksGenerated += 1;
          log(prefix, `  full_mock #${testNumber} saved ✓ (${topicCategory})`);
        } else {
          log(prefix, `  full_mock #${testNumber} skipped (${result.reason})`);
        }
        await sleep(2000);
      } catch (err) {
        tasksFailed += 1;
        errors.push(`full_mock_${testNumber}: ${err.message}`);
        log(prefix, `  full_mock #${testNumber} failed: ${err.message}`);
      }
    }
  }

  log(prefix, "========================================");
  log(prefix, `Done — ${tasksGenerated} published, ${tasksFailed} failed`);
  log(prefix, "========================================");

  await logAgentRun(supabase, config.agentName, {
    startedAt,
    completedAt: new Date().toISOString(),
    status: errors.length ? "partial" : "success",
    tasksGenerated,
    tasksFailed,
    errors,
    notes: `track=${config.track}, type=full_mock`,
  });

  return { tasksGenerated, tasksFailed, errors };
}

/** Generate a complete full mock on demand (practice pool empty). */
async function generateOnDemand(trackKey, section, options = {}) {
  assertEnv();
  const config = TRACK_CONFIGS[trackKey];
  if (!config) throw new Error(`Unknown track: ${trackKey}`);
  const studentId = options.studentId ?? null;

  const supabase = getSupabase();
  const openai = getOpenAI();
  const recentTopics = await fetchRecentTopics(supabase, trackKey);
  const counts = await getContentCounts(supabase, trackKey);
  const topicCategory = pickTopicCategory(recentTopics, Date.now());
  const testNumber = counts.full_mock + 1;

  const content = await generateFullMock(openai, config, topicCategory, testNumber);
  const result = await saveFullMock(supabase, {
    config,
    testNumber,
    topic: topicCategory,
    content,
  });

  const row =
    result.row ??
    (
      await supabase
        .from("accelerator_mock_tests")
        .select("*")
        .eq("content_hash", hashContent(content))
        .maybeSingle()
    ).data;

  if (!row) throw new Error("Failed to retrieve generated test");

  if (studentId) {
    try {
      const { validateFreshMockTest } = require("../lib/contentUsage.js");
      const validation = await validateFreshMockTest(studentId, row);
      if (!validation.isValid) {
        log(config.agentName, "Duplicate content detected for student:", validation.issues);
        log(config.agentName, "Regenerating fresh content with alternate topic...");
        const altTopic = pickTopicCategory([...recentTopics, topicCategory], Date.now() + 1);
        const altContent = await generateFullMock(openai, config, altTopic, testNumber + 1);
        const altResult = await saveFullMock(supabase, {
          config,
          testNumber: testNumber + 1,
          topic: altTopic,
          content: altContent,
        });
        const altRow = altResult.row ?? row;
        if (section && SECTIONS.includes(section)) {
          return {
            ...altRow,
            practiceSection: section,
            sectionContent: altRow.content?.[section] ?? null,
          };
        }
        return altRow;
      }
    } catch (err) {
      log(config.agentName, "Content usage validation skipped:", err.message);
    }
  }

  if (section && SECTIONS.includes(section)) {
    return { ...row, practiceSection: section, sectionContent: row.content?.[section] ?? null };
  }
  return row;
}

module.exports = {
  TRACK_CONFIGS,
  TRACK_QUOTAS,
  TOPIC_CATEGORIES,
  runTrackGeneration,
  generateOnDemand,
  verifyMockTest,
  hashContent,
  getContentCounts,
  getSupabase,
  assertEnv,
  getTodayDateKey,
};
