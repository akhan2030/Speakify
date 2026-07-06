/**
 * List comped accounts with expiry dates (permanent comps excluded).
 *
 *   node scripts/list-comp-expiring.mjs          # expiring within 7 days
 *   node scripts/list-comp-expiring.mjs --days 30
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

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

async function main() {
  const windowDays = Number(process.argv.find((a, i) => process.argv[i - 1] === "--days") ?? 7);
  const supabase = getSupabase();
  const now = Date.now();
  const horizon = now + windowDays * 24 * 60 * 60 * 1000;

  const { data, error } = await supabase
    .from("users")
    .select("email, name, payment_status, payment_comped_until, checkout_track, accelerator_track")
    .eq("payment_status", "comped")
    .not("payment_comped_until", "is", null)
    .order("payment_comped_until", { ascending: true });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const rows = (data ?? []).filter((u) => {
    const t = new Date(u.payment_comped_until).getTime();
    return Number.isFinite(t) && t <= horizon;
  });

  console.log(`Comped accounts expiring within ${windowDays} days:\n`);
  if (!rows.length) {
    console.log("(none)");
    return;
  }

  for (const u of rows) {
    const until = u.payment_comped_until?.slice(0, 10) ?? "?";
    const expired = new Date(u.payment_comped_until).getTime() < now;
    const status = expired ? "EXPIRED" : "active";
    console.log(`  ${until}  [${status}]  ${u.email}  (${u.name ?? "—"})`);
  }

  const allTimed = (data ?? []).filter((u) => u.payment_comped_until);
  console.log(`\nTotal time-limited comps: ${allTimed.length}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
