import { sendEmail } from "@/lib/email/sendEmail";

type WelcomeEmailInput = {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  const subject = "Welcome to Speakify LMS — Your account is ready";
  const text = [
    `Hello ${input.name},`,
    "",
    "Your Speakify LMS student account has been created.",
    "",
    `Username: ${input.email}`,
    `Temporary password: ${input.temporaryPassword}`,
    `Login URL: ${input.loginUrl}`,
    "",
    "You will be asked to set a new password when you sign in for the first time.",
    "",
    "If you did not expect this email, please contact your teacher.",
    "",
    "— Speakify Global Language Center",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0d1b35; max-width: 560px;">
      <h2 style="color: #0d1b35;">Welcome to Speakify LMS</h2>
      <p>Hello ${escapeHtml(input.name)},</p>
      <p>Your student account has been created and is <strong>active</strong>.</p>
      <table style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Username</strong></td><td>${escapeHtml(input.email)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Temporary password</strong></td><td>${escapeHtml(input.temporaryPassword)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0;"><strong>Login URL</strong></td><td><a href="${escapeHtml(input.loginUrl)}">${escapeHtml(input.loginUrl)}</a></td></tr>
      </table>
      <p>You will be asked to set a new password on your first login.</p>
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Speakify Global Language Center</p>
    </div>
  `.trim();

  return sendEmail({
    to: input.email,
    subject,
    html,
    text,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
