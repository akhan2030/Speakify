/**
 * Master scheduler — orchestrates all AI Practice Bank agents
 * Manual / PM2: node agent/masterScheduler.js
 * pm2 start agent/masterScheduler.js --name speakify-agents
 */

const path = require("path");
const cron = require("node-cron");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const { runVocabularyGeneration } = require("./vocabularyAgent.js");
const { runReadingGeneration } = require("./readingAgent.js");
const { runListeningGeneration } = require("./listeningAgent.js");
const { runSpeakingGeneration } = require("./speakingAgent.js");
const { runWritingGeneration } = require("./writingAgent.js");
const { runGrammarGeneration } = require("./grammarAgent.js");
const { generateFoundationContent } = require("./acceleratorFoundationAgent.js");
const { generatePlusContent } = require("./acceleratorPlusAgent.js");
const { generateEliteContent } = require("./acceleratorEliteAgent.js");
const { runIeltsMockGeneration } = require("./ieltsMockAgent.js");

const AGENT_NAME = "master_scheduler";

const AGENT_PIPELINE = [
  {
    key: "vocabulary",
    label: "Vocabulary Agent",
    schedule: "0 3 * * *",
    run: runVocabularyGeneration,
  },
  {
    key: "reading",
    label: "Reading Agent",
    schedule: "20 3 * * *",
    run: runReadingGeneration,
  },
  {
    key: "listening",
    label: "Listening Agent",
    schedule: "40 3 * * *",
    run: runListeningGeneration,
  },
  {
    key: "speaking",
    label: "Speaking Agent",
    schedule: "0 4 * * *",
    run: runSpeakingGeneration,
  },
  {
    key: "writing",
    label: "Writing Agent",
    schedule: "20 4 * * *",
    run: runWritingGeneration,
  },
  {
    key: "grammar",
    label: "Grammar Agent",
    schedule: "40 4 * * *",
    run: runGrammarGeneration,
  },
  {
    key: "accelerator_foundation",
    label: "Accelerator Foundation Agent",
    schedule: "0 5 * * *",
    run: generateFoundationContent,
  },
  {
    key: "accelerator_plus",
    label: "Accelerator Plus Agent",
    schedule: "30 5 * * *",
    run: generatePlusContent,
  },
  {
    key: "accelerator_elite",
    label: "Accelerator Elite Agent",
    schedule: "30 6 * * *",
    run: generateEliteContent,
  },
  {
    key: "ielts_mock",
    label: "IELTS Full Mock Agent",
    schedule: "0 6 * * *",
    run: runIeltsMockGeneration,
  },
];

/** @type {{ date: string, results: Array<object>, totalGenerated: number, totalFailed: number }} */
let dailySummary = {
  date: null,
  results: [],
  totalGenerated: 0,
  totalFailed: 0,
};

function log(...args) {
  console.log("[MasterScheduler]", ...args);
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

function resetDailySummaryIfNeeded(dateKey) {
  if (dailySummary.date !== dateKey) {
    dailySummary = {
      date: dateKey,
      results: [],
      totalGenerated: 0,
      totalFailed: 0,
    };
  }
}

async function logOrchestrationRun(supabase, entry) {
  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
    return;
  }

  const { error } = await supabase.from("agent_logs").insert({
    agent_name: `${AGENT_NAME}/${entry.agentKey}`,
    run_date: entry.runDate,
    started_at: entry.startedAt,
    completed_at: entry.completedAt,
    status: entry.status,
    tasks_generated: entry.tasksGenerated ?? 0,
    tasks_failed: entry.tasksFailed ?? 0,
    errors: entry.errors?.length ? entry.errors : null,
    notes: entry.notes ?? null,
  });

  if (error) {
    console.error(
      `[MasterScheduler] agent_logs insert failed (${entry.agentKey}):`,
      error.message
    );
  }
}

function printAgentSummary(agent, result, startedAt, completedAt, errorMessage) {
  const tasksGenerated = result?.tasksGenerated ?? 0;
  const tasksFailed = result?.tasksFailed ?? 0;
  const errors = errorMessage
    ? [errorMessage]
    : Array.isArray(result?.errors)
      ? result.errors
      : [];

  log("----------------------------------------");
  log(`${agent.label} — ${errorMessage ? "FAILED" : "COMPLETE"}`);
  log(`  Started:   ${startedAt}`);
  log(`  Finished:  ${completedAt}`);
  log(`  Generated: ${tasksGenerated}`);
  log(`  Failed:    ${tasksFailed}`);
  if (errors.length > 0) {
    log(`  Errors:`);
    for (const err of errors.slice(0, 5)) {
      log(`    - ${err}`);
    }
    if (errors.length > 5) {
      log(`    ... and ${errors.length - 5} more`);
    }
  }
  log("----------------------------------------");
}

function printDailySummary() {
  const completed = dailySummary.results.filter((r) => r.status !== "pending");
  if (completed.length === 0) return;

  const timestamp = new Date().toISOString();
  log("========================================");
  log("DAILY SUMMARY — AI Practice Bank Agents");
  log(`Date: ${dailySummary.date}`);
  log(`Timestamp: ${timestamp}`);
  log(`Total tasks generated: ${dailySummary.totalGenerated}`);
  log(`Total tasks failed:    ${dailySummary.totalFailed}`);
  log("Agent breakdown:");

  for (const row of dailySummary.results) {
    const icon = row.status === "success" ? "✓" : row.status === "partial" ? "~" : "✗";
    log(
      `  ${icon} ${row.label}: ${row.tasksGenerated} generated, ${row.tasksFailed} failed`
    );
    if (row.errorMessage) {
      log(`      Error: ${row.errorMessage}`);
    } else if (row.errors?.length) {
      log(`      Errors: ${row.errors.slice(0, 2).join("; ")}`);
    }
  }

  const allErrors = dailySummary.results.flatMap((r) =>
    r.errorMessage ? [r.errorMessage] : r.errors ?? []
  );
  if (allErrors.length > 0) {
    log(`Errors today (${allErrors.length}):`);
    for (const err of allErrors.slice(0, 8)) {
      log(`  - ${err}`);
    }
  } else {
    log("No errors today.");
  }

  log("========================================");
}

