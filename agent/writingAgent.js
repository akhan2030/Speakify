/**
 * Daily writing agent — 6:00 AM
 * Generates Task 1 (visual) + Task 2 (essay) → daily_ai_tasks (draft)
 * Manual: npm run agent:writing-bank
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
const CRON_SCHEDULE = "0 6 * * *";
const MAX_RETRIES = 3;
const AGENT_NAME = "writing_agent";

const TASK1_VISUAL_TYPES = ["bar_chart", "line_graph", "table", "process_diagram"];
const TASK2_ESSAY_TYPES = ["opinion", "discussion", "problem_solution"];

const TASK1_TOPICS = [
  "Internet access in Saudi cities",
  "Renewable energy production",
  "University enrolment by faculty",
  "Public transport usage",
  "Water consumption in agriculture",
  "Tourism arrivals by region",
  "Mobile phone ownership by age group",
  "Employment sectors in Vision 2030",
  "Average monthly rainfall",
  "Recycling rates by material type",
];

const TASK2_TOPICS = [
  "technology and communication",
  "university education vs work experience",
  "environmental protection responsibility",
  "remote work and city life",
  "government funding for arts",
  "childhood obesity causes",
  "international tourism impact",
  "social media and mental health",
  "gap year before university",
  "aging population challenges",
];

const SYSTEM_MESSAGE = `You are an expert IELTS Academic Writing examiner and curriculum designer for Saudi Arabian learners.
Create authentic Task 1 and Task 2 practice materials with model answers calibrated to Band 6.0 and Band 7.0.
Use official IELTS criteria terminology. Content must be culturally appropriate for Saudi students.
Return ONLY valid JSON. No markdown. No commentary.`;

function log(...args) {
  console.log("[WritingAgent]", ...args);
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

function getDayIndex(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(y, 0, 0);
  const current = new Date(y, m - 1, d);
  return Math.floor((current - start) / 86400000);
}

function pickTask1VisualType(dateKey) {
  return TASK1_VISUAL_TYPES[getDayIndex(dateKey) % TASK1_VISUAL_TYPES.length];
}

function pickTask2EssayType(dateKey) {
  return TASK2_ESSAY_TYPES[getDayIndex(dateKey) % TASK2_ESSAY_TYPES.length];
}

function pickTask1Topic(dateKey) {
  return TASK1_TOPICS[getDayIndex(dateKey) % TASK1_TOPICS.length];
}

function pickTask2Topic(dateKey) {
  return TASK2_TOPICS[getDayIndex(dateKey) % TASK2_TOPICS.length];
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

function buildTask1MarkingRubric() {
  return {
    task: 1,
    criteria: ["TA", "CC", "LR", "GRA"],
    scale: "0-9 in 0.5 increments",
    overall: "Average of TA, CC, LR, GRA rounded to nearest 0.5",
    descriptors: {
      TA: {
        label: "Task Achievement",
        bands: {
          "7.0":
            "Covers requirements of the task. Presents clear overview of trends/differences/stages. Data accurately reported with appropriate selection.",
          "6.0":
            "Addresses requirements though some details may be irrelevant or missing. Presents overview but may lack clarity. Data generally accurate.",
          "5.0":
            "Generally addresses task but format may be inappropriate. Overview missing or unclear. Limited data selection.",
        },
      },
      CC: {
        label: "Coherence and Cohesion",
        bands: {
          "7.0":
            "Information logically organised with clear progression. Uses cohesive devices effectively. Paragraphing appropriate.",
          "6.0":
            "Arranges information coherently. Uses cohesive devices but may be mechanical. Paragraphing may be inadequate.",
          "5.0":
            "Some organisation but lacks overall clarity. Limited cohesive devices. Inadequate paragraphing.",
        },
      },
      LR: {
        label: "Lexical Resource",
        bands: {
          "7.0":
            "Sufficient range for task. Uses less common items with awareness of style/collocation. Occasional errors.",
          "6.0":
            "Adequate range. Attempts less common vocabulary with some inaccuracy. Errors do not impede communication.",
          "5.0":
            "Limited range. Frequent repetition. Errors may cause difficulty for reader.",
        },
      },
      GRA: {
        label: "Grammatical Range and Accuracy",
        bands: {
          "7.0":
            "Variety of complex structures. Frequent error-free sentences. Good control of grammar and punctuation.",
          "6.0":
            "Mix of simple and complex forms. Some errors in complex structures but rarely impede communication.",
          "5.0":
            "Limited range. Errors frequent and may cause difficulty. Complex sentences attempted but often faulty.",
        },
      },
    },
    penalties: [
      "Under 150 words: penalise TA by at least 1 band",
      "No overview: TA unlikely above 5.5",
      "Copied prompt phrases without paraphrase: penalise LR",
    ],
  };
}

function buildTask2MarkingRubric() {
  return {
    task: 2,
    criteria: ["TR", "CC", "LR", "GRA"],
    scale: "0-9 in 0.5 increments",
    overall: "Average of TR, CC, LR, GRA rounded to nearest 0.5",
    descriptors: {
      TR: {
        label: "Task Response",
        bands: {
          "7.0":
            "Addresses all parts of the task. Presents clear position throughout. Main ideas extended and supported.",
          "6.0":
            "Addresses all parts though some more fully than others. Relevant position though conclusions may be unclear.",
          "5.0":
            "Addresses task only partially. Position unclear. Limited main ideas with minimal support.",
        },
      },
      CC: {
        label: "Coherence and Cohesion",
        bands: {
          "7.0":
            "Logically organises information. Clear progression throughout. Uses cohesive devices flexibly.",
          "6.0":
            "Arranges information coherently. Uses cohesive devices effectively but may be mechanical.",
          "5.0":
            "Some organisation but lacks overall clarity. Overuses basic linkers.",
        },
      },
      LR: {
        label: "Lexical Resource",
        bands: {
          "7.0":
            "Sufficient range with flexibility and precision. Uses less common lexical items. Occasional errors.",
          "6.0":
            "Adequate range for the task. Attempts less common vocabulary. Errors do not impede communication.",
          "5.0":
            "Limited range. Frequent repetition and errors in word choice/spelling.",
        },
      },
      GRA: {
        label: "Grammatical Range and Accuracy",
        bands: {
          "7.0":
            "Variety of complex structures. Majority of sentences error-free. Good control of punctuation.",
          "6.0":
            "Mix of simple and complex forms. Some errors but meaning generally clear.",
          "5.0":
            "Limited range. Errors frequent. Complex sentences often faulty.",
        },
      },
    },
    penalties: [
      "Under 250 words: penalise TR by at least 1 band",
      "Off-topic or memorised template: penalise TR heavily",
      "No clear position in opinion essays: TR unlikely above 5.5",
    ],
  };
}

function visualTypeLabel(type) {
  const map = {
    bar_chart: "Bar Chart",
    line_graph: "Line Graph",
    table: "Table",
    process_diagram: "Process Diagram",
  };
  return map[type] ?? type;
}

function essayTypeLabel(type) {
  const map = {
    opinion: "Opinion",
    discussion: "Discussion",
    problem_solution: "Problem-Solution",
  };
  return map[type] ?? type;
}

function buildTask1UserMessage(visualType, topic, retryNote) {
  const retry = retryNote ? `\nIMPORTANT FIX: ${retryNote}\n` : "";

  return `Create ONE IELTS Academic Writing Task 1 practice item.
${retry}
Visual type: ${visualType} (${visualTypeLabel(visualType)})
Topic/data theme: ${topic}

Requirements:
- Include structured visual_data so the chart/table/process can be rendered
- Prompt must ask for at least 150 words
- Model answer at Band 6.0: ~160-190 words, competent but with typical Band 6 features
- Model answer at Band 7.0: ~170-200 words, stronger overview, better vocabulary and grammar
- criteria_checklist with actionable items for TA, CC, LR, GRA (4-6 items each)
- common_mistakes: 5-8 specific mistakes Saudi learners often make on this task type
- paragraph_structure_guide for Task 1 (introduction, overview, body paragraphs)

Return JSON:
{
  "title": "short title",
  "task_number": 1,
  "visual_type": "${visualType}",
  "topic": "${topic}",
  "prompt": "full exam-style question with data description",
  "min_words": 150,
  "visual_data": {
    "title": "chart/table/process title",
    "type": "${visualType}",
    "description": "plain-text description of the visual for accessibility",
    "bar_chart": { "categories": [], "series": [{ "name": "", "values": [] }] },
    "line_graph": { "x_labels": [], "series": [{ "name": "", "values": [] }] },
    "table": { "headers": [], "rows": [[]] },
    "process_diagram": { "steps": [{ "order": 1, "label": "", "description": "" }] }
  },
  "model_answer_band_6": { "text": "...", "word_count": 0, "band": 6.0 },
  "model_answer_band_7": { "text": "...", "word_count": 0, "band": 7.0 },
  "criteria_checklist": {
    "TA": ["..."],
    "CC": ["..."],
    "LR": ["..."],
    "GRA": ["..."]
  },
  "common_mistakes": [
    { "mistake": "...", "correction": "...", "criteria": "TA|CC|LR|GRA" }
  ],
  "paragraph_structure_guide": {
    "introduction": "...",
    "overview": "...",
    "body_1": "...",
    "body_2": "..."
  }
}

Rules:
- Include ONLY the visual_data block matching visual_type (omit unused chart types)
- Data must be realistic and culturally appropriate for Saudi/Gulf context where possible
- Model answers must accurately describe the data in visual_data
- Do not copy from real Cambridge IELTS papers`;
}

function buildTask2UserMessage(essayType, topic, retryNote) {
  const retry = retryNote ? `\nIMPORTANT FIX: ${retryNote}\n` : "";

  const typeInstructions = {
    opinion:
      "Ask a clear opinion question (To what extent do you agree/disagree?). Student must state a position.",
    discussion:
      "Present two contrasting views. Student must discuss BOTH views and give their own opinion.",
    problem_solution:
      "Describe a problem and ask for causes and/or solutions. Student must address all parts.",
  };

  return `Create ONE IELTS Academic Writing Task 2 practice item.
${retry}
Essay type: ${essayType} (${essayTypeLabel(essayType)})
Topic theme: ${topic}
Type requirement: ${typeInstructions[essayType]}

Requirements:
- Prompt must ask for at least 250 words
- Model answer at Band 6.0: ~260-300 words
- Model answer at Band 7.0: ~280-320 words
- criteria_checklist with actionable items for TR, CC, LR, GRA (4-6 items each)
- common_mistakes: 5-8 specific mistakes Saudi learners often make
- paragraph_structure_guide: introduction, body paragraph 1, body paragraph 2, conclusion (with purpose of each)

Return JSON:
{
  "title": "short title",
  "task_number": 2,
  "essay_type": "${essayType}",
  "topic": "${topic}",
  "prompt": "full exam-style question",
  "min_words": 250,
  "model_answer_band_6": { "text": "...", "word_count": 0, "band": 6.0 },
  "model_answer_band_7": { "text": "...", "word_count": 0, "band": 7.0 },
  "criteria_checklist": {
    "TR": ["..."],
    "CC": ["..."],
    "LR": ["..."],
    "GRA": ["..."]
  },
  "common_mistakes": [
    { "mistake": "...", "correction": "...", "criteria": "TR|CC|LR|GRA" }
  },
  "paragraph_structure_guide": {
    "introduction": "...",
    "body_paragraph_1": "...",
    "body_paragraph_2": "...",
    "conclusion": "..."
  }
}

Rules:
- Model answers must fully address the prompt for the essay type
- Band 7 answer should demonstrate clearer position, better cohesion, and wider vocabulary
- Culturally appropriate for Saudi learners; no offensive content
- Original content only`;
}

function normalizeChecklist(checklist, criteriaKeys) {
  const result = {};
  for (const key of criteriaKeys) {
    const items = Array.isArray(checklist?.[key])
      ? checklist[key].map(String).filter(Boolean)
      : [];
    if (items.length < 3) {
      throw new Error(`criteria_checklist.${key} must have at least 3 items`);
    }
    result[key] = items;
  }
  return result;
}

function normalizeModelAnswer(answer, minWords, label) {
  const text = String(answer?.text ?? "").trim();
  if (!text) throw new Error(`Missing ${label} text`);
  const count = wordCount(text);
  if (count < minWords - 20) {
    throw new Error(`${label} too short (${count} words, need ~${minWords})`);
  }
  return {
    text,
    word_count: count,
    band: Number(answer?.band ?? (label.includes("6") ? 6.0 : 7.0)),
  };
}

function normalizeCommonMistakes(mistakes) {
  const list = Array.isArray(mistakes) ? mistakes : [];
  if (list.length < 4) {
    throw new Error("common_mistakes must have at least 4 items");
  }
  return list.map((m, i) => ({
    mistake: String(m.mistake ?? "").trim(),
    correction: String(m.correction ?? "").trim(),
    criteria: String(m.criteria ?? "TA").trim(),
    id: i + 1,
  }));
}

function validateTask1Content(content) {
  if (!content.prompt?.trim()) throw new Error("Missing prompt");
  if (!content.visual_data?.type) throw new Error("Missing visual_data.type");

  content.model_answer_band_6 = normalizeModelAnswer(
    content.model_answer_band_6,
    150,
    "model_answer_band_6"
  );
  content.model_answer_band_7 = normalizeModelAnswer(
    content.model_answer_band_7,
    150,
    "model_answer_band_7"
  );
  content.criteria_checklist = normalizeChecklist(content.criteria_checklist, [
    "TA",
    "CC",
    "LR",
    "GRA",
  ]);
  content.common_mistakes = normalizeCommonMistakes(content.common_mistakes);

  if (!content.paragraph_structure_guide?.overview) {
    throw new Error("Missing paragraph_structure_guide");
  }
}

function validateTask2Content(content) {
  if (!content.prompt?.trim()) throw new Error("Missing prompt");

  content.model_answer_band_6 = normalizeModelAnswer(
    content.model_answer_band_6,
    250,
    "model_answer_band_6"
  );
  content.model_answer_band_7 = normalizeModelAnswer(
    content.model_answer_band_7,
    250,
    "model_answer_band_7"
  );
  content.criteria_checklist = normalizeChecklist(content.criteria_checklist, [
    "TR",
    "CC",
    "LR",
    "GRA",
  ]);
  content.common_mistakes = normalizeCommonMistakes(content.common_mistakes);

  const guide = content.paragraph_structure_guide ?? {};
  if (!guide.introduction || !guide.conclusion) {
    throw new Error("Missing paragraph_structure_guide");
  }
}

async function getTodayTaskCount(supabase, generationDate, taskType) {
  const { start, end } = getTodayBounds(generationDate);
  const { count, error } = await supabase
    .from("daily_ai_tasks")
    .select("id", { count: "exact", head: true })
    .eq("skill", "writing")
    .eq("task_type", taskType)
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

async function generateTask1(openai, visualType, topic) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const retryNote = lastError ? lastError.message : null;
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: 12000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          {
            role: "user",
            content: buildTask1UserMessage(visualType, topic, retryNote),
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      const parsed = parseJsonFromResponse(raw);

      const content = {
        title: String(parsed.title ?? `Task 1: ${visualTypeLabel(visualType)}`).trim(),
        task_number: 1,
        visual_type: String(parsed.visual_type ?? visualType),
        topic: String(parsed.topic ?? topic).trim(),
        prompt: String(parsed.prompt ?? "").trim(),
        min_words: Number(parsed.min_words ?? 150),
        visual_data: parsed.visual_data ?? {},
        model_answer_band_6: parsed.model_answer_band_6,
        model_answer_band_7: parsed.model_answer_band_7,
        criteria_checklist: parsed.criteria_checklist ?? {},
        common_mistakes: parsed.common_mistakes ?? [],
        paragraph_structure_guide: parsed.paragraph_structure_guide ?? {},
        marking_rubric: buildTask1MarkingRubric(),
      };

      validateTask1Content(content);
      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        log(`    Task 1 retry ${attempt}/${MAX_RETRIES}: ${lastError.message}`);
        await sleep(1200);
      }
    }
  }

  throw lastError ?? new Error("Failed to generate Task 1");
}

async function generateTask2(openai, essayType, topic) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const retryNote = lastError ? lastError.message : null;
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: 14000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          {
            role: "user",
            content: buildTask2UserMessage(essayType, topic, retryNote),
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      const parsed = parseJsonFromResponse(raw);

      const content = {
        title: String(parsed.title ?? `Task 2: ${essayTypeLabel(essayType)}`).trim(),
        task_number: 2,
        essay_type: String(parsed.essay_type ?? essayType),
        topic: String(parsed.topic ?? topic).trim(),
        prompt: String(parsed.prompt ?? "").trim(),
        min_words: Number(parsed.min_words ?? 250),
        model_answer_band_6: parsed.model_answer_band_6,
        model_answer_band_7: parsed.model_answer_band_7,
        criteria_checklist: parsed.criteria_checklist ?? {},
        common_mistakes: parsed.common_mistakes ?? [],
        paragraph_structure_guide: parsed.paragraph_structure_guide ?? {},
        marking_rubric: buildTask2MarkingRubric(),
      };

      validateTask2Content(content);
      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        log(`    Task 2 retry ${attempt}/${MAX_RETRIES}: ${lastError.message}`);
        await sleep(1200);
      }
    }
  }

  throw lastError ?? new Error("Failed to generate Task 2");
}

function buildAnswerKey(content, taskNumber) {
  return {
    task_number: taskNumber,
    model_answers: {
      band_6: content.model_answer_band_6,
      band_7: content.model_answer_band_7,
    },
    criteria_checklist: content.criteria_checklist,
  };
}

async function saveWritingTask(supabase, content, taskType, generationDate) {
  const contentHash = md5(
    `${content.title.toLowerCase()}${taskType}${generationDate}`
  );

  if (await hashExists(supabase, contentHash)) {
    log(`  Skip duplicate: ${content.title}`);
    return { saved: false, reason: "duplicate_hash" };
  }

  const taskNumber = content.task_number;
  const markingRubric = content.marking_rubric;
  const answerKey = buildAnswerKey(content, taskNumber);

  const payload = {
    skill: "writing",
    task_type: taskType,
    cefr_level: "B2.1",
    ielts_band_target: "6.0-7.0",
    difficulty: "upper_intermediate",
    topic: content.topic,
    title: `Writing Task ${taskNumber}: ${content.title}`,
    content,
    answer_key: answerKey,
    marking_rubric: markingRubric,
    estimated_minutes: taskNumber === 1 ? 20 : 40,
    ...dailyTaskPublishFields(),
    content_hash: contentHash,
    tags: [
      "writing",
      taskType,
      content.topic,
      taskNumber === 1 ? content.visual_type : content.essay_type,
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
    console.error("[WritingAgent] agent_logs insert failed:", error.message);
  }
}

async function runWritingGeneration() {
  assertEnv();

  const generationDate = getTodayDateKey();
  const startedAt = new Date().toISOString();
  const supabase = getSupabase();
  const openai = getOpenAI();

  let tasksGenerated = 0;
  let tasksFailed = 0;
  const errors = [];

  const visualType = pickTask1VisualType(generationDate);
  const essayType = pickTask2EssayType(generationDate);
  const task1Topic = pickTask1Topic(generationDate);
  const task2Topic = pickTask2Topic(generationDate);

  log("========================================");
  log("Speakify Writing Agent — AI Practice Bank");
  log(`Date: ${generationDate}`);
  log(`Task 1: ${visualTypeLabel(visualType)} — ${task1Topic}`);
  log(`Task 2: ${essayTypeLabel(essayType)} — ${task2Topic}`);
  log("========================================");

  try {
    const task1Existing = await getTodayTaskCount(
      supabase,
      generationDate,
      "writing_task1"
    );

    if (task1Existing >= 1) {
      log("  Skip Task 1 — already generated today");
      tasksGenerated += 1;
    } else {
      log(`  Generating Task 1 (${visualTypeLabel(visualType)})...`);
      try {
        const content = await generateTask1(openai, visualType, task1Topic);
        const result = await saveWritingTask(
          supabase,
          content,
          "writing_task1",
          generationDate
        );

        if (result.saved) {
          tasksGenerated += 1;
          log(
            `  Saved Task 1 ✓ — "${content.title}" (Band 6: ${content.model_answer_band_6.word_count}w, Band 7: ${content.model_answer_band_7.word_count}w)`
          );
        } else {
          tasksFailed += 1;
        }
      } catch (err) {
        tasksFailed += 1;
        errors.push(`Task 1: ${err.message}`);
        log(`  ✗ Task 1 failed: ${err.message}`);
      }
    }

    await sleep(1500);

    const task2Existing = await getTodayTaskCount(
      supabase,
      generationDate,
      "writing_task2"
    );

    if (task2Existing >= 1) {
      log("  Skip Task 2 — already generated today");
      tasksGenerated += 1;
    } else {
      log(`  Generating Task 2 (${essayTypeLabel(essayType)})...`);
      try {
        const content = await generateTask2(openai, essayType, task2Topic);
        const result = await saveWritingTask(
          supabase,
          content,
          "writing_task2",
          generationDate
        );

        if (result.saved) {
          tasksGenerated += 1;
          log(
            `  Saved Task 2 ✓ — "${content.title}" (Band 6: ${content.model_answer_band_6.word_count}w, Band 7: ${content.model_answer_band_7.word_count}w)`
          );
        } else {
          tasksFailed += 1;
        }
      } catch (err) {
        tasksFailed += 1;
        errors.push(`Task 2: ${err.message}`);
        log(`  ✗ Task 2 failed: ${err.message}`);
      }
    }

    log("========================================");
    log(`Done — ${tasksGenerated} drafts saved, ${tasksFailed} failed/skipped`);
    log("All content saved as status: published (live for students)");
    log("Next run: 6:00 AM tomorrow");
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
    await runWritingGeneration();
  } catch (err) {
    console.error("[WritingAgent] Fatal error:", err.message);
  } finally {
    generationRunning = false;
  }
}

if (require.main === module) {
  cron.schedule(CRON_SCHEDULE, () => {
    log("Cron triggered — 6:00 AM daily run");
    runScheduledGeneration("cron").catch((err) => {
      console.error("[WritingAgent] Cron failed:", err.message);
    });
  });

  runScheduledGeneration("manual")
    .then(() => {
      if (process.env.WRITING_AGENT_EXIT === "1") {
        process.exit(0);
      }
      log("Process alive — waiting for next cron run (6:00 AM)");
    })
    .catch((err) => {
      console.error("[WritingAgent] Startup failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runWritingGeneration,
  buildTask1MarkingRubric,
  buildTask2MarkingRubric,
  pickTask1VisualType,
  pickTask2EssayType,
  normalizeModelAnswer,
  md5,
};
