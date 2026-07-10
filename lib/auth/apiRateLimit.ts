import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_WINDOW_MS = 60 * 1000;

export async function isApiRateLimited(
  supabase: SupabaseClient,
  key: string,
  windowMs = DEFAULT_WINDOW_MS
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();

  const { data, error } = await supabase
    .from("api_rate_limits")
    .select("called_at")
    .eq("key", key)
    .gte("called_at", since)
    .maybeSingle();

  if (error) {
    if (error.message?.includes("api_rate_limits")) {
      return false;
    }
    console.warn("[apiRateLimit]", error.message);
    return false;
  }

  return Boolean(data);
}

export async function recordApiRateLimit(
  supabase: SupabaseClient,
  key: string
): Promise<void> {
  const { error } = await supabase.from("api_rate_limits").upsert(
    { key, called_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error && !error.message?.includes("api_rate_limits")) {
    console.warn("[apiRateLimit:record]", error.message);
  }
}
