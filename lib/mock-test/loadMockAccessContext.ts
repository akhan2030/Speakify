import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRole } from "@/lib/roles";
import {
  fetchPurchasedMockNumbers,
  hasAllMockAccessForProgramme,
  hasMockExamLobbyAccess,
  hasMockExamResultsAccess,
  hasMockExamStartAccessForProgramme,
  resolveAccessibleMockNumbers,
  resolveVisibleMockNumbers,
  type MockAccessUser,
  type MockPurchaseProgramme,
} from "@/lib/mock-test/mockAccess";

export type MockAccessContext = {
  programme: MockPurchaseProgramme;
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
  options: {
    programme?: MockPurchaseProgramme;
    hasAttemptHistory?: boolean;
    attemptedMockNumbers?: number[];
  } = {}
): Promise<MockAccessContext> {
  const programme: MockPurchaseProgramme = options.programme ?? "ielts";
  const accessUser: MockAccessUser = {
    role: normalizeRole(userRow.role),
    paymentStatus: userRow.payment_status,
    paymentCompedUntil: userRow.payment_comped_until,
    enrolledPrograms: userRow.enrolled_programs,
    programSelected: userRow.program_selected,
    purchaseIntent: userRow.purchase_intent,
  };

  const purchasedMockNumbers = await fetchPurchasedMockNumbers(
    supabase,
    userRow.id,
    programme
  );
  const hasAllMocks = hasAllMockAccessForProgramme(accessUser, programme);
  const accessibleMockNumbers = resolveAccessibleMockNumbers(
    accessUser,
    purchasedMockNumbers,
    programme
  );
  const attemptedMockNumbers = options.attemptedMockNumbers ?? [];
  const visibleMockNumbers = resolveVisibleMockNumbers(
    accessUser,
    purchasedMockNumbers,
    attemptedMockNumbers,
    programme
  );
  const canAccessLobby = hasMockExamLobbyAccess(accessUser, {
    programme,
    purchasedMockNumbers,
    hasAttemptHistory:
      options.hasAttemptHistory ?? attemptedMockNumbers.length > 0,
  });

  return {
    programme,
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
  return hasMockExamStartAccessForProgramme(
    ctx.accessUser,
    ctx.programme,
    mockNumber,
    ctx.purchasedMockNumbers
  );
}

export function canViewMockResults(
  ctx: MockAccessContext,
  mockNumber: number,
  ownsAttempt: boolean
): boolean {
  return hasMockExamResultsAccess(ctx.accessUser, {
    programme: ctx.programme,
    mockNumber,
    purchasedMockNumbers: ctx.purchasedMockNumbers,
    ownsAttempt,
  });
}
