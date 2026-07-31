import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasDashboardAccess, requiresProgrammePayment, isMockOnlyPurchaseIntent } from "@/lib/payments/access";
import { normalizeEnrolledPrograms } from "@/lib/studentLoginRedirect";
import { normalizeProgramType } from "@/lib/programType";

export type GatewayBypassStatus = {
  onboardingCompleted: boolean;
  placementTestCompleted: boolean;
  hasDashboardAccess: boolean;
  requiresPayment: boolean;
  purchaseIntent?: string | null;
  isMockOnly: boolean;
};

let cachedClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}

/** Authoritative gateway/payment flags from DB (middleware + onboarding page). */
export async function fetchGatewayBypassStatus(
  userId: string
): Promise<GatewayBypassStatus | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select(
      "onboarding_completed, placement_test_completed, payment_status, payment_comped_until, enrolled_programs, program_selected, program_type, role, purchase_intent"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const programType = normalizeProgramType(data.program_type);
  const enrolledPrograms = normalizeEnrolledPrograms(data.enrolled_programs, programType);
  const accessUser = {
    role: data.role,
    paymentStatus: data.payment_status,
    paymentCompedUntil: data.payment_comped_until,
    enrolledPrograms,
    programSelected: data.program_selected,
    purchaseIntent: data.purchase_intent,
  };

  return {
    onboardingCompleted: data.onboarding_completed === true,
    placementTestCompleted: data.placement_test_completed === true,
    hasDashboardAccess: hasDashboardAccess(accessUser),
    requiresPayment: requiresProgrammePayment(accessUser),
    purchaseIntent: data.purchase_intent ?? null,
    isMockOnly: isMockOnlyPurchaseIntent(data.purchase_intent),
  };
}

export function gatewayIsComplete(status: GatewayBypassStatus | null): boolean {
  if (!status) return false;
  return status.onboardingCompleted || status.placementTestCompleted;
}
