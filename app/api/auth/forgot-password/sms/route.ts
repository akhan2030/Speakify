import { NextResponse } from "next/server";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import {
  findUserByPhone,
  generateOtp,
  otpExpiresAt,
  upsertPasswordResetToken,
} from "@/lib/auth/passwordReset";
import { deliverOtp } from "@/lib/auth/sendOtpDelivery";
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

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const otp = generateOtp();
    await upsertPasswordResetToken(supabase, {
      userId: user.id,
      token: otp,
      method: "sms",
      phone,
      expiresAt: otpExpiresAt(),
    });

    const delivery = await deliverOtp({
      phone,
      otp,
      channel: "sms",
      userEmail: user.email,
      userName: user.name,
    });

    if (!delivery.ok) {
      return NextResponse.json({ error: delivery.error ?? "Could not send SMS code." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      delivery: delivery.delivery,
      maskedEmail: delivery.maskedEmail,
    });
  } catch (err) {
    console.error("[forgot-password/sms]", err);
    const message = err instanceof Error ? err.message : "";
    if (message.includes("password_reset_tokens")) {
      return NextResponse.json(
        { error: "Password reset setup incomplete. Please contact Speakify support." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Could not send SMS code." }, { status: 500 });
  }
}
