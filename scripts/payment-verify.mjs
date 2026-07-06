/**
 * Payment verification suite (prod Supabase + prod webhook).
 *
 *   node scripts/payment-verify.mjs
 *   MOYASAR_WEBHOOK_SECRET=xxx node scripts/payment-verify.mjs
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

/** Mirrors grantPaidAccess idempotency for script use (no TS import). */
async function grantPaidAccessScript(supabase, { studentId, track, paymentId, amountHalalas }) {
  const { data: existingTx } = await supabase
    .from("payment_transactions")
    .select("id, status")
    .eq("moyasar_payment_id", paymentId)
    .maybeSingle();

  if (existingTx?.status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  const now = new Date().toISOString();
  const targetBand = track === "elite" ? 7.0 : track === "plus" ? 6.5 : 5.5;

  const { error: userError } = await supabase
    .from("users")
    .update({
      payment_status: "paid",
      paid_at: now,
      accelerator_track: track,
      checkout_track: track,
      moyasar_payment_id: paymentId,
      target_band: targetBand,
    })
    .eq("id", studentId);

  if (userError) return { ok: false, error: userError.message };

  if (existingTx) {
    await supabase
      .from("payment_transactions")
      .update({ status: "paid" })
      .eq("moyasar_payment_id", paymentId);
  } else {
    await supabase.from("payment_transactions").insert({
      student_id: studentId,
      moyasar_payment_id: paymentId,
      track,
      amount_halalas: amountHalalas,
      currency: "SAR",
      status: "paid",
    });
  }

  return { ok: true, alreadyPaid: false };
}

async function postWebhook(payload) {
  const res = await fetch(`${PROD}/api/payments/moyasar/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function testAWebhookUnlinked(secret) {
  console.log("\n=== Test A: Webhook POST (unlinked payment) ===");
  const payload = {
    id: `evt_unlinked_${Date.now()}`,
    type: "payment_paid",
    secret_token: secret ?? "wrong-secret-placeholder",
    data: {
      id: `pay_unlinked_${Date.now()}`,
      status: "paid",
      amount: 180000,
      metadata: { student_id: randomUUID(), track: "plus" },
    },
  };

  const { status, json } = await postWebhook(payload);
  console.log(`HTTP ${status}`, JSON.stringify(json));

  if (status === 401) {
    console.log("PASS  Secret validation (401 on bad secret)");
    return "pass";
  }
  if (status === 200 && (json.acknowledged === true || json.reason === "student_not_found")) {
    console.log("PASS  Webhook accepts Moyasar format (no grant for unknown student)");
    return "pass";
  }
  if (status === 200 && json.reason === "payment_not_linked_to_student") {
    console.log("PASS  Webhook accepts Moyasar format (unlinked payment OK)");
    return "pass";
  }
  console.log("FAIL  Unexpected webhook response");
  return "fail";
}

async function testIdempotencyWebhook(supabase, secret) {
  console.log("\n=== Test C: Webhook idempotency (replay) ===");
  if (!secret) {
    console.log("SKIP  Set MOYASAR_WEBHOOK_SECRET to test webhook idempotency on prod");
    return "skip";
  }

  const userId = randomUUID();
  const paymentId = `pay_idem_${Date.now()}`;
  const email = `idem-${Date.now()}@speakify-smoke.test`;

  const { error: insertErr } = await supabase.from("users").insert({
    id: userId,
    name: "Idem Test",
    email,
    password: "$2a$10$fakehashforapitestonlyxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    role: "student",
    program_type: "ielts",
    enrolled_programs: ["ielts"],
    onboarding_completed: true,
    payment_status: "unpaid",
    checkout_track: "plus",
    moyasar_payment_id: paymentId,
    program_selected: "ielts",
  });
  if (insertErr) {
    console.log("FAIL  seed user:", insertErr.message);
    return "fail";
  }

  await supabase.from("payment_transactions").insert({
    student_id: userId,
    moyasar_payment_id: paymentId,
    track: "plus",
    amount_halalas: 180000,
    currency: "SAR",
    status: "initiated",
  });

  const payload = {
    id: `evt_idem_${Date.now()}`,
    type: "payment_paid",
    secret_token: secret,
    data: {
      id: paymentId,
      status: "paid",
      amount: 180000,
      metadata: { student_id: userId, track: "plus" },
    },
  };

  const first = await postWebhook(payload);
  console.log(`First POST  HTTP ${first.status}`, JSON.stringify(first.json));

  const { count: txCount1 } = await supabase
    .from("payment_transactions")
    .select("id", { count: "exact", head: true })
    .eq("moyasar_payment_id", paymentId)
    .eq("status", "paid");

  if (first.status !== 200 || !first.json.ok) {
    console.log("FAIL  First webhook did not succeed");
    await cleanup(supabase, userId, paymentId);
    return "fail";
  }

  const second = await postWebhook({ ...payload, id: `evt_idem_replay_${Date.now()}` });
  console.log(`Replay POST HTTP ${second.status}`, JSON.stringify(second.json));

  const { count: txCount2 } = await supabase
    .from("payment_transactions")
    .select("id", { count: "exact", head: true })
    .eq("moyasar_payment_id", paymentId)
    .eq("status", "paid");

  const idempotent =
    second.json.alreadyPaid === true &&
    txCount1 === txCount2 &&
    txCount2 === 1;

  if (idempotent) {
    console.log("PASS  Replay returned alreadyPaid=true, single paid transaction row");
  } else {
    console.log("FAIL  Idempotency broken", { txCount1, txCount2, second: second.json });
  }

  await cleanup(supabase, userId, paymentId);
  return idempotent ? "pass" : "fail";
}

async function cleanup(supabase, userId, paymentId) {
  await supabase.from("payment_transactions").delete().eq("moyasar_payment_id", paymentId);
  await supabase.from("users").delete().eq("id", userId);
}

async function testBGrantIdempotency(supabase) {
  console.log("\n=== Test B: DB grant + idempotency ===");
  const userId = randomUUID();
  const paymentId = `mock_${userId}_${Date.now()}`;
  const email = `grant-${Date.now()}@speakify-smoke.test`;

  const { error: insertErr } = await supabase.from("users").insert({
    id: userId,
    name: "Grant Test",
    email,
    password: "$2a$10$fakehashforapitestonlyxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    role: "student",
    program_type: "ielts",
    enrolled_programs: ["ielts"],
    onboarding_completed: true,
    payment_status: "unpaid",
    checkout_track: "plus",
    program_selected: "ielts",
  });
  if (insertErr) {
    console.log("FAIL  seed:", insertErr.message);
    return "fail";
  }

  const g1 = await grantPaidAccessScript(supabase, {
    studentId: userId,
    track: "plus",
    paymentId,
    amountHalalas: 180000,
  });
  const { data: userAfter } = await supabase
    .from("users")
    .select("payment_status, accelerator_track")
    .eq("id", userId)
    .single();

  if (!g1.ok || userAfter?.payment_status !== "paid") {
    console.log("FAIL  grant did not set paid", g1, userAfter);
    await supabase.from("users").delete().eq("id", userId);
    return "fail";
  }
  console.log("PASS  payment_status=paid, accelerator_track=plus");

  const g2 = await grantPaidAccessScript(supabase, {
    studentId: userId,
    track: "plus",
    paymentId,
    amountHalalas: 180000,
  });
  if (!g2.ok || !g2.alreadyPaid) {
    console.log("FAIL  replay did not return alreadyPaid");
    await supabase.from("users").delete().eq("id", userId);
    return "fail";
  }
  console.log("PASS  Idempotency — replay returns alreadyPaid");

  await supabase.from("payment_transactions").delete().eq("student_id", userId);
  await supabase.from("users").delete().eq("id", userId);
  return "pass";
}

async function testRegisterLoophole(supabase) {
  console.log("\n=== Test D: ?track= registration loophole ===");
  const ts = Date.now();
  const email = `loophole-${ts}@speakify-smoke.test`;
  const res = await fetch(`${PROD}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      programType: "ielts",
      registrationSlug: "ielts",
      acceleratorTrack: "elite",
      courseSlug: "ielts-elite",
      fullName: "Loophole Test",
      email,
      phone: "+966501234567",
      password: "SmokeTest1!",
      confirmPassword: "SmokeTest1!",
      termsAccepted: true,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.userId) {
    console.log("FAIL  register:", json);
    return "fail";
  }

  const { data: user } = await supabase
    .from("users")
    .select("accelerator_track, checkout_track, payment_status")
    .eq("id", json.userId)
    .single();

  const ok =
    user?.checkout_track === "elite" &&
    user?.payment_status === "unpaid" &&
    (user?.accelerator_track == null || user?.accelerator_track === "");

  if (ok) {
    console.log("PASS  elite URL sets checkout_track only, not accelerator_track, unpaid");
  } else {
    console.log("FAIL  loophole still open", user);
  }

  await supabase.from("users").delete().eq("id", json.userId);
  return ok ? "pass" : "fail";
}

async function main() {
  const supabase = getSupabase();
  const missing = await checkSchema(supabase);
  const secret = process.env.MOYASAR_WEBHOOK_SECRET?.trim();

  if (missing.length) {
    console.log("BLOCKED  Payment schema missing:", missing.join(", "));
    process.exit(1);
  }
  console.log("OK  Payment schema columns present");

  const results = [];
  results.push(await testAWebhookUnlinked(secret));
  results.push(await testBGrantIdempotency(supabase));
  results.push(await testIdempotencyWebhook(supabase, secret));
  results.push(await testRegisterLoophole(supabase));

  console.log("\n--- Summary ---");
  const failed = results.filter((r) => r === "fail").length;
  const passed = results.filter((r) => r === "pass").length;
  const skipped = results.filter((r) => r === "skip").length;
  console.log(`${passed} passed, ${failed} failed, ${skipped} skipped`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
