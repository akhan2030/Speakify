import type { SupabaseClient } from "@supabase/supabase-js";
import type { MockPaymentProductType } from "@/lib/mock-test/academicMockCatalog";
import {
  isValidAcademicMockNumber,
  mockProductFromPaymentProductType,
} from "@/lib/mock-test/academicMockCatalog";

export type GrantMockAccessInput = {
  studentId: string;
  moyasarPaymentId: string;
  amountHalalas: number;
  productType: MockPaymentProductType;
  mockNumbers: number[];
  rawPayload?: unknown;
};

function purchaseProductType(
  productType: MockPaymentProductType
): "single" | "pack3" | "pack5" {
  const mapped = mockProductFromPaymentProductType(productType);
  if (!mapped) {
    throw new Error(`Invalid mock product type: ${productType}`);
  }
  return mapped;
}

/**
 * Idempotent mock unlock — does NOT change users.payment_status or Accelerator
 * enrollment. Inserts mock_exam_purchases rows (UNIQUE per student + mock).
 */
export async function grantMockAccess(
  supabase: SupabaseClient,
  input: GrantMockAccessInput
): Promise<{ ok: true; alreadyPaid: boolean } | { ok: false; error: string }> {
  const paymentId = String(input.moyasarPaymentId).trim();
  if (!paymentId) {
    return { ok: false, error: "Missing payment id" };
  }

  const mockNumbers = [...new Set(input.mockNumbers)].filter((n) =>
    isValidAcademicMockNumber(n)
  );

  if (mockNumbers.length === 0) {
    return { ok: false, error: "No valid mock numbers to grant" };
  }

  const { data: existingTx } = await supabase
    .from("payment_transactions")
    .select("id, status")
    .eq("moyasar_payment_id", paymentId)
    .maybeSingle();

  if (existingTx?.status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  const purchaseType = purchaseProductType(input.productType);

  if (existingTx) {
    const { error: txError } = await supabase
      .from("payment_transactions")
      .update({
        status: "paid",
        product_type: input.productType,
        mock_numbers: mockNumbers,
        amount_halalas: input.amountHalalas,
        raw_payload: input.rawPayload ?? null,
      })
      .eq("moyasar_payment_id", paymentId);

    if (txError) {
      return { ok: false, error: txError.message };
    }
  } else {
    const { error: txError } = await supabase.from("payment_transactions").insert({
      student_id: input.studentId,
      moyasar_payment_id: paymentId,
      track: null,
      product_type: input.productType,
      mock_numbers: mockNumbers,
      amount_halalas: input.amountHalalas,
      currency: "SAR",
      status: "paid",
      raw_payload: input.rawPayload ?? null,
    });

    if (txError) {
      return { ok: false, error: txError.message };
    }
  }

  for (const mockNumber of mockNumbers) {
    const { error: purchaseError } = await supabase.from("mock_exam_purchases").upsert(
      {
        student_id: input.studentId,
        mock_number: mockNumber,
        product_type: purchaseType,
        moyasar_payment_id: paymentId,
        purchased_at: new Date().toISOString(),
      },
      { onConflict: "student_id,mock_number", ignoreDuplicates: true }
    );

    if (purchaseError) {
      return { ok: false, error: purchaseError.message };
    }
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("payment_status, purchase_intent")
    .eq("id", input.studentId)
    .maybeSingle();

  const paymentStatus = String(userRow?.payment_status ?? "unpaid").toLowerCase();
  const userUpdates: Record<string, unknown> = {};

  if (paymentStatus !== "paid" && userRow?.purchase_intent !== "accelerator") {
    userUpdates.purchase_intent = "mock_only";
  }

  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from("users")
      .update(userUpdates)
      .eq("id", input.studentId);

    if (userError) {
      console.warn("[payments/grantMockAccess] user update:", userError.message);
    }
  }

  return { ok: true, alreadyPaid: false };
}
