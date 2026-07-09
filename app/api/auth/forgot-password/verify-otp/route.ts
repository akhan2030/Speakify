import { NextResponse } from "next/server";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import {
  findUserByPhone,
  generateResetToken,
  promoteOtpToResetToken,
  verifyOtpToken,
} from "@/lib/auth/passwordReset";
import {
  getRequestIp,
  isPasswordResetRateLimited,
  passwordResetScopes,
  recordPasswordResetAttempts,
} from "@/lib/auth/rateLimit";
import {
  getStoredVerifiedPhone,
  identifiersMatchStoredContacts,
  type VerifiableUser,
} from "@/lib/auth/verification";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputPhone = normalizeSaudiPhone(String(body.phone ?? ""));
    const otp = String(body.otp ?? "").replace(/\D/g, "");

    if (!inputPhone) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }
    if (otp.length !== 6) {
      return NextResponse.json({ error: "Please enter the 6-digit code." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const ip = getRequestIp(request);
    const scopes = passwordResetScopes({ ip, phone: inputPhone });

    if (await isPasswordResetRateLimited(supabase, scopes)) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }
    await recordPasswordResetAttempts(supabase, scopes);

    const user = (await findUserByPhone(supabase, inputPhone)) as VerifiableUser | null;
    const storedPhone = user ? getStoredVerifiedPhone(user) : null;

    if (
      !user ||
      !storedPhone ||
      !identifiersMatchStoredContacts(user, { phone: inputPhone })
    ) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    const tokenRecord = await verifyOtpToken(supabase, storedPhone, otp);
    if (!tokenRecord || tokenRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    const resetToken = generateResetToken();
    await promoteOtpToResetToken(supabase, tokenRecord.id, resetToken);

    return NextResponse.json({ resetToken });
  } catch (err) {
    console.error("[forgot-password/verify-otp]", err);
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }
}
