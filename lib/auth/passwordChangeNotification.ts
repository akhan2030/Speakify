import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/sendEmail";
import { sendSmsOtp, sendSmsText, sendWhatsAppOtp, sendWhatsAppText } from "@/lib/auth/sendOtpMessage";
import {
  getStoredVerifiedEmail,
  getStoredVerifiedPhone,
  type VerifiableUser,
} from "@/lib/auth/verification";
import { isSmsOtpConfigured, isWhatsAppOtpConfigured } from "@/lib/auth/messagingConfig";

export async function notifyPasswordChanged(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, phone, email_verified_at, phone_verified_at")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return;

  const verifiable = user as VerifiableUser;
  const name = verifiable.name?.trim() || "Student";
  const email = getStoredVerifiedEmail(verifiable);
  const phone = getStoredVerifiedPhone(verifiable);
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Riyadh" });

  if (email) {
    await sendEmail({
      to: email,
      subject: "Your Speakify password was changed",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#0d1b35;">Password changed</h2>
          <p>Hello ${name},</p>
          <p>Your Speakify password was changed on ${when} (Riyadh time).</p>
          <p>If you did not make this change, contact Speakify support immediately.</p>
        </div>
      `,
      text: `Hello ${name},\n\nYour Speakify password was changed on ${when} (Riyadh time).\nIf you did not make this change, contact Speakify support immediately.`,
    });
  }

  const alertMessage =
    `Speakify security alert: your password was changed on ${when}. ` +
    `If this was not you, contact Speakify support immediately.`;

  if (phone && isWhatsAppOtpConfigured()) {
    await sendWhatsAppText(phone, alertMessage);
  } else if (phone && isSmsOtpConfigured()) {
    await sendSmsText(phone, alertMessage);
  }
}
