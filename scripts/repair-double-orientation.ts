/**
 * Find students with more than one counted orientation booking.
 * Optionally cancel extras (keep earliest created_at).
 *
 * Run: npx tsx scripts/repair-double-orientation.ts
 * Repair: npx tsx scripts/repair-double-orientation.ts --apply
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const FILL = ["reserved", "confirmed", "completed"];
const apply = process.argv.includes("--apply");

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("live_class_bookings")
    .select("id, student_id, status, starts_at, session_id")
    .eq("session_type", "orientation")
    .in("status", FILL);

  if (error) throw new Error(error.message);

  const byStudent = new Map<string, typeof data>();
  for (const row of data ?? []) {
    const list = byStudent.get(row.student_id) ?? [];
    list.push(row);
    byStudent.set(row.student_id, list);
  }

  const doubles = [...byStudent.entries()].filter(([, rows]) => (rows ?? []).length > 1);
  const cancelledIds: string[] = [];

  for (const [studentId, rows] of doubles) {
    const keep = rows[0];
    const extras = rows.slice(1);
    if (apply) {
      for (const extra of extras) {
        const { error: cancelError } = await supabase
          .from("live_class_bookings")
          .update({ status: "cancelled" })
          .eq("id", extra.id);
        if (cancelError) throw new Error(cancelError.message);
        cancelledIds.push(extra.id);
      }
    }
    console.log(
      JSON.stringify({
        studentId,
        keep: { id: keep.id, starts: keep.starts_at },
        extras: extras.map((e) => ({ id: e.id, starts: e.starts_at })),
      })
    );
  }

  console.log(
    JSON.stringify({
      apply,
      studentsWithMultipleActiveOrientations: doubles.length,
      extraBookings: doubles.reduce((n, [, rows]) => n + rows.length - 1, 0),
      cancelledNow: cancelledIds.length,
      totalActiveOrientationRows: (data ?? []).length,
    })
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
