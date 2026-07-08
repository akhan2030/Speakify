import { NextResponse } from "next/server";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import {
  generateResetToken,
  promoteOtpToResetToken,
  verifyOtpToken,
} from "@/lib/auth/passwordReset";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = normalizeSaudiPhone(String(body.phone ?? ""));
    const otp = String(body.otp ?? "").replace(/\D/g, "");

    if (!phone) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }
    if (otp.length !== 6) {
      return NextResponse.json({ error: "Please enter the 6-digit code." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const tokenRecord = await verifyOtpToken(supabase, phone, otp);

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    const resetToken = generateResetToken();
    await promoteOtpToResetToken(supabase, tokenRecord.id, resetToken);

    return NextResponse.json({ resetToken });
  } catch (err) {
    console.error("[forgot-password/verify-otp]", err);
    return NextResponse.json({ error: "Could not verify code." }, { status: 500 });
  }
}
