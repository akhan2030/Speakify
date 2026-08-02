/**
 * Stage 2 evidence: programme-scoped purchases + GT Accelerator entitlement.
 * Run: npx tsx scripts/proof-gt-mock-access-stage2.mts
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  fetchPurchasedMockNumbers,
  hasAllGeneralMockAccess,
  hasMockExamStartAccessForProgramme,
  type MockAccessUser,
} from "../lib/mock-test/mockAccess.ts";

dotenv.config({ path: ".env.local", quiet: true });

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asAccessUser(row: {
  payment_status?: string | null;
  purchase_intent?: string | null;
  enrolled_programs?: unknown;
  program_selected?: string | null;
}): MockAccessUser {
  return {
    role: "student",
    paymentStatus: row.payment_status,
    purchaseIntent: row.purchase_intent,
    enrolledPrograms: row.enrolled_programs,
    programSelected: row.program_selected,
  };
}

async function main() {
  const sb = getSupabase();

  const { data: rows } = await sb
    .from("mock_exam_purchases")
    .select("programme")
    .limit(500);
  const counts: Record<string, number> = {};
  for (const r of rows ?? []) {
    const p = String(r.programme ?? "null");
    counts[p] = (counts[p] ?? 0) + 1;
  }
  console.log("purchase rows by programme:", counts);

  const { data: pack3 } = await sb
    .from("users")
    .select(
      "id,email,enrolled_programs,payment_status,purchase_intent,program_selected"
    )
    .eq("email", "mock.pack3.clean@speakify.test")
    .maybeSingle();

  const { data: gt } = await sb
    .from("users")
    .select(
      "id,email,enrolled_programs,payment_status,purchase_intent,program_selected"
    )
    .eq("email", "gt.routing.regression@speakify.test")
    .maybeSingle();

  if (!pack3?.id || !gt?.id) {
    console.error("Missing pack3 or GT test user");
    process.exit(1);
  }

  const pack3Ielts = await fetchPurchasedMockNumbers(sb, pack3.id, "ielts");
  const pack3Gt = await fetchPurchasedMockNumbers(
    sb,
    pack3.id,
    "ielts_general"
  );
  const gtIelts = await fetchPurchasedMockNumbers(sb, gt.id, "ielts");
  const gtGt = await fetchPurchasedMockNumbers(sb, gt.id, "ielts_general");

  const pack3User = asAccessUser(pack3);
  const gtUser = asAccessUser(gt);

  const results = {
    pack3AcademicPurchases: pack3Ielts,
    pack3GtPurchases: pack3Gt,
    gtAcademicPurchases: gtIelts,
    gtGtPurchases: gtGt,
    gtHasAllGeneral: hasAllGeneralMockAccess(gtUser),
    gtCanStart1: hasMockExamStartAccessForProgramme(
      gtUser,
      "ielts_general",
      1,
      gtGt
    ),
    gtCanStart4: hasMockExamStartAccessForProgramme(
      gtUser,
      "ielts_general",
      4,
      gtGt
    ),
    pack3CanStartGt1WithAcademicPurchases: hasMockExamStartAccessForProgramme(
      pack3User,
      "ielts_general",
      1,
      pack3Ielts
    ),
  };

  console.log(JSON.stringify(results, null, 2));

  const allPassed =
    pack3Ielts.length > 0 &&
    pack3Gt.length === 0 &&
    results.gtHasAllGeneral === true &&
    results.gtCanStart1 === true &&
    results.gtCanStart4 === false &&
    results.pack3CanStartGt1WithAcademicPurchases === false;

  console.log("allPassed:", allPassed);
  if (!allPassed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
