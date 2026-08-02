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
import {
  ALL_GT_MOCK_NUMBERS,
  isValidGtMockNumber,
} from "@/lib/ielts-general/gtMockCatalog";
import type { MockPurchaseProgramme } from "@/lib/payments/grantMockAccess";

export type MockAccessUser = PaymentAccessUser & {
  purchaseIntent?: string | null;
};

export type PurchaseIntent = "accelerator" | "mock_only";

export type { MockPurchaseProgramme };

/** Admin and teacher always have full mock access (QA, demos, support). */
export function isStaffMockAccessRole(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "teacher";
}

export function isMockOnlyPurchaseIntent(value: unknown): boolean {
  return isMockOnlyIntentFromAccess(value);
}

function isValidMockNumberForProgramme(
  programme: MockPurchaseProgramme,
  mockNumber: number
): boolean {
  return programme === "ielts_general"
    ? isValidGtMockNumber(mockNumber)
    : isValidAcademicMockNumber(mockNumber);
}

function allMockNumbersForProgramme(
  programme: MockPurchaseProgramme
): readonly number[] {
  return programme === "ielts_general"
    ? ALL_GT_MOCK_NUMBERS
    : ALL_ACADEMIC_MOCK_NUMBERS;
}

/** Enrolled in IELTS Academic (not GT-only). Requires explicit enrolled_programs slug. */
export function isIeltsAcademicEnrolled(user: {
  enrolledPrograms?: unknown;
  programSelected?: string | null;
}): boolean {
  const slugs = parseEnrollmentSlugs(user.enrolledPrograms);

  if (slugs.includes("ielts_general") && !slugs.includes("ielts")) {
    return false;
  }

  return slugs.includes("ielts");
}

/** Enrolled in IELTS General Training. Requires explicit enrolled_programs slug. */
export function isIeltsGeneralEnrolled(user: {
  enrolledPrograms?: unknown;
  programSelected?: string | null;
}): boolean {
  return parseEnrollmentSlugs(user.enrolledPrograms).includes("ielts_general");
}

function isProgrammeEnrolled(
  user: MockAccessUser,
  programme: MockPurchaseProgramme
): boolean {
  return programme === "ielts_general"
    ? isIeltsGeneralEnrolled(user)
    : isIeltsAcademicEnrolled(user);
}

/**
 * Full catalogue unlocked for a programme:
 * 1. admin / teacher
 * 2. Paid Accelerator on that programme
 * 3. Valid-comped / other hasDashboardAccess students on that programme
 *    who are NOT mock-only purchasers
 *
 * Mock-only buyers unlock via mock_exam_purchases rows only
 * (filtered by programme).
 */
export function hasAllMockAccessForProgramme(
  user: MockAccessUser,
  programme: MockPurchaseProgramme
): boolean {
  if (isStaffMockAccessRole(user.role)) {
    return true;
  }

  if (!isProgrammeEnrolled(user, programme)) {
    return false;
  }

  if (isMockOnlyPurchaseIntent(user.purchaseIntent)) {
    return normalizePaymentStatus(user.paymentStatus) === "paid";
  }

  return hasDashboardAccess(user);
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
  return hasAllMockAccessForProgramme(user, "ielts");
}

/** All 3 sellable GT mocks unlocked for paid/comped GT Accelerator (not mock-only). */
export function hasAllGeneralMockAccess(user: MockAccessUser): boolean {
  return hasAllMockAccessForProgramme(user, "ielts_general");
}

/**
 * Start or resume a live mock attempt — requires active entitlement.
 * Expired comp / lapsed access does NOT qualify (unless staff or purchased).
 */
export function hasMockExamStartAccessForProgramme(
  user: MockAccessUser,
  programme: MockPurchaseProgramme,
  mockNumber: number,
  purchasedMockNumbers: Iterable<number> = []
): boolean {
  if (!isValidMockNumberForProgramme(programme, mockNumber)) {
    return false;
  }

  if (isStaffMockAccessRole(user.role)) {
    return true;
  }

  if (hasAllMockAccessForProgramme(user, programme)) {
    return true;
  }

  // Purchases only unlock within a programme the student is enrolled in.
  // Prevents Academic pack numbers from unlocking GT (and vice versa) if
  // a caller accidentally passes the wrong purchase list.
  if (!isProgrammeEnrolled(user, programme)) {
    return false;
  }

  for (const n of purchasedMockNumbers) {
    if (n === mockNumber) {
      return true;
    }
  }

  return false;
}

