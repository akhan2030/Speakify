type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  ok: boolean;
  mode: "resend" | "console" | "skipped";
  error?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "Speakify LMS <noreply@speakify.com>";

  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          ok: false,
          mode: "resend",
          error: body || `Resend HTTP ${response.status}`,
        };
      }

      return { ok: true, mode: "resend" };
    } catch (err) {
      return {
        ok: false,
        mode: "resend",
        error: err instanceof Error ? err.message : "Email send failed",
      };
    }
  }

  console.log("[email] RESEND_API_KEY not set — logging welcome email:");
  console.log(`  To: ${input.to}`);
  console.log(`  Subject: ${input.subject}`);
  console.log(`  Body:\n${input.text}`);

  return { ok: true, mode: "console" };
}
