import { sendEmail } from "@/lib/email/sendEmail";
import { riyadhClock } from "./calendar";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function whenLabel(iso: string): string {
  const clock = riyadhClock(iso);
  if (!clock) return iso;
  return `${clock.ymd} at ${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")} (Riyadh)`;
}

export async function sendLiveClassEmail(input: {
  to: string;
  name: string;
  kind: "confirmed_to_run" | "class_took_place" | "cancelled_underfilled";
  startsAt: string;
  marketplaceHref: string;
}) {
  const when = whenLabel(input.startsAt);
  const name = escapeHtml(input.name || "there");

  if (input.kind === "confirmed_to_run") {
    return sendEmail({
      to: input.to,
      subject: "Your Speakify group class is confirmed",
      text: `Hello ${input.name},\n\nYour group class on ${when} now has enough students and will run.\n\n— Speakify`,
      html: `<p>Hello ${name},</p><p>Your group class on <strong>${escapeHtml(when)}</strong> now has enough students and <strong>will run</strong>.</p><p>This is the pre-class confirmation — you will get a separate note after the session takes place.</p>`,
    });
  }

  if (input.kind === "class_took_place") {
    return sendEmail({
      to: input.to,
      subject: "Your Speakify class has taken place",
      text: `Hello ${input.name},\n\nYour live class on ${when} has taken place. The replay will appear in Live classes when it is ready.\n\n— Speakify`,
      html: `<p>Hello ${name},</p><p>Your live class on <strong>${escapeHtml(when)}</strong> has taken place.</p><p>This is the post-class notice, separate from the earlier “class is confirmed to run” email. The replay will appear in Live classes when it is ready.</p>`,
    });
  }

  return sendEmail({
    to: input.to,
    subject: "Group class cancelled — pick another slot",
    text: `Hello ${input.name},\n\nThe group class on ${when} did not reach 4 students 24 hours before start, so it was cancelled. Any pay-as-you-go fee has been credited to your account. Please pick another slot: ${input.marketplaceHref}\n\n— Speakify`,
    html: `<p>Hello ${name},</p><p>The group class on <strong>${escapeHtml(when)}</strong> did not reach 4 students 24 hours before start, so it was cancelled.</p><p>Any pay-as-you-go fee has been credited for your next booking.</p><p><a href="${escapeHtml(input.marketplaceHref)}">Pick another slot</a></p>`,
  });
}
