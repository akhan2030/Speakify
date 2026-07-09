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

const DEFAULT_FROM = "Speakify LMS <onboarding@resend.dev>";

/** Strip accidental trailing env junk and validate Resend `from` format. */
export function resolveEmailFrom(): string {
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return DEFAULT_FROM;

  const named = raw.match(/^([^<]+?)\s*<([^>\s]+@[^>\s]+\.[^>\s]+)>/);
  if (named) {
    return `${named[1].trim()} <${named[2].trim()}>`;
  }

  const plain = raw.match(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
  if (plain) {
    return `Speakify LMS <${plain[1]}>`;
  }

  return DEFAULT_FROM;
}

function formatResendError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message?.includes("Invalid `from` field")) {
      return "Email sender is misconfigured. Please contact Speakify support.";
    }
    if (parsed.message) return parsed.message;
  } catch {
    // keep raw body fallback
  }
  return body || "Email send failed";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = resolveEmailFrom();

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
          error: formatResendError(body),
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
