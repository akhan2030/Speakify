import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { isValidAcademicMockNumber } from "@/lib/mock-test/academicMockCatalog";
import {
  canStartMock,
  loadMockAccessContext,
} from "@/lib/mock-test/loadMockAccessContext";

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

/** GET ?mock=N — whether the signed-in student may start that Academic mock. */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mockNumber = Number(new URL(request.url).searchParams.get("mock"));
    if (!isValidAcademicMockNumber(mockNumber)) {
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
      }
    );

    const allowed = canStartMock(accessCtx, mockNumber);
    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          canStart: false,
          mockNumber,
          error: "Purchase this mock exam to start a new attempt.",
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
      purchasedMockNumbers: accessCtx.purchasedMockNumbers,
      hasAllMocks: accessCtx.hasAllMocks,
    });
  } catch (err) {
    console.error("[mock-test/access]", err);
    return NextResponse.json({ error: "Access check failed" }, { status: 500 });
  }
}
