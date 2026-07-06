/**
 * Comp student accounts (permanent or time-limited free access).
 *
 *   node scripts/comp-student.mjs email@example.com              # permanent
 *   node scripts/comp-student.mjs email@example.com --days 90    # expires in 90 days
 *   node scripts/comp-student.mjs --batch                        # permanent batch list
 *   node scripts/list-comp-expiring.mjs                          # comps expiring within 7 days
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

const BATCH_EMAILS = [
  "fatima.emad.almethkal@gmail.com",
  "admin@speakify.com",
  "demo.onboarding@speakify.com",
  "abdurehman.khan@speakify.test",
];

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseArgs(argv) {
  const emails = [];
  let days = null;

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--days" && argv[i + 1]) {
      days = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i] === "--batch") {
      return { mode: "batch", days: null };
    } else if (!argv[i].startsWith("--")) {
      emails.push(argv[i]);
    }
  }

  return { mode: emails.length ? "emails" : "batch", emails, days };
}

function compUntilIso(days) {
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + days);
  until.setUTCHours(23, 59, 59, 999);
  return until.toISOString();
}

async function compEmail(supabase, email, days) {
  const normalized = email.trim().toLowerCase();
  const { data: user, error: findError } = await supabase
    .from("users")
    .select("id, email, name, checkout_track, accelerator_track")
    .eq("email", normalized)
    .maybeSingle();

  if (findError) {
    console.error(`FAIL ${normalized}: ${findError.message}`);
    return false;
  }
  if (!user) {
    console.warn(`SKIP ${normalized}: not found — register first, then re-run`);
    return false;
  }

  const track = user.checkout_track || user.accelerator_track || null;
  const paymentCompedUntil =
    days != null && Number.isFinite(days) && days > 0 ? compUntilIso(days) : null;

  const { error } = await supabase
    .from("users")
    .update({
      payment_status: "comped",
      payment_comped_until: paymentCompedUntil,
      ...(track ? { accelerator_track: track, checkout_track: track } : {}),
    })
    .eq("id", user.id);

  if (error) {
    console.error(`FAIL ${normalized}: ${error.message}`);
    return false;
  }

  if (track) {
    try {
      const { enrollStudentInLevel } = await import("../lib/course/enrollment.js");
      const result = await enrollStudentInLevel({
        studentId: user.id,
        levelSlug: track,
        targetBand: null,
        overallBand: null,
        placementAttemptId: null,
      });
      if (!result.ok) {
        console.warn(`WARN ${normalized}: enrollment — ${result.error}`);
      }
    } catch (err) {
      console.warn(`WARN ${normalized}: enrollment skipped (${err.message || err})`);
    }
  }

  if (paymentCompedUntil) {
    console.log(`OK  ${normalized} → comped until ${paymentCompedUntil.slice(0, 10)} (${days} days)`);
  } else {
    console.log(`OK  ${normalized} → comped (permanent)`);
  }
  return true;
}

async function main() {
  const argv = process.argv.slice(2);
  const { mode, emails, days } = parseArgs(argv);
  const supabase = getSupabase();

  const targets = mode === "batch" ? BATCH_EMAILS : emails.length ? emails : BATCH_EMAILS;

  for (const email of targets) {
    await compEmail(supabase, email, days);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