/**
 * Start or resume Academic mock — requires active entitlement.
 * @deprecated Prefer hasMockExamStartAccessForProgramme(user, "ielts", …)
 */
export function hasMockExamStartAccess(
  user: MockAccessUser,
  mockNumber: number,
  purchasedMockNumbers: Iterable<number> = []
): boolean {
  return hasMockExamStartAccessForProgramme(
    user,
    "ielts",
    mockNumber,
    purchasedMockNumbers
  );
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
    programme?: MockPurchaseProgramme;
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

  const programme = options.programme ?? "ielts";

  if (
    options.mockNumber != null &&
    isValidMockNumberForProgramme(programme, options.mockNumber)
  ) {
    return hasMockExamStartAccessForProgramme(
      user,
      programme,
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
    programme?: MockPurchaseProgramme;
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

  const programme = options.programme ?? "ielts";
  const purchased = [...(options.purchasedMockNumbers ?? [])];
  if (purchased.length > 0) {
    return true;
  }

  return allMockNumbersForProgramme(programme).some((n) =>
    hasMockExamStartAccessForProgramme(user, programme, n, purchased)
  );
}

/** Lobby cards: mocks you can start ∪ mocks you have attempt history for. */
export function resolveVisibleMockNumbers(
  user: MockAccessUser,
  purchasedMockNumbers: Iterable<number>,
  attemptedMockNumbers: Iterable<number>,
  programme: MockPurchaseProgramme = "ielts"
): number[] {
  const visible = new Set<number>();

  for (const n of resolveAccessibleMockNumbers(
    user,
    purchasedMockNumbers,
    programme
  )) {
    visible.add(n);
  }

  for (const n of attemptedMockNumbers) {
    if (isValidMockNumberForProgramme(programme, n)) {
      visible.add(n);
    }
  }

  return [...visible].sort((a, b) => a - b);
}

/** Mock numbers this user may open (sorted). */
export function resolveAccessibleMockNumbers(
  user: MockAccessUser,
  purchasedMockNumbers: Iterable<number> = [],
  programme: MockPurchaseProgramme = "ielts"
): number[] {
  if (hasAllMockAccessForProgramme(user, programme)) {
    return [...allMockNumbersForProgramme(programme)];
  }

  const purchased = new Set<number>();
  for (const n of purchasedMockNumbers) {
    if (isValidMockNumberForProgramme(programme, n)) {
      purchased.add(n);
    }
  }

  return [...purchased].sort((a, b) => a - b);
}

/**
 * Purchased mock numbers for one programme only.
 * Academic rows must not unlock GT (and vice versa).
 */
export async function fetchPurchasedMockNumbers(
  supabase: SupabaseClient,
  studentId: string,
  programme: MockPurchaseProgramme = "ielts"
): Promise<number[]> {
  const id = String(studentId ?? "").trim();
  if (!id) {
    return [];
  }

  const { data, error } = await supabase
    .from("mock_exam_purchases")
    .select("mock_number")
    .eq("student_id", id)
    .eq("programme", programme)
    .order("mock_number", { ascending: true });

  if (error) {
    console.error("[mockAccess/fetchPurchasedMockNumbers]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => Number(row.mock_number))
    .filter((n) => isValidMockNumberForProgramme(programme, n));
}

export async function resolveMockAccessContext(
  supabase: SupabaseClient,
  user: MockAccessUser & { id?: string | null },
  programme: MockPurchaseProgramme = "ielts"
): Promise<{
  programme: MockPurchaseProgramme;
  purchasedMockNumbers: number[];
  accessibleMockNumbers: number[];
  hasAllMocks: boolean;
  isMockOnly: boolean;
}> {
  const purchasedMockNumbers = user.id
    ? await fetchPurchasedMockNumbers(supabase, user.id, programme)
    : [];

  const hasAllMocks = hasAllMockAccessForProgramme(user, programme);
  const accessibleMockNumbers = resolveAccessibleMockNumbers(
    user,
    purchasedMockNumbers,
    programme
  );

  return {
    programme,
    purchasedMockNumbers,
    accessibleMockNumbers,
    hasAllMocks,
    isMockOnly: isMockOnlyPurchaseIntent(user.purchaseIntent),
  };
}
