import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasDashboardAccess,
  isMockOnlyPurchaseIntent as isMockOnlyIntentFromAccess,
  normalizePaymentStatus,
  type PaymentAccessUser,
} from "@/lib/payments/access";
import { parseEnrollmentSlugs } from "@/lib/programType";
import { normalizeRole } from "@/lib/roles";
import {
  ALL_ACADEMIC_MOCK_NUMBERS,
  isValidAcademicMockNumber,
} from "@/lib/mock-test/academicMockCatalog";

export type MockAccessUser = PaymentAccessUser & {
  purchaseIntent?: string | null;
};

export type PurchaseIntent = "accelerator" | "mock_only";

/** Admin and teacher always have full mock access (QA, demos, support). */
export function isStaffMockAccessRole(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "teacher";
}

export function isMockOnlyPurchaseIntent(value: unknown): boolean {
  return isMockOnlyIntentFromAccess(value);
}

/** Enrolled in IELTS Academic (not GT-only). */
export function isIeltsAcademicEnrolled(user: {
  enrolledPrograms?: unknown;
  programSelected?: string | null;
}): boolean {
  const slugs = parseEnrollmentSlugs(user.enrolledPrograms);
  const selected = String(user.programSelected ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (slugs.includes("ielts_general") && !slugs.includes("ielts")) {
    return false;
  }

  return slugs.includes("ielts") || selected === "ielts";
}

/**
 * All 5 Academic mocks unlocked — entitlement groups:
 * 1. admin / teacher (always)
 * 2. Paid Accelerator (payment_status paid) on IELTS Academic
 * 3. Valid-comped / other hasDashboardAccess IELTS Academic students
 *    who are NOT mock-only purchasers
 *
 * Mock-only buyers (`purchase_intent = mock_only`) unlock via
 * mock_exam_purchases rows only — never the full catalogue — even though
 * hasDashboardAccess() returns true for them (so they can reach the lobby
 * without paying for Accelerator).
 */
export function hasAllAcademicMockAccess(user: MockAccessUser): boolean {
  if (isStaffMockAccessRole(user.role)) {
    return true;
  }

  if (!isIeltsAcademicEnrolled(user)) {
    return false;
  }

  // Later Accelerator checkout clears this; paid status is the safety net.
  if (isMockOnlyPurchaseIntent(user.purchaseIntent)) {
    return normalizePaymentStatus(user.paymentStatus) === "paid";
  }

  return hasDashboardAccess(user);
}

/**
 * Start or resume a live mock attempt — requires active entitlement.
 * Expired comp / lapsed access does NOT qualify (unless staff or purchased).
 */
export function hasMockExamStartAccess(
  user: MockAccessUser,
  mockNumber: number,
  purchasedMockNumbers: Iterable<number> = []
): boolean {
  if (!isValidAcademicMockNumber(mockNumber)) {
    return false;
  }

  if (hasAllAcademicMockAccess(user)) {
    return true;
  }

  for (const n of purchasedMockNumbers) {
    if (n === mockNumber) {
      return true;
    }
  }

  return false;
}

/** @alias hasMockExamStartAccess */
export const hasMockExamAccess = hasMockExamStartAccess;

/**
 * View results, reports, and attempt detail for a mock.
 * Past work is never revoked: owning the attempt is sufficient even when
 * start access has lapsed (expired comp, refunded pack, etc.).
 */
export function hasMockExamResultsAccess(
  user: MockAccessUser,
  options: {
    mockNumber?: number;
    purchasedMockNumbers?: Iterable<number>;
    ownsAttempt?: boolean;
  } = {}
): boolean {
  if (isStaffMockAccessRole(user.role)) {
    return true;
  }

  if (options.ownsAttempt) {
    return true;
  }

  if (
    options.mockNumber != null &&
    isValidAcademicMockNumber(options.mockNumber)
  ) {
    return hasMockExamStartAccess(
      user,
      options.mockNumber,
      options.purchasedMockNumbers ?? []
    );
  }

  return false;
}

/**
 * Mock exam lobby — includes students with attempt history even if start
 * access has lapsed (subscription/comp expiry does not hide history).
 */
export function hasMockExamLobbyAccess(
  user: MockAccessUser,
  options: {
    purchasedMockNumbers?: Iterable<number>;
    hasAttemptHistory?: boolean;
  } = {}
): boolean {
  if (isStaffMockAccessRole(user.role)) {
    return true;
  }

  if (options.hasAttemptHistory) {
    return true;
  }

  const purchased = [...(options.purchasedMockNumbers ?? [])];
  if (purchased.length > 0) {
    return true;
  }

  return ALL_ACADEMIC_MOCK_NUMBERS.some((n) =>
    hasMockExamStartAccess(user, n, purchased)
  );
}

/** Lobby cards: mocks you can start ∪ mocks you have attempt history for. */
export function resolveVisibleMockNumbers(
  user: MockAccessUser,
  purchasedMockNumbers: Iterable<number>,
  attemptedMockNumbers: Iterable<number>
): number[] {
  const visible = new Set<number>();

  for (const n of resolveAccessibleMockNumbers(user, purchasedMockNumbers)) {
    visible.add(n);
  }

  for (const n of attemptedMockNumbers) {
    if (isValidAcademicMockNumber(n)) {
      visible.add(n);
    }
  }

  return [...visible].sort((a, b) => a - b);
}

/** Mock numbers this user may open (sorted). */
export function resolveAccessibleMockNumbers(
  user: MockAccessUser,
  purchasedMockNumbers: Iterable<number> = []
): number[] {
  if (hasAllAcademicMockAccess(user)) {
    return [...ALL_ACADEMIC_MOCK_NUMBERS];
  }

  const purchased = new Set<number>();
  for (const n of purchasedMockNumbers) {
    if (isValidAcademicMockNumber(n)) {
      purchased.add(n);
    }
  }

  return [...purchased].sort((a, b) => a - b);
}

export async function fetchPurchasedMockNumbers(
  supabase: SupabaseClient,
  studentId: string
): Promise<number[]> {
  const id = String(studentId ?? "").trim();
  if (!id) {
    return [];
  }

  const { data, error } = await supabase
    .from("mock_exam_purchases")
    .select("mock_number")
    .eq("student_id", id)
    .order("mock_number", { ascending: true });

  if (error) {
    console.error("[mockAccess/fetchPurchasedMockNumbers]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => Number(row.mock_number))
    .filter((n) => isValidAcademicMockNumber(n));
}

export async function resolveMockAccessContext(
  supabase: SupabaseClient,
  user: MockAccessUser & { id?: string | null }
): Promise<{
  purchasedMockNumbers: number[];
  accessibleMockNumbers: number[];
  hasAllMocks: boolean;
  isMockOnly: boolean;
}> {
  const purchasedMockNumbers = user.id
    ? await fetchPurchasedMockNumbers(supabase, user.id)
    : [];

  const hasAllMocks = hasAllAcademicMockAccess(user);
  const accessibleMockNumbers = resolveAccessibleMockNumbers(user, purchasedMockNumbers);

  return {
    purchasedMockNumbers,
    accessibleMockNumbers,
    hasAllMocks,
    isMockOnly: isMockOnlyPurchaseIntent(user.purchaseIntent),
  };
}
