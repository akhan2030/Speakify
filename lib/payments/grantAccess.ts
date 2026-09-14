import type { SupabaseClient } from "@supabase/supabase-js";
import type { AcceleratorTrackId } from "@/lib/accelerator/tracks";
import { isValidTrack } from "@/lib/accelerator/tracks";
import { targetBandNumericFromTrack } from "@/lib/accelerator/tracks";
import {
  ensureOrientationEntitlement,
  ensureTopicEntitlements,
} from "@/lib/live-classes/store";

export type GrantPaidAccessInput = {
  studentId: string;
  track: AcceleratorTrackId;
  moyasarPaymentId: string;
  amountHalalas: number;
  rawPayload?: unknown;
};

/**
 * Idempotent: if moyasar_payment_id already paid, returns without changes.
 */
export async function grantPaidAccess(
  supabase: SupabaseClient,
  input: GrantPaidAccessInput
): Promise<{ ok: true; alreadyPaid: boolean } | { ok: false; error: string }> {
  const track = input.track;
  if (!isValidTrack(track)) {
    return { ok: false, error: "Invalid track" };
  }

  const paymentId = String(input.moyasarPaymentId).trim();
  if (!paymentId) {
    return { ok: false, error: "Missing payment id" };
  }

  const { data: existingTx } = await supabase
    .from("payment_transactions")
    .select("id, status")
    .eq("moyasar_payment_id", paymentId)
    .maybeSingle();

  if (existingTx?.status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  const now = new Date().toISOString();
  const targetBand = targetBandNumericFromTrack(track);

  const { error: userError } = await supabase
    .from("users")
    .update({
      payment_status: "paid",
      paid_at: now,
      accelerator_track: track,
      checkout_track: track,
      moyasar_payment_id: paymentId,
      target_band: targetBand,
      // Clear mock-only so hasAllAcademicMockAccess treats them as full Accelerator.
      purchase_intent: "accelerator",
    })
    .eq("id", input.studentId);

  if (userError) {
    return { ok: false, error: userError.message };
  }

  if (existingTx) {
    await supabase
      .from("payment_transactions")
      .update({
        status: "paid",
        raw_payload: input.rawPayload ?? null,
      })
      .eq("moyasar_payment_id", paymentId);
  } else {
    await supabase.from("payment_transactions").insert({
      student_id: input.studentId,
      moyasar_payment_id: paymentId,
      track,
      amount_halalas: input.amountHalalas,
      currency: "SAR",
      status: "paid",
      raw_payload: input.rawPayload ?? null,
    });
  }

  const { data: paidUser } = await supabase
    .from("users")
    .select(
      "enrolled_programs, program_selected, program_type, accelerator_track, checkout_track, payment_status, cefr_level"
    )
    .eq("id", input.studentId)
    .maybeSingle();

  if (paidUser) {
    await ensureOrientationEntitlement(supabase, input.studentId);
    await ensureTopicEntitlements(supabase, input.studentId, {
      enrolledPrograms: paidUser.enrolled_programs,
      programSelected: paidUser.program_selected,
      programType: paidUser.program_type,
      acceleratorTrack: paidUser.accelerator_track,
      checkoutTrack: paidUser.checkout_track,
      paymentStatus: paidUser.payment_status,
      cefrLevel: paidUser.cefr_level,
    });
  }

  try {
    const { enrollStudentInLevel } = await import("@/lib/course/enrollment.js");
    const enrollResult = await enrollStudentInLevel({
      studentId: input.studentId,
      levelSlug: track,
      targetBand,
      overallBand: null,
      placementAttemptId: null,
    });
    if (!enrollResult.ok) {
      console.warn("[payments/grantAccess] enrollment:", enrollResult.error);
    }
  } catch (err) {
    console.warn("[payments/grantAccess] enrollment failed:", err);
  }

  return { ok: true, alreadyPaid: false };
}
