/**
 * Stages 3–5 evidence: GT Moyasar grant path + catalog rules + lobby distinction.
 * Run: npx tsx scripts/proof-gt-mock-purchases-stage345.mts
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { grantMockAccess } from "../lib/payments/grantMockAccess.ts";
import {
  fetchPurchasedMockNumbers,
  hasMockExamStartAccessForProgramme,
  type MockAccessUser,
} from "../lib/mock-test/mockAccess.ts";
import {
  GT_MOCK_CATALOG,
  GT_MOCK_COUNT,
  mockNumbersForGtProduct,
  priceHalalasForGtMockProduct,
} from "../lib/ielts-general/gtMockCatalog.ts";
import {
  GT_MOCK_LOBBY_PATH,
  IELTS_MOCK_LOBBY_PATH,
} from "../lib/mock-test/ieltsMockRoutes.ts";

dotenv.config({ path: ".env.local", quiet: true });

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main() {
  const checks: { name: string; ok: boolean; detail?: string }[] = [];

  checks.push({
    name: "GT catalog sells exactly 3 mocks",
    ok: GT_MOCK_COUNT === 3 && GT_MOCK_CATALOG.length === 3,
    detail: `count=${GT_MOCK_COUNT}`,
  });

  checks.push({
    name: "GT pack3 unlocks 1–3 only",
    ok:
      JSON.stringify(mockNumbersForGtProduct("pack3")) ===
      JSON.stringify([1, 2, 3]),
  });

  checks.push({
    name: "GT pricing 169 / 349 SAR (halalas)",
    ok:
      priceHalalasForGtMockProduct("single") === 16_900 &&
      priceHalalasForGtMockProduct("pack3") === 34_900,
  });

  checks.push({
    name: "GT lobby URL distinct from Academic",
    ok:
      GT_MOCK_LOBBY_PATH === "/dashboard/ielts-general/student/mock-exam" &&
      IELTS_MOCK_LOBBY_PATH === "/dashboard/ielts/student/mock-exam" &&
      GT_MOCK_LOBBY_PATH !== IELTS_MOCK_LOBBY_PATH,
    detail: `GT=${GT_MOCK_LOBBY_PATH}`,
  });

  const sb = getSupabase();
  const email =
    process.env.GT_PROOF_EMAIL?.trim() ||
    "gt.routing.regression@speakify.test";

  const { data: user } = await sb
    .from("users")
    .select(
      "id, email, payment_status, purchase_intent, enrolled_programs, program_selected"
    )
    .eq("email", email)
    .maybeSingle();

  if (!user?.id) {
    checks.push({
      name: "GT proof user exists",
      ok: false,
      detail: `missing ${email}`,
    });
  } else {
    checks.push({
      name: "GT proof user exists",
      ok: true,
      detail: user.id,
    });

    const paymentId = `proof_gt_grant_${Date.now()}`;
    // Use mock #3 so re-runs don't collide with a prior #2 upsert (ignoreDuplicates).
    const grant = await grantMockAccess(sb, {
      studentId: user.id,
      moyasarPaymentId: paymentId,
      amountHalalas: 16_900,
      productType: "mock_single",
      mockNumbers: [3],
      programme: "ielts_general",
      rawPayload: { proof: "stage3", programme: "ielts_general" },
    });

    checks.push({
      name: "grantMockAccess writes programme=ielts_general",
      ok: grant.ok === true,
      detail: grant.ok ? `paymentId=${paymentId}` : (grant as { error: string }).error,
    });

    const gtPurchased = await fetchPurchasedMockNumbers(
      sb,
      user.id,
      "ielts_general"
    );
    const academicPurchased = await fetchPurchasedMockNumbers(
      sb,
      user.id,
      "ielts"
    );

    checks.push({
      name: "GT purchase includes mock #3",
      ok: gtPurchased.includes(3),
      detail: `gt=[${gtPurchased.join(",")}]`,
    });

    checks.push({
      name: "GT purchase does not pollute Academic list",
      ok: !academicPurchased.includes(3),
      detail: `academic=[${academicPurchased.join(",")}]`,
    });

    const { data: rows } = await sb
      .from("mock_exam_purchases")
      .select("mock_number, programme")
      .eq("moyasar_payment_id", paymentId);

    const onlyGt = (rows ?? []).every((r) => r.programme === "ielts_general");
    checks.push({
      name: "Purchase rows tagged ielts_general",
      ok: onlyGt && (rows ?? []).some((r) => Number(r.mock_number) === 3),
      detail: JSON.stringify(rows),
    });

    const accessUser: MockAccessUser = {
      role: "student",
      paymentStatus: user.payment_status,
      purchaseIntent: user.purchase_intent,
      enrolledPrograms: user.enrolled_programs,
      programSelected: user.program_selected,
    };

    const canStart3 = hasMockExamStartAccessForProgramme(
      accessUser,
      "ielts_general",
      3,
      gtPurchased
    );
    checks.push({
      name: "Access layer allows GT mock #3 after grant",
      ok: canStart3,
    });
  }

  const allPassed = checks.every((c) => c.ok);
  console.log(JSON.stringify({ allPassed, checks, lobbyUrl: GT_MOCK_LOBBY_PATH }, null, 2));
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
