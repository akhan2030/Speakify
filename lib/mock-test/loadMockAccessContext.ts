import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRole } from "@/lib/roles";
import {
  fetchPurchasedMockNumbers,
  hasAllAcademicMockAccess,
  hasMockExamLobbyAccess,
  hasMockExamResultsAccess,
  hasMockExamStartAccess,
  resolveAccessibleMockNumbers,
  resolveVisibleMockNumbers,
  type MockAccessUser,
} from "@/lib/mock-test/mockAccess";

export type MockAccessContext = {
  accessUser: MockAccessUser;
  purchasedMockNumbers: number[];
  accessibleMockNumbers: number[];
  visibleMockNumbers: number[];
  hasAllMocks: boolean;
  canAccessLobby: boolean;
};

export async function loadMockAccessContext(
  supabase: SupabaseClient,
  userRow: {
    id: string;
    role?: string | null;
    payment_status?: string | null;
    payment_comped_until?: string | null;
    enrolled_programs?: unknown;
    program_selected?: string | null;
    purchase_intent?: string | null;
  },
  options: { hasAttemptHistory?: boolean; attemptedMockNumbers?: number[] } = {}
): Promise<MockAccessContext> {
  const accessUser: MockAccessUser = {
    role: normalizeRole(userRow.role),
    paymentStatus: userRow.payment_status,
    paymentCompedUntil: userRow.payment_comped_until,
    enrolledPrograms: userRow.enrolled_programs,
    programSelected: userRow.program_selected,
    purchaseIntent: userRow.purchase_intent,
  };

  const purchasedMockNumbers = await fetchPurchasedMockNumbers(supabase, userRow.id);
  const hasAllMocks = hasAllAcademicMockAccess(accessUser);
  const accessibleMockNumbers = resolveAccessibleMockNumbers(
    accessUser,
    purchasedMockNumbers
  );
  const attemptedMockNumbers = options.attemptedMockNumbers ?? [];
  const visibleMockNumbers = resolveVisibleMockNumbers(
    accessUser,
    purchasedMockNumbers,
    attemptedMockNumbers
  );
  const canAccessLobby = hasMockExamLobbyAccess(accessUser, {
    purchasedMockNumbers,
    hasAttemptHistory: options.hasAttemptHistory ?? attemptedMockNumbers.length > 0,
  });

  return {
    accessUser,
    purchasedMockNumbers,
    accessibleMockNumbers,
    visibleMockNumbers,
    hasAllMocks,
    canAccessLobby,
  };
}

export function canStartMock(
  ctx: MockAccessContext,
  mockNumber: number
): boolean {
  return hasMockExamStartAccess(ctx.accessUser, mockNumber, ctx.purchasedMockNumbers);
}

export function canViewMockResults(
  ctx: MockAccessContext,
  mockNumber: number,
  ownsAttempt: boolean
): boolean {
  return hasMockExamResultsAccess(ctx.accessUser, {
    mockNumber,
    purchasedMockNumbers: ctx.purchasedMockNumbers,
    ownsAttempt,
  });
}
