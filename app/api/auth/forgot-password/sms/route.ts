import { NextResponse } from "next/server";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import {
  findUserByPhone,
  generateOtp,
  otpExpiresAt,
  upsertPasswordResetToken,
} from "@/lib/auth/passwordReset";
import { sendSmsOtp } from "@/lib/auth/sendOtpMessage";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = normalizeSaudiPhone(String(body.phone ?? ""));

    if (!phone) {
      return NextResponse.json({ error: "Please enter a valid Saudi mobile number." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const user = await findUserByPhone(supabase, phone);

    if (user) {
      const otp = generateOtp();
      await upsertPasswordResetToken(supabase, {
        userId: user.id,
        token: otp,
        method: "sms",
        phone,
        expiresAt: otpExpiresAt(),
      });

      const sendResult = await sendSmsOtp(phone, otp);
      if (!sendResult.ok) {
        console.error("[forgot-password/sms]", sendResult.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password/sms]", err);
    return NextResponse.json({ error: "Could not send SMS code." }, { status: 500 });
  }
}
