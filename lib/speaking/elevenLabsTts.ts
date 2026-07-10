const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

/** British female — override with ELEVENLABS_VOICE_ID in production. */
export const DEFAULT_ELEVENLABS_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";

export async function synthesizeWithElevenLabs(
  text: string,
  options?: { voiceId?: string; apiKey?: string }
): Promise<Buffer> {
  const apiKey = options?.apiKey ?? process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const voiceId =
    options?.voiceId ??
    process.env.ELEVENLABS_VOICE_ID ??
    DEFAULT_ELEVENLABS_VOICE_ID;

  const response = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.78,
        style: 0.25,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    let detail = `ElevenLabs TTS failed (${response.status})`;
    try {
      const body = await response.json();
      detail = String((body as { detail?: { message?: string } })?.detail?.message ?? detail);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) {
    throw new Error("Empty ElevenLabs audio response");
  }
  return buffer;
}
