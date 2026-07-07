export type PaymentStatus = "unpaid" | "pending" | "paid" | "comped" | "refunded";

export type PaymentAccessUser = {
  role?: string | null;
  paymentStatus?: PaymentStatus | string | null;
  paymentCompedUntil?: string | Date | null;
  enrolledPrograms?: unknown;
  programSelected?: string | null;
};

export function normalizePaymentStatus(value: unknown): PaymentStatus {
  const v = String(value ?? "unpaid").trim().toLowerCase();
  if (v === "paid" || v === "pending" || v === "comped" || v === "refunded") return v;
  return "unpaid";
}

/** Programmes that require a one-time payment after onboarding. */
export const PAID_PROGRAMMES = ["ielts", "ielts_general"] as const;

/**
 * Whether the student must pay before accessing their dashboard.
 * Both IELTS Academic and IELTS General Training are paid programmes.
 */
export function requiresProgrammePayment(user: PaymentAccessUser): boolean {
  if (user.role === "admin" || user.role === "teacher") return false;

  const programs = Array.isArray(user.enrolledPrograms)
    ? user.enrolledPrograms.map((p) => String(p).trim().toLowerCase())
    : [];

  if (programs.some((p) => (PAID_PROGRAMMES as readonly string[]).includes(p))) {
    return true;
  }

  const selected = String(user.programSelected ?? "").trim().toLowerCase();
  if ((PAID_PROGRAMMES as readonly string[]).includes(selected)) return true;

  return false;
}

/** @deprecated Use requiresProgrammePayment. Kept for back-compat. */
export const requiresIeltsAcademicPayment = requiresProgrammePayment;

export function hasDashboardAccess(user: PaymentAccessUser): boolean {
  if (user.role === "admin" || user.role === "teacher") return true;
  if (!requiresProgrammePayment(user)) return true;

  const status = normalizePaymentStatus(user.paymentStatus);

  if (status === "paid") return true;

  if (status === "comped") {
    if (!user.paymentCompedUntil) return true;
    const until = new Date(user.paymentCompedUntil);
    return Number.isFinite(until.getTime()) && until.getTime() > Date.now();
  }

  return false;
}
