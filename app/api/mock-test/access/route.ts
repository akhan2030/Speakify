import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { isValidAcademicMockNumber } from "@/lib/mock-test/academicMockCatalog";
import { isValidGtMockNumber } from "@/lib/ielts-general/gtMockCatalog";
import {
  canStartMock,
  loadMockAccessContext,
} from "@/lib/mock-test/loadMockAccessContext";
import type { MockPurchaseProgramme } from "@/lib/mock-test/mockAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseProgramme(raw: string | null): MockPurchaseProgramme {
  return raw === "ielts_general" ? "ielts_general" : "ielts";
}

/** GET ?mock=N&programme=ielts|ielts_general — may the signed-in student start that mock? */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const mockNumber = Number(url.searchParams.get("mock"));
    const programme = parseProgramme(url.searchParams.get("programme"));

    const valid =
      programme === "ielts_general"
        ? isValidGtMockNumber(mockNumber)
        : isValidAcademicMockNumber(mockNumber);

    if (!valid) {
      return NextResponse.json({ error: "Invalid mock number" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { data: userRow } = await supabase
      .from("users")
      .select(
        "id, role, payment_status, payment_comped_until, enrolled_programs, program_selected, purchase_intent"
      )
      .eq("id", studentId)
      .maybeSingle();

    const accessCtx = await loadMockAccessContext(
      supabase,
      userRow ?? {
        id: studentId,
        role: (session.user as { role?: string })?.role ?? "student",
      },
      { programme }
    );

    const allowed = canStartMock(accessCtx, mockNumber);
    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          canStart: false,
          mockNumber,
          programme,
          error:
            programme === "ielts_general"
              ? "Purchase this GT mock exam to start a new attempt."
              : "Purchase this mock exam to start a new attempt.",
          purchasedMockNumbers: accessCtx.purchasedMockNumbers,
          hasAllMocks: accessCtx.hasAllMocks,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      canStart: true,
      mockNumber,
      programme,
      purchasedMockNumbers: accessCtx.purchasedMockNumbers,
      hasAllMocks: accessCtx.hasAllMocks,
    });
  } catch (err) {
    console.error("[mock-test/access]", err);
    return NextResponse.json({ error: "Access check failed" }, { status: 500 });
  }
}
