/**
 * Waits for accelerator_mock_tests table, then runs all 3 accelerator agents.
 * Run: node scripts/runAcceleratorsWhenReady.js
 *
 * While this runs, paste supabase/accelerator_content_setup.sql into Supabase SQL Editor.
 */
const { spawn } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

const ROOT = path.join(__dirname, "..");
const MAX_WAIT_MS = 30 * 60 * 1000;
const POLL_MS = 8000;

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function tableReady() {
  const supabase = getSupabase();
  const { error } = await supabase.from("accelerator_mock_tests").select("id").limit(1);
  return !error;
}

function runAgent(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Starting ${script}...`);
    const child = spawn("node", [path.join(ROOT, "agent", script)], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("========================================");
  console.log("Accelerator agents — waiting for DB tables");
  console.log("If tables are missing, run this in Supabase SQL Editor:");
  console.log("  supabase/accelerator_content_setup.sql");
  console.log("========================================");

  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    if (await tableReady()) {
      console.log("\n✓ accelerator_mock_tests table found — starting agents\n");
      await runAgent("acceleratorFoundationAgent.js");
      await runAgent("acceleratorPlusAgent.js");
      await runAgent("acceleratorEliteAgent.js");
      console.log("\n========================================");
      console.log("All 3 accelerator agents finished.");
      console.log("========================================");
      return;
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`[${elapsed}s] Table not ready yet — waiting... (run SQL in Supabase)`);
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  console.error("\nTimed out after 30 minutes. Run supabase/accelerator_content_setup.sql first.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
