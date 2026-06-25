/** Default OpenAI request timeout for pathway lesson generation (ms). */
export const OPENAI_TIMEOUT_MS = 20000;

/**
 * Run an OpenAI chat completion with an abort timeout.
 * @throws {Error} With name "AbortError" when the request exceeds the timeout.
 */
export async function openaiChatWithTimeout(openai, params, timeoutMs = OPENAI_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await openai.chat.completions.create(params, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      const abortErr = new Error("Content generation timed out. Please try again.");
      abortErr.name = "AbortError";
      throw abortErr;
    }
    throw err;
  }
}

export function isAbortError(err) {
  return err?.name === "AbortError";
}
