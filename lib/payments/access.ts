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

/** Phase 1: only IELTS Academic students require payment after onboarding. */
export function requiresIeltsAcademicPayment(user: PaymentAccessUser): boolean {
  if (user.role === "admin" || user.role === "teacher") return false;

  const programs = Array.isArray(user.enrolledPrograms)
    ? user.enrolledPrograms.map((p) => String(p).trim().toLowerCase())
    : [];

  if (programs.includes("ielts_general")) return false;
  if (programs.includes("ielts")) return true;
  if (user.programSelected === "ielts") return true;

  return false;
}

export function hasDashboardAccess(user: PaymentAccessUser): boolean {
  if (user.role === "admin" || user.role === "teacher") return true;
  if (!requiresIeltsAcademicPayment(user)) return true;

  const status = normalizePaymentStatus(user.paymentStatus);

  if (status === "paid") return true;

  if (status === "comped") {
    if (!user.paymentCompedUntil) return true;
    const until = new Date(user.paymentCompedUntil);
    return Number.isFinite(until.getTime()) && until.getTime() > Date.now();
  }

  return false;
}
