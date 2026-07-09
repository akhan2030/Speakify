import { NextResponse } from "next/server";
import { verifyRegistrationPhoneOtp } from "@/lib/auth/verification";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId ?? "").trim();
    const otp = String(body.otp ?? "").trim();

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const result = await verifyRegistrationPhoneOtp(supabase, userId, otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Verification failed." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-registration/phone]", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
