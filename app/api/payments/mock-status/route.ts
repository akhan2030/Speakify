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
import {
  fetchPurchasedMockNumbers,
  type MockPurchaseProgramme,
} from "@/lib/mock-test/mockAccess";
import {
  GT_MOCK_LOBBY_PATH,
  IELTS_MOCK_LOBBY_PATH,
} from "@/lib/mock-test/ieltsMockRoutes";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseProgramme(value: unknown): MockPurchaseProgramme {
  return String(value ?? "").trim().toLowerCase() === "ielts_general"
    ? "ielts_general"
    : "ielts";
}

function lobbyFor(programme: MockPurchaseProgramme): string {
  return programme === "ielts_general" ? GT_MOCK_LOBBY_PATH : IELTS_MOCK_LOBBY_PATH;
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
    const programme = parseProgramme(body.programme);
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
      programme,
      rawPayload: { mock: true, paymentId, programme },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const purchased = await fetchPurchasedMockNumbers(supabase, studentId, programme);

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      purchasedMockNumbers: purchased,
      programme,
      redirect: lobbyFor(programme),
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
    const programme = parseProgramme(searchParams.get("programme"));

    const supabase = getSupabase();
    const purchasedMockNumbers = await fetchPurchasedMockNumbers(
      supabase,
      studentId,
      programme
    );

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
      programme,
      purchasedMockNumbers,
      paymentConfirmed,
      hasPurchases: purchasedMockNumbers.length > 0,
      redirect: lobbyFor(programme),
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
