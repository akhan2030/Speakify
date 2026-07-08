import { NextResponse } from "next/server";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import {
  findUserByPhone,
  generateOtp,
  otpExpiresAt,
  upsertPasswordResetToken,
} from "@/lib/auth/passwordReset";
import { sendWhatsAppOtp } from "@/lib/auth/sendOtpMessage";
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
        method: "whatsapp",
        phone,
        expiresAt: otpExpiresAt(),
      });

      const sendResult = await sendWhatsAppOtp(phone, otp);
      if (!sendResult.ok) {
        console.error("[forgot-password/whatsapp]", sendResult.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password/whatsapp]", err);
    return NextResponse.json({ error: "Could not send reset code." }, { status: 500 });
  }
}
