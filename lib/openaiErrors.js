/**
 * Detect OpenAI quota / rate-limit failures for user-friendly fallbacks.
 */
export function isOpenAiQuotaError(err) {
  if (!err) return false;
  const status = err.status ?? err.statusCode;
  if (status === 429) return true;
  const message = String(err.message ?? err.error?.message ?? err).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("insufficient_quota") ||
    message.includes("billing")
  );
}

export function friendlyOpenAiError(err, fallback) {
  if (isOpenAiQuotaError(err)) {
    return (
      fallback ??
      "AI services are temporarily unavailable. Please try again later or continue with offline features."
    );
  }
  return err instanceof Error ? err.message : String(err ?? "Request failed");
}
