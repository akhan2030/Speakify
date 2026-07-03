/**
 * Request microphone access before starting a speaking session.
 * Returns true when permission is granted and a device is available.
 */
export async function checkMicrophoneAccess(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      error: "Microphone not available in this browser. Please use Google Chrome.",
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        error:
          "Microphone permission denied. Allow microphone access for this site in your browser settings, then try again.",
      };
    }
    return {
      ok: false,
      error:
        "Microphone not detected or not working. Please check your microphone settings and try again.",
    };
  }
}
