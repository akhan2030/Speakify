import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import { grantMockAccess } from "@/lib/payments/grantMockAccess";
import { isMoyasarMockMode } from "@/lib/payments/moyasar";
import {
  mockProductFromPaymentProductType,
  type MockPaymentProductType,
} from "@/lib/mock-test/academicMockCatalog";
import { fetchPurchasedMockNumbers } from "@/lib/mock-test/mockAccess";

export const runtime = "nodejs";

const MOCK_LOBBY = "/dashboard/ielts/student/mock-exam";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Dev/mock only — simulates successful mock exam payment. */
export async function POST(request: Request) {
  if (!isMoyasarMockMode()) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = String(body.paymentId ?? "").trim();
    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("product_type, mock_numbers, amount_halalas, status")
      .eq("moyasar_payment_id", paymentId)
      .eq("student_id", studentId)
      .maybeSingle();

    const productType = String(tx?.product_type ?? "").trim() as MockPaymentProductType;
    if (!mockProductFromPaymentProductType(productType)) {
      return NextResponse.json({ error: "Not a mock exam payment" }, { status: 400 });
    }

    const mockNumbers = (tx?.mock_numbers ?? [])
      .map((n: number) => Number(n))
      .filter((n: number) => Number.isInteger(n));

    const result = await grantMockAccess(supabase, {
      studentId,
      moyasarPaymentId: paymentId,
      amountHalalas: Number(tx?.amount_halalas) || 0,
      productType,
      mockNumbers,
      rawPayload: { mock: true, paymentId },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const purchased = await fetchPurchasedMockNumbers(supabase, studentId);

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      purchasedMockNumbers: purchased,
      redirect: MOCK_LOBBY,
    });
  } catch (err) {
    console.error("[payments/mock-status POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Mock payment failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = String(searchParams.get("paymentId") ?? "").trim();

    const supabase = getSupabase();
    const purchasedMockNumbers = await fetchPurchasedMockNumbers(supabase, studentId);

    let paymentConfirmed = false;
    if (paymentId) {
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("status, product_type, mock_numbers")
        .eq("moyasar_payment_id", paymentId)
        .eq("student_id", studentId)
        .maybeSingle();
      paymentConfirmed = tx?.status === "paid";
    }

    return NextResponse.json({
      ok: true,
      role,
      purchasedMockNumbers,
      paymentConfirmed,
      hasPurchases: purchasedMockNumbers.length > 0,
      redirect: MOCK_LOBBY,
      mockMode: isMoyasarMockMode(),
    });
  } catch (err) {
    console.error("[payments/mock-status GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load mock payment status" },
      { status: 500 }
    );
  }
}
