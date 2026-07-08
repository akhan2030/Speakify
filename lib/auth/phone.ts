/**
 * Normalise Saudi mobile numbers to E.164 (+9665XXXXXXXX).
 */
export function normalizeSaudiPhone(input: string): string | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return null;

  let local = digits;
  if (local.startsWith("966")) {
    local = local.slice(3);
  }
  if (local.startsWith("0")) {
    local = local.slice(1);
  }

  if (local.length !== 9 || !local.startsWith("5")) {
    return null;
  }

  return `+966${local}`;
}

/** Variants stored in DB for flexible lookup. */
export function phoneLookupVariants(e164: string): string[] {
  const digits = e164.replace(/\D/g, "");
  const local = digits.startsWith("966") ? digits.slice(3) : digits;
  return Array.from(
    new Set([
      e164,
      digits,
      `+${digits}`,
      local,
      `0${local}`,
      `966${local}`,
      `+966${local}`,
    ])
  );
}
