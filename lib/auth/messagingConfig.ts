export type OtpDeliveryChannel = "whatsapp" | "sms" | "email";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()
  );
}

export function isTwilioWhatsAppConfigured(): boolean {
  return isTwilioConfigured() && Boolean(process.env.TWILIO_WHATSAPP_FROM?.trim());
}

export function isTwilioSmsConfigured(): boolean {
  return (
    isTwilioConfigured() &&
    Boolean(
      process.env.TWILIO_SMS_FROM?.trim() || process.env.TWILIO_PHONE_FROM?.trim()
    )
  );
}

export function isMetaWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

export function isWhatsAppOtpConfigured(): boolean {
  return isTwilioWhatsAppConfigured() || isMetaWhatsAppConfigured();
}

export function isSmsOtpConfigured(): boolean {
  return isTwilioSmsConfigured();
}

export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split("@");
  if (!local || !domain) return "your email";
  const visible = local.length <= 2 ? local[0] ?? "*" : `${local.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}
