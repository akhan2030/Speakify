import { NextResponse } from "next/server";
import {
  findValidResetToken,
  resetUserPassword,
} from "@/lib/auth/passwordReset";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const resetToken = String(body.resetToken ?? "").trim();
    const newPassword = String(body.newPassword ?? "");

    if (!resetToken) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const tokenRecord = await findValidResetToken(supabase, resetToken);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    await resetUserPassword(supabase, tokenRecord.user_id, newPassword, tokenRecord.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password/reset]", err);
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
