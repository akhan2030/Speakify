/**
 * Speaking agent — invoked by masterScheduler at 4:00 AM
 * TODO: implement full speaking practice bank (Part 1/2/3 prompts per CEFR level)
 * Manual: npm run agent:speaking
 */

const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const AGENT_NAME = "speaking_agent";

function log(...args) {
  console.log("[SpeakingAgent]", ...args);
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
  const note = "Speaking practice bank agent not yet implemented — skipped";

  log("========================================");
  log("Speakify Speaking Agent — AI Practice Bank");
  log(`Date: ${generationDate}`);
  log(`Status: ${note}`);
  log("========================================");

  if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
    await logAgentRun(getSupabase(), {
      runDate: generationDate,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "skipped",
      tasksGenerated: 0,
      tasksFailed: 0,
      notes: note,
    });
  }

  return { tasksGenerated: 0, tasksFailed: 0, errors: [] };
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
