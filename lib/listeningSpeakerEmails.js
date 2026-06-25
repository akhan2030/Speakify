/**
 * Scrub legacy speaker-derived emails from transcripts, answers, and form fields.
 */

/** Never show in listening content — tied to old default speakers. */
export const BANNED_EMAIL_ADDRESSES = [
  "sarah.mitchell@email.com",
  "sarah.johnson@email.com",
  "david.mitchell@email.com",
  "david.johnson@email.com",
  "emma.wilson@email.com",
  "james.harrison@email.com",
  "michael.harrison@email.com",
  "tom.harrison@email.com",
  "robert.mitchell@email.com",
  "sophie.wilson@email.com",
];

const BANNED_EMAIL_RE = [
  /\bsarah\.mitchell@[\w.-]+\b/gi,
  /\bsarah\.johnson@[\w.-]+\b/gi,
  /\bdavid\.mitchell@[\w.-]+\b/gi,
  /\bdavid\.johnson@[\w.-]+\b/gi,
  /\bemma\.wilson@[\w.-]+\b/gi,
  /\bjames\.harrison@[\w.-]+\b/gi,
  /\bmichael\.harrison@[\w.-]+\b/gi,
];

/**
 * @param {string} displayName
 */
export function emailFromDisplayName(displayName) {
  const parts = String(displayName ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "customer@email.com";
  if (parts.length === 1) return `${parts[0]}@email.com`;
  return `${parts[0]}.${parts[parts.length - 1]}@email.com`;
}

/**
 * @param {Array<{ label?: string, role?: string, displayName?: string, name?: string }>} identities
 */
export function getCustomerSpeakerIdentity(identities) {
  const list = Array.isArray(identities) ? identities : [];
  return (
    list.find((s) => s.role === "customer") ??
    list.find((s) => String(s.label ?? "").toLowerCase() === "speaker b") ??
    list[list.length - 1]
  );
}

/**
 * @param {string} text
 */
export function contentHasBannedEmails(text) {
  const lower = String(text ?? "").toLowerCase();
  if (!lower) return false;
  for (const addr of BANNED_EMAIL_ADDRESSES) {
    if (lower.includes(addr)) return true;
  }
  for (const re of BANNED_EMAIL_RE) {
    if (re.test(String(text ?? ""))) {
      re.lastIndex = 0;
      return true;
    }
    re.lastIndex = 0;
  }
  return false;
}

/**
 * @param {string} text
 * @param {Array<object>} identities
 */
export function scrubBannedEmailsInText(text, identities) {
  const customer = getCustomerSpeakerIdentity(identities);
  const replacement = emailFromDisplayName(
    customer?.displayName ?? customer?.name
  );
  let out = String(text ?? "");

  for (const addr of BANNED_EMAIL_ADDRESSES) {
    out = out.replace(new RegExp(escapeRegExp(addr), "gi"), replacement);
  }
  for (const re of BANNED_EMAIL_RE) {
    out = out.replace(re, replacement);
  }

  return out;
}

/**
 * @param {Array<object>} questions
 * @param {Array<object>} identities
 */
export function scrubBannedEmailsInQuestions(questions, identities) {
  if (!Array.isArray(questions)) return questions;

  return questions.map((q) => {
    const next = { ...q };
    if (next.answer != null) {
      next.answer = scrubBannedEmailsInText(String(next.answer), identities);
    }
    if (next.text != null) {
      next.text = scrubBannedEmailsInText(String(next.text), identities);
    }
    if (Array.isArray(next.options)) {
      next.options = next.options.map((o) =>
        scrubBannedEmailsInText(String(o ?? ""), identities)
      );
    }
    return next;
  });
}

/**
 * @param {string} s
 */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
