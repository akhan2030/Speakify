/**
 * Sync selected env vars from .env.local → Vercel (non-interactive).
 * Usage: node scripts/sync-vercel-env.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const ROOT = process.cwd();
const ENV_LOCAL = path.join(ROOT, ".env.local");
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

const VARS_TO_SYNC = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "TWILIO_SMS_FROM",
];

const ALL_ENVS = ["production", "preview", "development"];

function loadLocalEnv() {
  if (!fs.existsSync(ENV_LOCAL)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const parsed = dotenv.parse(fs.readFileSync(ENV_LOCAL));
  return parsed;
}

function runVercel(args, stdinValue) {
  return new Promise((resolve, reject) => {
    const child = spawn(NPX, ["vercel", ...args], {
      cwd: ROOT,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `exit ${code}`));
        return;
      }
      resolve(stdout);
    });

    if (stdinValue != null) {
      child.stdin.write(stdinValue);
    }
    child.stdin.end();
  });
}

async function listVercelEnv() {
  const out = await runVercel(["env", "ls"]);
  /** @type {Map<string, Set<string>>} */
  const map = new Map();

  for (const line of out.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("name") || trimmed.startsWith("Common")) continue;
    const parts = trimmed.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) continue;
    const [name, , environment] = parts;
    if (!VARS_TO_SYNC.includes(name)) continue;
    const envKey = environment.toLowerCase();
    if (!ALL_ENVS.includes(envKey)) continue;
    if (!map.has(name)) map.set(name, new Set());
    map.get(name).add(envKey);
  }

  return map;
}

async function addEnvVar(name, value, environment) {
  if (environment === "preview") {
    await runVercel(["env", "add", name, "preview", "--value", value, "-y"]);
    return;
  }
  await runVercel(["env", "add", name, environment, "-y"], `${value}\n`);
}

async function main() {
  const local = loadLocalEnv();
  const remote = await listVercelEnv();

  const added = [];
  const skipped = [];
  const missingLocal = [];

  for (const name of VARS_TO_SYNC) {
    const value = String(local[name] ?? "").trim();
    if (!value) {
      missingLocal.push(name);
      continue;
    }

    const present = remote.get(name) ?? new Set();
    for (const env of ALL_ENVS) {
      if (present.has(env)) {
        skipped.push(`${name}@${env} (already set)`);
        continue;
      }
      try {
        await addEnvVar(name, value, env);
        added.push(`${name}@${env}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/already exists|duplicate/i.test(msg)) {
          skipped.push(`${name}@${env} (already set)`);
        } else {
          console.error(`Failed ${name}@${env}: ${msg}`);
          process.exitCode = 1;
        }
      }
    }
  }

  console.log("\n=== Vercel env sync ===\n");
  if (added.length) {
    console.log("Added:");
    for (const row of added) console.log(`  + ${row}`);
  } else {
    console.log("Added: (none)");
  }

  if (skipped.length) {
    console.log("\nSkipped:");
    for (const row of skipped) console.log(`  - ${row}`);
  }

  if (missingLocal.length) {
    console.log("\nNot in .env.local (add locally first, then re-run):");
    for (const name of missingLocal) console.log(`  ? ${name}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
