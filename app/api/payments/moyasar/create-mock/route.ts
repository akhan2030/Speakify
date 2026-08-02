import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import { getAppBaseUrl } from "@/lib/appUrl";
import {
  ACADEMIC_MOCK_PRICING,
  isValidAcademicMockNumber,
  mockNumbersForProduct,
  type MockProductType,
} from "@/lib/mock-test/academicMockCatalog";
import {
  GT_MOCK_PRICING,
  isValidGtMockNumber,
  mockNumbersForGtProduct,
  type GtMockProductType,
} from "@/lib/ielts-general/gtMockCatalog";
import { createMockExamPayment, isMoyasarMockMode } from "@/lib/payments/moyasar";
import {
  hasAllAcademicMockAccess,
  hasAllGeneralMockAccess,
  type MockPurchaseProgramme,
} from "@/lib/mock-test/mockAccess";
import {
  foundingOfferPriceHalalas,
  getFoundingOffer,
  isFounding50OfferActive,
  mockProductIdForType,
} from "@/lib/discounts";
import {
  attachFoundingPayment,
  releaseFoundingReservation,
  reserveFoundingSpot,
} from "@/lib/foundingOfferServer";
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

function parseProduct(
  value: unknown,
  programme: MockPurchaseProgramme
): MockProductType | GtMockProductType | null {
  const v = String(value ?? "").trim().toLowerCase();
  if (programme === "ielts_general") {
    if (v === "single" || v === "pack3") return v;
    return null;
  }
  if (v === "single" || v === "pack3" || v === "pack5") return v;
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const programme = parseProgramme(body.programme);
    const product = parseProduct(body.product, programme);
    const mockNumber = Number(body.mockNumber);
    const offerCode = String(body.offer ?? "").trim().toLowerCase() || null;
    const lobbyPath =
      programme === "ielts_general" ? GT_MOCK_LOBBY_PATH : IELTS_MOCK_LOBBY_PATH;

    if (!product) {
      return NextResponse.json(
        {
          error:
            programme === "ielts_general"
              ? "Invalid GT product (single or pack3 only)"
              : "Invalid product",
        },
        { status: 400 }
      );
    }

    if (product === "single") {
      const valid =
        programme === "ielts_general"
          ? isValidGtMockNumber(mockNumber)
          : isValidAcademicMockNumber(mockNumber);
      if (!valid) {
        return NextResponse.json({ error: "Invalid mock number" }, { status: 400 });
      }
    }

    const supabase = getSupabase();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, name, email, payment_status, payment_comped_until, enrolled_programs, program_selected, purchase_intent"
      )
      .eq("id", studentId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const accessUser = {
      role,
      paymentStatus: user.payment_status,
      paymentCompedUntil: user.payment_comped_until,
      enrolledPrograms: user.enrolled_programs,
      programSelected: user.program_selected,
      purchaseIntent: user.purchase_intent,
    };

    const hasAll =
      programme === "ielts_general"
        ? hasAllGeneralMockAccess(accessUser)
        : hasAllAcademicMockAccess(accessUser);

    if (hasAll) {
      return NextResponse.json(
        {
          error:
            programme === "ielts_general"
              ? "Your plan already includes all 3 full timed GT mocks"
              : "Your plan already includes all Academic mocks",
          redirect: lobbyPath,
        },
        { status: 400 }
      );
    }

    const mockNumbers =
      programme === "ielts_general"
        ? mockNumbersForGtProduct(
            product as GtMockProductType,
            product === "single" ? mockNumber : undefined
          )
        : mockNumbersForProduct(
            product as MockProductType,
            product === "single" ? mockNumber : undefined
          );

    const { data: existingPurchases } = await supabase
      .from("mock_exam_purchases")
      .select("mock_number")
      .eq("student_id", studentId)
      .eq("programme", programme)
      .in("mock_number", mockNumbers);

    const alreadyOwned = new Set(
      (existingPurchases ?? []).map((row) => Number(row.mock_number))
    );
    const toBuy = mockNumbers.filter((n) => !alreadyOwned.has(n));

    if (toBuy.length === 0) {
      return NextResponse.json(
        {
          error: "You already own the mocks in this product",
          redirect: lobbyPath,
        },
        { status: 400 }
      );
    }

    const alreadyOwnedList = mockNumbers.filter((n) => alreadyOwned.has(n));

    const baseUrl = getAppBaseUrl() || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/checkout/mock/success?programme=${programme}`;

    const foundingProductId = mockProductIdForType(product as MockProductType);
    let foundingOffer = isFounding50OfferActive(offerCode)
      ? getFoundingOffer(foundingProductId)
      : null;
    let foundingOfferFull = false;
    let reservationToken: string | null = null;

    if (foundingOffer) {
      const reserved = await reserveFoundingSpot(supabase, {
        studentId,
        productId: foundingProductId,
      });
      if (!reserved.ok) {
        foundingOffer = null;
        foundingOfferFull =
          reserved.reason === "full" || reserved.reason === "unavailable";
      } else {
        reservationToken = reserved.reservationToken;
      }
    }

    const description =
      programme === "ielts_general"
        ? product === "single"
          ? `IELTS General Training Mock #${mockNumber}`
          : "3 full timed GT mock exams (Mocks #1–#3)"
        : product === "single"
          ? `IELTS Academic Mock #${mockNumber}`
          : product === "pack3"
            ? "IELTS Academic 3-Mock Pack (Mocks #1–#3)"
            : "IELTS Academic 5-Mock Pack (Mocks #1–#5)";

    const payment = await createMockExamPayment({
      studentId,
      product: product as MockProductType,
      singleMockNumber: product === "single" ? mockNumber : undefined,
      studentEmail: String(user.email ?? session.user?.email ?? ""),
      studentName: String(user.name ?? "Student"),
      callbackUrl,
      amountHalalasOverride: foundingOffer
        ? foundingOfferPriceHalalas(foundingProductId)
        : programme === "ielts_general"
          ? GT_MOCK_PRICING[product as GtMockProductType].priceHalalas
          : undefined,
      offerCode: foundingOffer ? offerCode : null,
      programme,
      descriptionOverride: description,
    });

    if ("error" in payment) {
      await releaseFoundingReservation(supabase, reservationToken);
      return NextResponse.json({ error: payment.error }, { status: 503 });
    }

    const paymentId =
      payment.mode === "mock" ? payment.mockPaymentId : payment.paymentId;

    if (reservationToken) {
      await attachFoundingPayment(supabase, reservationToken, paymentId);
    }

    await supabase.from("payment_transactions").upsert(
      {
        student_id: studentId,
        moyasar_payment_id: paymentId,
        track: null,
        product_type: payment.productType,
        mock_numbers: payment.mockNumbers,
        amount_halalas: payment.amountHalalas,
        currency: "SAR",
        status: "initiated",
      },
      { onConflict: "moyasar_payment_id" }
    );

    const pricing =
      programme === "ielts_general"
        ? GT_MOCK_PRICING[product as GtMockProductType]
        : ACADEMIC_MOCK_PRICING[product as MockProductType];

    return NextResponse.json({
      ok: true,
      mode: payment.mode,
      paymentId,
      studentId,
      programme,
      product,
      productType: payment.productType,
      mockNumbers: payment.mockNumbers,
      unlockingMockNumbers: toBuy,
      alreadyOwnedMockNumbers: alreadyOwnedList,
      price: foundingOffer?.discountedPriceLabel ?? pricing.priceLabel,
      originalPrice: foundingOffer?.originalPriceLabel ?? null,
      offer: foundingOffer ? offerCode : null,
      foundingOfferFull,
      foundingOfferMessage: foundingOfferFull
        ? "The Founding 50 offer is full — standard pricing applies."
        : null,
      amountHalalas: payment.amountHalalas,
      description,
      publishableKey: payment.mode === "live" ? payment.publishableKey : null,
      mockMode: isMoyasarMockMode(),
      callbackUrl,
      lobbyPath,
    });
  } catch (err) {
    console.error("[payments/moyasar/create-mock]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout" },
      { status: 500 }
    );
  }
}
