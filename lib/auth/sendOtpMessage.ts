import {
  isMetaWhatsAppConfigured,
  isTwilioSmsConfigured,
  isTwilioWhatsAppConfigured,
} from "@/lib/auth/messagingConfig";

type SendResult = {
  ok: boolean;
  mode: "twilio" | "meta" | "console";
  error?: string;
};

async function twilioSendMessage(input: {
  to: string;
  body: string;
  channel: "whatsapp" | "sms";
}): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    return { ok: false, mode: "console", error: "Twilio is not configured." };
  }

  const from =
    input.channel === "whatsapp"
      ? process.env.TWILIO_WHATSAPP_FROM?.trim()
      : process.env.TWILIO_SMS_FROM?.trim() || process.env.TWILIO_PHONE_FROM?.trim();

  if (!from) {
    return {
      ok: false,
      mode: "console",
      error: `Twilio ${input.channel} sender is not configured.`,
    };
  }

  const fromFormatted =
    input.channel === "whatsapp" && !from.startsWith("whatsapp:")
      ? `whatsapp:${from}`
      : from;
  const toFormatted =
    input.channel === "whatsapp" && !input.to.startsWith("whatsapp:")
      ? `whatsapp:${input.to}`
      : input.to;

  const body = new URLSearchParams({
    From: fromFormatted,
    To: toFormatted,
    Body: input.body,
  });

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[twilio:${input.channel}]`, text);
      return { ok: false, mode: "twilio", error: text || `Twilio HTTP ${response.status}` };
    }

    return { ok: true, mode: "twilio" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio send failed";
    console.error(`[twilio:${input.channel}]`, message);
    return { ok: false, mode: "twilio", error: message };
  }
}

async function metaWhatsAppSendTemplateOtp(phone: string, otp: string): Promise<SendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName =
    process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim() || "hello_world";
  const templateLanguage =
    process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE?.trim() || "en_US";
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!accessToken || !phoneNumberId) {
    return { ok: false, mode: "console", error: "Meta WhatsApp is not configured." };
  }

  const to = phone.replace(/\D/g, "");
  const isAuthTemplate = templateName !== "hello_world";

  const templateBody: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      ...(isAuthTemplate
        ? {
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: otp }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: otp }],
              },
            ],
          }
        : {}),
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateBody),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("[meta:whatsapp:template]", text);
      return { ok: false, mode: "meta", error: text || `Meta HTTP ${response.status}` };
    }

    return { ok: true, mode: "meta" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Meta WhatsApp template send failed";
    console.error("[meta:whatsapp:template]", message);
    return { ok: false, mode: "meta", error: message };
  }
}

async function metaWhatsAppSendMessage(phone: string, body: string): Promise<SendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!accessToken || !phoneNumberId) {
    return { ok: false, mode: "console", error: "Meta WhatsApp is not configured." };
  }

  const to = phone.replace(/\D/g, "");

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("[meta:whatsapp]", text);
      return { ok: false, mode: "meta", error: text || `Meta HTTP ${response.status}` };
    }

    return { ok: true, mode: "meta" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Meta WhatsApp send failed";
    console.error("[meta:whatsapp]", message);
    return { ok: false, mode: "meta", error: message };
  }
}

export function buildOtpMessage(otp: string): string {
  return (
    `Your Speakify password reset code is: *${otp}*\n\n` +
    `This code expires in 10 minutes.\n\n` +
    `If you did not request this, ignore this message.`
  );
}

export async function sendSmsText(phone: string, body: string): Promise<SendResult> {
  if (!isTwilioSmsConfigured()) {
    return { ok: false, mode: "console", error: "SMS delivery is not configured." };
  }
  return twilioSendMessage({ to: phone, body, channel: "sms" });
}

export async function sendWhatsAppText(phone: string, body: string): Promise<SendResult> {
  if (isMetaWhatsAppConfigured()) {
    return metaWhatsAppSendMessage(phone, body);
  }
  if (isTwilioWhatsAppConfigured()) {
    return twilioSendMessage({ to: phone, body, channel: "whatsapp" });
  }
  return { ok: false, mode: "console", error: "WhatsApp delivery is not configured." };
}

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<SendResult> {
  const body = buildOtpMessage(otp);

  if (isMetaWhatsAppConfigured()) {
    const templateResult = await metaWhatsAppSendTemplateOtp(phone, otp);
    if (templateResult.ok) return templateResult;

    const textResult = await metaWhatsAppSendMessage(phone, body);
    if (textResult.ok) return textResult;
  }

  if (isTwilioWhatsAppConfigured()) {
    return twilioSendMessage({ to: phone, body, channel: "whatsapp" });
  }

  return { ok: false, mode: "console", error: "WhatsApp delivery is not configured." };
}

export async function sendSmsOtp(phone: string, otp: string): Promise<SendResult> {
  if (!isTwilioSmsConfigured()) {
    return { ok: false, mode: "console", error: "SMS delivery is not configured." };
  }

  return twilioSendMessage({
    to: phone,
    body: `Speakify password reset code: ${otp}. Expires in 10 minutes.`,
    channel: "sms",
  });
}
