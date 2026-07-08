type TwilioSendResult = { ok: boolean; mode: "twilio" | "console"; error?: string };

async function twilioSendMessage(input: {
  to: string;
  body: string;
  channel: "whatsapp" | "sms";
}): Promise<TwilioSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    console.log(`[otp:${input.channel}] To ${input.to}: ${input.body}`);
    return { ok: true, mode: "console" };
  }

  const from =
    input.channel === "whatsapp"
      ? process.env.TWILIO_WHATSAPP_FROM?.trim()
      : process.env.TWILIO_SMS_FROM?.trim() || process.env.TWILIO_PHONE_FROM?.trim();

  if (!from) {
    console.log(`[otp:${input.channel}] Missing FROM env — logging message to ${input.to}: ${input.body}`);
    return { ok: true, mode: "console" };
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

export function buildOtpMessage(otp: string): string {
  return (
    `Your Speakify password reset code is: *${otp}*\n\n` +
    `This code expires in 10 minutes.\n\n` +
    `If you did not request this, ignore this message.`
  );
}

export async function sendWhatsAppOtp(phone: string, otp: string) {
  return twilioSendMessage({
    to: phone,
    body: buildOtpMessage(otp),
    channel: "whatsapp",
  });
}

export async function sendSmsOtp(phone: string, otp: string) {
  return twilioSendMessage({
    to: phone,
    body: `Speakify password reset code: ${otp}. Expires in 10 minutes.`,
    channel: "sms",
  });
}
