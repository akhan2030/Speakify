/**
 * Speaking agent — daily speaking launcher cards per CEFR level
 * Manual: npm run agent:speaking
 */

const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { dailyTaskPublishFields } = require("./dailyTaskPublish.js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const AGENT_NAME = "speaking_agent";
const TASKS_PER_LEVEL = 1;

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

const SPEAKING_TOPICS = [
  "daily life",
  "work and study",
  "travel",
  "hobbies",
  "food and health",
  "technology",
  "environment",
];

function log(...args) {
  console.log("[SpeakingAgent]", ...args);
}

function md5(value) {
  return crypto.createHash("md5").update(String(value)).digest("hex");
}

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getBandForLevel(cefrLevel) {
  const map = {
    "A1.1": 3.5,
    "A1.2": 4.0,
    "A2.1": 4.5,
    "A2.2": 5.0,
    "B1.1": 5.5,
    "B1.2": 6.0,
    "B2.1": 6.5,
    "B2.2": 7.0,
    "C1.1": 7.5,
    "C1.2": 8.0,
  };
  return map[cefrLevel] ?? 5.5;
}

function pickTopic(generationDate, cefrLevel) {
  const hash = md5(`${generationDate}-${cefrLevel}`);
  const index = parseInt(hash.slice(0, 8), 16) % SPEAKING_TOPICS.length;
  return SPEAKING_TOPICS[index];
}

function buildSpeakingContent(cefrLevel, topic, generationDate) {
  return {
    cefr_level: cefrLevel,
    ielts_band_target: getBandForLevel(cefrLevel),
    topic,
    mode: "live_examiner",
    parts: [1, 2, 3],
    summary: `Daily speaking practice with Sarah — Parts 1–3 on ${topic}.`,
    generation_date: generationDate,
  };
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

async function getTodayTaskCount(supabase, generationDate, cefrLevel) {
  const start = `${generationDate}T00:00:00.000Z`;
  const end = `${generationDate}T23:59:59.999Z`;

  const { count, error } = await supabase
    .from("daily_ai_tasks")
    .select("id", { count: "exact", head: true })
    .eq("skill", "speaking")
    .eq("cefr_level", cefrLevel)
    .gte("published_at", start)
    .lte("published_at", end);

  if (error) throw error;
  return count ?? 0;
}

async function saveSpeakingTask(supabase, cefrLevel, generationDate) {
  const topic = pickTopic(generationDate, cefrLevel);
  const contentHash = md5(`speaking-${topic}-${cefrLevel}-${generationDate}`);

  if (await hashExists(supabase, contentHash)) {
    log(`  Skip duplicate: Speaking (${cefrLevel})`);
    return { saved: false, reason: "duplicate_hash" };
  }

  const content = buildSpeakingContent(cefrLevel, topic, generationDate);
  const payload = {
    skill: "speaking",
    task_type: "speaking_session",
    cefr_level: cefrLevel,
    ielts_band_target: content.ielts_band_target,
    difficulty: cefrLevel.startsWith("C") ? "advanced" : cefrLevel.startsWith("B") ? "intermediate" : "beginner",
    topic,
    title: `Speaking: Daily practice with Sarah (${topic})`,
    content,
    answer_key: null,
    marking_rubric: { mode: "ielts_speaking_criteria" },
    estimated_minutes: 15,
    ...dailyTaskPublishFields(),
    content_hash: contentHash,
    tags: [cefrLevel, "speaking", "speaking_session", topic],
  };

  const { error } = await supabase.from("daily_ai_tasks").insert(payload);
  if (error) {
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return { saved: false, reason: "duplicate_db" };
    }
    throw new Error(`Insert daily_ai_tasks (speaking ${cefrLevel}): ${error.message}`);
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
    console.error("[SpeakingAgent] agent_logs insert failed:", error.message);
  }
}

async function runSpeakingGeneration() {
  const generationDate = getTodayDateKey();
  const startedAt = new Date().toISOString();

  log("========================================");
  log("Speakify Speaking Agent — AI Practice Bank");
  log(`Date: ${generationDate}`);
  log(`Target: ${CEFR_LEVELS.length} speaking launchers (1 per CEFR level)`);
  log("========================================");

  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
    const note = "Supabase not configured — skipped";
    log(note);
    return { tasksGenerated: 0, tasksFailed: 0, errors: [note] };
  }

  const supabase = getSupabase();
  let tasksGenerated = 0;
  let tasksFailed = 0;
  const errors = [];

  try {
    for (const cefrLevel of CEFR_LEVELS) {
      try {
        const existing = await getTodayTaskCount(supabase, generationDate, cefrLevel);
        if (existing >= TASKS_PER_LEVEL) {
          log(`  Skip ${cefrLevel}: already generated today`);
          continue;
        }

        const result = await saveSpeakingTask(supabase, cefrLevel, generationDate);
        if (result.saved) {
          tasksGenerated += 1;
          log(`  ✓ ${cefrLevel}`);
        }
      } catch (err) {
        tasksFailed += 1;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${cefrLevel}: ${message}`);
        log(`  ✗ ${cefrLevel}: ${message}`);
      }
    }

    await logAgentRun(supabase, {
      runDate: generationDate,
      startedAt,
      completedAt: new Date().toISOString(),
      status: errors.length ? "partial" : "success",
      tasksGenerated,
      tasksFailed,
      errors,
      notes: "Published daily speaking launcher cards",
    });

    log(`Done — ${tasksGenerated} published, ${tasksFailed} failed`);
    return { tasksGenerated, tasksFailed, errors };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentRun(supabase, {
      runDate: generationDate,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "failed",
      tasksGenerated,
      tasksFailed: tasksFailed + 1,
      errors: [...errors, message],
    });
    throw err;
  }
}

if (require.main === module) {
  runSpeakingGeneration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[SpeakingAgent] Failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runSpeakingGeneration,
  getTodayDateKey,
};
