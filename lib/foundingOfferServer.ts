import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FOUNDING_50_FALLBACK_SPOTS_REMAINING,
  FOUNDING_50_TOTAL_SPOTS,
} from "@/lib/discounts";
import { randomUUID } from "crypto";

export type FoundingSpotStatus = {
  ok: boolean;
  spotsRemaining: number;
  claimed: number;
  source: "database" | "fallback";
  reason?: string;
};

export type FoundingReservationResult =
  | {
      ok: true;
      reservationToken: string;
      claimed: number;
      spotsRemaining: number;
    }
  | {
      ok: false;
      reason: "full" | "unavailable" | "missing_token";
      claimed: number;
      spotsRemaining: number;
    };

function parseRpcPayload(data: unknown): Record<string, unknown> | null {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof data === "object") return data as Record<string, unknown>;
  return null;
}

/** Live active claim count (confirmed + non-expired reserved). */
export async function getFoundingSpotStatus(
  supabase: SupabaseClient
): Promise<FoundingSpotStatus> {
  try {
    const { data, error } = await (supabase as any).rpc(
      "founding_active_claim_count"
    );
    if (error || data == null) {
      return {
        ok: false,
        spotsRemaining: FOUNDING_50_FALLBACK_SPOTS_REMAINING,
        claimed: FOUNDING_50_TOTAL_SPOTS - FOUNDING_50_FALLBACK_SPOTS_REMAINING,
        source: "fallback",
        reason: error?.message ?? "rpc_unavailable",
      };
    }
    const claimed = Math.max(0, Number(data) || 0);
    return {
      ok: true,
      claimed,
      spotsRemaining: Math.max(0, FOUNDING_50_TOTAL_SPOTS - claimed),
      source: "database",
    };
  } catch (err) {
    return {
      ok: false,
      spotsRemaining: FOUNDING_50_FALLBACK_SPOTS_REMAINING,
      claimed: FOUNDING_50_TOTAL_SPOTS - FOUNDING_50_FALLBACK_SPOTS_REMAINING,
      source: "fallback",
      reason: err instanceof Error ? err.message : "error",
    };
  }
}

/**
 * Atomically reserve one shared Founding 50 spot before charging the discount.
 * Uses pg_advisory_xact_lock inside the SQL function so concurrent checkouts
 * cannot both take the last spot.
 */
export async function reserveFoundingSpot(
  supabase: SupabaseClient,
  input: { studentId: string; productId: string }
): Promise<FoundingReservationResult> {
  const reservationToken = randomUUID();
  try {
    const { data, error } = await (supabase as any).rpc("reserve_founding_spot", {
      p_student_id: input.studentId,
      p_product_id: input.productId,
      p_reservation_token: reservationToken,
    });

    if (error) {
      console.warn("[foundingOffer] reserve rpc failed", error.message);
      return {
        ok: false,
        reason: "unavailable",
        claimed: FOUNDING_50_TOTAL_SPOTS,
        spotsRemaining: 0,
      };
    }

    const payload = parseRpcPayload(data);
    if (!payload || payload.ok !== true) {
      const claimed = Number(payload?.claimed ?? FOUNDING_50_TOTAL_SPOTS);
      return {
        ok: false,
        reason: "full",
        claimed,
        spotsRemaining: Math.max(0, FOUNDING_50_TOTAL_SPOTS - claimed),
      };
    }

    return {
      ok: true,
      reservationToken,
      claimed: Number(payload.claimed ?? 0),
      spotsRemaining: Number(
        payload.spots_remaining ??
          Math.max(0, FOUNDING_50_TOTAL_SPOTS - Number(payload.claimed ?? 0))
      ),
    };
  } catch (err) {
    console.warn("[foundingOffer] reserve failed", err);
    return {
      ok: false,
      reason: "unavailable",
      claimed: FOUNDING_50_TOTAL_SPOTS,
      spotsRemaining: 0,
    };
  }
}

export async function attachFoundingPayment(
  supabase: SupabaseClient,
  reservationToken: string,
  paymentId: string
): Promise<void> {
  try {
    await (supabase as any).rpc("attach_founding_payment", {
      p_reservation_token: reservationToken,
      p_payment_id: paymentId,
    });
  } catch (err) {
    console.warn("[foundingOffer] attach payment failed", err);
  }
}

export async function releaseFoundingReservation(
  supabase: SupabaseClient,
  reservationToken: string | null | undefined
): Promise<void> {
  if (!reservationToken) return;
  try {
    await (supabase as any).rpc("release_founding_reservation", {
      p_reservation_token: reservationToken,
    });
  } catch (err) {
    console.warn("[foundingOffer] release failed", err);
  }
}

export async function confirmFoundingClaim(
  supabase: SupabaseClient,
  input: { studentId: string; productId: string; paymentId: string }
): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any).rpc("confirm_founding_claim", {
      p_student_id: input.studentId,
      p_product_id: input.productId,
      p_payment_id: input.paymentId,
    });
    if (error) {
      console.warn("[foundingOffer] confirm failed", error.message);
      return false;
    }
    const payload = parseRpcPayload(data);
    return payload?.ok === true;
  } catch (err) {
    console.warn("[foundingOffer] confirm error", err);
    return false;
  }
}
