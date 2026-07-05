/**
 * Permanently comp student accounts (admin, demo, Fatima, etc.)
 *
 * Run: node scripts/comp-student.mjs fatima.emad.almethkal@gmail.com
 * Run: node scripts/comp-student.mjs --batch
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

async function compEmail(supabase, email) {
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
    console.warn(`SKIP ${normalized}: not found`);
    return false;
  }

  const track = user.checkout_track || user.accelerator_track || null;

  const { error } = await supabase
    .from("users")
    .update({
      payment_status: "comped",
      payment_comped_until: null,
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
      });
      if (!result.ok) {
        console.warn(`WARN ${normalized}: enrollment — ${result.error}`);
      }
    } catch (err) {
      console.warn(`WARN ${normalized}: enrollment failed`, err);
    }
  }

  console.log(`OK  ${normalized} → comped (permanent)`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const supabase = getSupabase();

  const emails =
    args[0] === "--batch"
      ? BATCH_EMAILS
      : args.length
        ? args
        : BATCH_EMAILS;

  for (const email of emails) {
    await compEmail(supabase, email);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
