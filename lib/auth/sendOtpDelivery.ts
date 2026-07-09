import { sendEmail } from "@/lib/email/sendEmail";
import {
  isResendConfigured,
  isSmsOtpConfigured,
  isWhatsAppOtpConfigured,
  maskEmail,
  type OtpDeliveryChannel,
} from "@/lib/auth/messagingConfig";
import { buildOtpMessage, sendSmsOtp, sendWhatsAppOtp } from "@/lib/auth/sendOtpMessage";

export type OtpDeliveryResult = {
  ok: boolean;
  delivery: OtpDeliveryChannel | "none";
  maskedEmail?: string;
  error?: string;
};

async function sendOtpEmailFallback(input: {
  email: string;
  name?: string | null;
  otp: string;
  requestedChannel: OtpDeliveryChannel;
}): Promise<OtpDeliveryResult> {
  if (!isResendConfigured()) {
    return {
      ok: false,
      delivery: "none",
      error:
        "Password reset messaging is not configured yet. Please use email reset or contact Speakify support.",
    };
  }

  const name = input.name?.trim() || "Student";
  const channelLabel = input.requestedChannel === "whatsapp" ? "WhatsApp" : "SMS";

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0d1b35;">Your Speakify reset code</h2>
      <p>Hello ${name},</p>
      <p>We could not deliver your code via ${channelLabel}, so we sent it to your registered email instead.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0d1b35;">${input.otp}</p>
      <p style="color: #888; font-size: 13px;">This code expires in 10 minutes.</p>
      <p style="color: #888; font-size: 13px;">If you did not request this, ignore this email.</p>
    </div>
  `;

  const emailResult = await sendEmail({
    to: input.email,
    subject: "Your Speakify password reset code",
    html,
    text: `Hello ${name},\n\nYour Speakify password reset code is: ${input.otp}\n\nThis code expires in 10 minutes.`,
  });

  if (!emailResult.ok) {
    return {
      ok: false,
      delivery: "none",
      error: emailResult.error ?? "Could not send reset code by email.",
    };
  }

  return {
    ok: true,
    delivery: "email",
    maskedEmail: maskEmail(input.email),
  };
}

export async function deliverOtp(input: {
  phone: string;
  otp: string;
  channel: "whatsapp" | "sms";
  userEmail?: string | null;
  userName?: string | null;
}): Promise<OtpDeliveryResult> {
  const channelConfigured =
    input.channel === "whatsapp" ? isWhatsAppOtpConfigured() : isSmsOtpConfigured();

  if (channelConfigured) {
    const sendResult =
      input.channel === "whatsapp"
        ? await sendWhatsAppOtp(input.phone, input.otp)
        : await sendSmsOtp(input.phone, input.otp);

    if (sendResult.ok && sendResult.mode !== "console") {
      return { ok: true, delivery: input.channel };
    }

    if (!sendResult.ok) {
      console.error(`[otp-delivery:${input.channel}]`, sendResult.error);
    }
  }

  if (input.userEmail?.includes("@")) {
    const fallback = await sendOtpEmailFallback({
      email: input.userEmail,
      name: input.userName,
      otp: input.otp,
      requestedChannel: input.channel,
    });
    if (fallback.ok) {
      return fallback;
    }
    return fallback;
  }

  if (!channelConfigured) {
    return {
      ok: false,
      delivery: "none",
      error:
        input.channel === "whatsapp"
          ? "WhatsApp reset is not available yet. Please use email reset instead."
          : "SMS reset is not available yet. Please use email or WhatsApp reset instead.",
    };
  }

  return {
    ok: false,
    delivery: "none",
    error: "Could not send your reset code. Please try email reset instead.",
  };
}