async function logDailySummaryToDb(supabase) {
  const allDone = dailySummary.results.every((r) => r.status !== "pending");
  if (!allDone) return;

  const allErrors = dailySummary.results.flatMap((r) =>
    r.errorMessage ? [r.errorMessage] : r.errors ?? []
  );

  await logOrchestrationRun(supabase, {
    agentKey: "daily_summary",
    runDate: dailySummary.date,
    startedAt: dailySummary.results[0]?.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: allErrors.length ? "partial" : "success",
    tasksGenerated: dailySummary.totalGenerated,
    tasksFailed: dailySummary.totalFailed,
    errors: allErrors.length ? allErrors : null,
    notes: dailySummary.results
      .map((r) => `${r.key}: ${r.tasksGenerated}/${r.tasksFailed}`)
      .join(", "),
  });
}

async function runAgent(agent, trigger) {
  const runDate = getTodayDateKey();
  resetDailySummaryIfNeeded(runDate);

  const startedAt = new Date().toISOString();
  log(`Starting ${agent.label} (${trigger}) at ${startedAt}`);

  const summaryRow = {
    key: agent.key,
    label: agent.label,
    status: "pending",
    startedAt,
    tasksGenerated: 0,
    tasksFailed: 0,
    errors: [],
    errorMessage: null,
  };
  dailySummary.results.push(summaryRow);

  let supabase = null;
  try {
    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      supabase = getSupabase();
    }

    const result = await agent.run();
    const completedAt = new Date().toISOString();

    summaryRow.status =
      result?.errors?.length || (result?.tasksFailed ?? 0) > 0
        ? "partial"
        : "success";
    summaryRow.tasksGenerated = result?.tasksGenerated ?? 0;
    summaryRow.tasksFailed = result?.tasksFailed ?? 0;
    summaryRow.errors = result?.errors ?? [];
    summaryRow.completedAt = completedAt;

    dailySummary.totalGenerated += summaryRow.tasksGenerated;
    dailySummary.totalFailed += summaryRow.tasksFailed;

    printAgentSummary(agent, result, startedAt, completedAt, null);

    if (supabase) {
      await logOrchestrationRun(supabase, {
        agentKey: agent.key,
        runDate,
        startedAt,
        completedAt,
        status: summaryRow.status,
        tasksGenerated: summaryRow.tasksGenerated,
        tasksFailed: summaryRow.tasksFailed,
        errors: summaryRow.errors,
        notes: `trigger=${trigger}`,
      });
    }

    if (agent.key === "grammar") {
      printDailySummary();
      if (supabase) await logDailySummaryToDb(supabase);
    }

    return result;
  } catch (err) {
    const completedAt = new Date().toISOString();
    const message = err instanceof Error ? err.message : String(err);

    summaryRow.status = "failed";
    summaryRow.errorMessage = message;
    summaryRow.errors = [message];
    summaryRow.completedAt = completedAt;
    summaryRow.tasksFailed += 1;
    dailySummary.totalFailed += 1;

    printAgentSummary(agent, null, startedAt, completedAt, message);
    log(`Continuing pipeline — ${agent.label} failed but next agents will still run.`);

    if (supabase) {
      await logOrchestrationRun(supabase, {
        agentKey: agent.key,
        runDate,
        startedAt,
        completedAt,
        status: "failed",
        tasksGenerated: 0,
        tasksFailed: 1,
        errors: [message],
        notes: `trigger=${trigger}`,
      });
    }

    if (agent.key === "grammar") {
      printDailySummary();
      if (supabase) await logDailySummaryToDb(supabase);
    }

    return { tasksGenerated: 0, tasksFailed: 1, errors: [message] };
  }
}

/** Run all agents back-to-back (manual test / catch-up) */
async function runAllAgentsNow(trigger = "manual-all") {
  log("========================================");
  log("Running full agent pipeline sequentially");
  log("========================================");

  for (const agent of AGENT_PIPELINE) {
    await runAgent(agent, trigger);
  }
}

function registerCronJobs() {
  for (const agent of AGENT_PIPELINE) {
    cron.schedule(agent.schedule, () => {
      runAgent(agent, "cron").catch((err) => {
        console.error(
          `[MasterScheduler] Unhandled error in ${agent.key}:`,
          err.message
        );
      });
    });
    log(`Scheduled ${agent.label}: ${agent.schedule}`);
  }
}

if (require.main === module) {
  log("Speakify Master Scheduler — AI Practice Bank");
  log("Pipeline: Vocabulary → Reading → Listening → Speaking → Writing → Grammar → Accelerator (Foundation/Plus/Elite) → IELTS Mock");
  registerCronJobs();

  if (process.env.MASTER_RUN_ALL === "1") {
    runAllAgentsNow("manual-all")
      .then(() => process.exit(0))
      .catch((err) => {
        console.error("[MasterScheduler] Manual run failed:", err.message);
        process.exit(1);
      });
  } else {
    log("Process alive — waiting for cron triggers (3:00–6:00 AM daily)");
    log("Set MASTER_RUN_ALL=1 to run all agents immediately on startup");
  }
}

module.exports = {
  runAgent,
  runAllAgentsNow,
  registerCronJobs,
  AGENT_PIPELINE,
  getTodayDateKey,
};
