import { createClient } from "@supabase/supabase-js";
import { hasDashboardAccess } from "@/lib/payments/access";

export type SarahVoiceTier = "premium" | "standard";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function elevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

/** Paid / comped IELTS Academic + General Training students get ElevenLabs when configured. */
export async function resolveSarahVoiceTier(userId: string): Promise<SarahVoiceTier> {
  if (!elevenLabsConfigured()) return "standard";

  try {
    const supabase = getSupabase();
    const { data: user } = await supabase
      .from("users")
      .select("role, payment_status, payment_comped_until, enrolled_programs, program_selected")
      .eq("id", userId)
      .maybeSingle();

    if (!user) return "standard";

    const role = String(user.role ?? "student").toLowerCase();
    if (role === "admin" || role === "teacher") return "premium";

    if (
      hasDashboardAccess({
        role,
        paymentStatus: user.payment_status,
        paymentCompedUntil: user.payment_comped_until,
        enrolledPrograms: user.enrolled_programs,
        programSelected: user.program_selected,
      })
    ) {
      return "premium";
    }
  } catch (err) {
    console.warn("[sarahVoiceTier]", err);
  }

  return "standard";
}
