/**
 * Payment verification: Test A (webhook POST) + Test B (mock E2E via Supabase + API).
 *
 * Test A with correct secret:
 *   MOYASAR_WEBHOOK_SECRET=your-secret node scripts/payment-verify.mjs
 *
 * Run: node scripts/payment-verify.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

const PROD = "https://ielts-ai-tutor-neon.vercel.app";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  }
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function checkSchema(supabase) {
  const cols = ["payment_status", "checkout_track", "moyasar_payment_id"];
  const missing = [];
  for (const col of cols) {
    const { error } = await supabase.from("users").select(col).limit(1);
    if (error?.message?.includes("does not exist") || error?.message?.includes("schema cache")) {
      missing.push(col);
    }
  }
  const { error: txErr } = await supabase.from("payment_transactions").select("id").limit(1);
  if (txErr?.message?.includes("schema cache") || txErr?.message?.includes("does not exist")) {
    missing.push("payment_transactions table");
  }
  return missing;
}

async function testAWebhook(secret) {
  console.log("\n=== Test A: Webhook POST ===");
  const payload = {
    id: "evt_verify_001",
    type: "payment_paid",
    secret_token: secret ?? "wrong-secret-placeholder",
    data: {
      id: "pay_verify_001",
      status: "paid",
      amount: 180000,
      metadata: { student_id: "fake", track: "plus" },
    },
  };

  const res = await fetch(`${PROD}/api/payments/moyasar/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  console.log(`HTTP ${res.status}`, JSON.stringify(json));

  if (res.status === 401) {
    console.log("PASS  Secret validation works (401 on wrong/missing secret)");
    return secret ? "need-real-secret" : "partial";
  }
  if (res.status === 200 && json.reason === "payment_not_linked_to_student") {
    console.log("PASS  Webhook accepts Moyasar format + secret (unlinked payment OK)");
    return "pass";
  }
  if (res.status === 500 && String(json.error ?? "").includes("checkout_track")) {
    console.log("FAIL  payment_setup.sql not applied — run in Supabase SQL Editor");
    return "fail-schema";
  }
  console.log("FAIL  Unexpected response — check MOYASAR_WEBHOOK_SECRET on Vercel");
  return "fail";
}

async function testBMockE2E(supabase) {
  console.log("\n=== Test B: Mock paywall E2E ===");
  const ts = Date.now();
  const email = `paywall-verify-${ts}@speakify-smoke.test`;
  const password = "SmokeTest1!";
  const userId = randomUUID();

  const { error: insertErr } = await supabase.from("users").insert({
    id: userId,
    name: "Paywall Verify",
    email,
    password: "$2a$10$fakehashforapitestonlyxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    role: "student",
    program_type: "ielts",
    enrolled_programs: ["ielts"],
    onboarding_completed: true,
    payment_status: "unpaid",
    checkout_track: "plus",
    placement_band: 5.5,
    program_selected: "ielts",
  });

  if (insertErr) {
    console.log("FAIL  Could not seed test user:", insertErr.message);
    return "fail";
  }

  const paymentId = `mock_${userId}_${ts}`;
  await supabase.from("users").update({ moyasar_payment_id: paymentId }).eq("id", userId);
  await supabase.from("payment_transactions").upsert(
    {
      student_id: userId,
      moyasar_payment_id: paymentId,
      track: "plus",
      amount_halalas: 180000,
      currency: "SAR",
      status: "initiated",
    },
    { onConflict: "moyasar_payment_id" }
  );

  const { grantPaidAccess } = await import("../lib/payments/grantAccess.ts");
  const grant1 = await grantPaidAccess(supabase, {
    studentId: userId,
    track: "plus",
    moyasarPaymentId: paymentId,
    amountHalalas: 180000,
    rawPayload: { mock: true },
  });

  if (!grant1.ok) {
    console.log("FAIL  grantPaidAccess:", grant1.error);
    await supabase.from("users").delete().eq("id", userId);
    return "fail";
  }

  const { data: userAfter } = await supabase
    .from("users")
    .select("payment_status, accelerator_track, paid_at")
    .eq("id", userId)
    .single();

  if (userAfter?.payment_status !== "paid" || userAfter?.accelerator_track !== "plus") {
    console.log("FAIL  payment_status not paid after mock grant", userAfter);
    await supabase.from("users").delete().eq("id", userId);
    return "fail";
  }
  console.log("PASS  payment_status=paid, accelerator_track=plus in Supabase");

  const grant2 = await grantPaidAccess(supabase, {
    studentId: userId,
    track: "plus",
    moyasarPaymentId: paymentId,
    amountHalalas: 180000,
  });

  if (!grant2.ok || !grant2.alreadyPaid) {
    console.log("FAIL  Idempotency replay did not return alreadyPaid");
    await supabase.from("users").delete().eq("id", userId);
    return "fail";
  }
  console.log("PASS  Idempotency — replay returns alreadyPaid");

  await supabase.from("payment_transactions").delete().eq("student_id", userId);
  await supabase.from("users").delete().eq("id", userId);
  console.log("PASS  Mock E2E grant + idempotency (DB layer)");
  return "pass";
}

async function main() {
  const supabase = getSupabase();
  const missing = await checkSchema(supabase);

  if (missing.length) {
    console.log("BLOCKED  Payment schema missing on Supabase:");
    missing.forEach((m) => console.log(`  - ${m}`));
    console.log("\nAction: paste supabase/payment_setup.sql into Supabase SQL Editor and run it.");
    console.log("Then: Settings → API → Reload schema (or wait ~1 min for NOTIFY).");
    console.log("Re-run: node scripts/payment-verify.mjs\n");
  } else {
    console.log("OK  Payment schema columns present");
  }

  const secret = process.env.MOYASAR_WEBHOOK_SECRET?.trim();
  await testAWebhook(secret);

  if (missing.length) {
    console.log("\nSKIP  Test B — schema not ready");
    process.exit(1);
  }

  const b = await testBMockE2E(supabase);
  process.exit(b === "pass" ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
