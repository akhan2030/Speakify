import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { friendlyOpenAiError, isOpenAiQuotaError } from "@/lib/openaiErrors";
import { synthesizeWithElevenLabs } from "@/lib/speaking/elevenLabsTts";
import { resolveSarahVoiceTier } from "@/lib/speaking/sarahVoiceTier";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 8000;
const OPENAI_VOICE = "nova";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const text = String(body.text ?? body.speech ?? "").trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text must be under ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const voiceTier = await resolveSarahVoiceTier(userId);
    let buffer: Buffer;
    let provider: "elevenlabs" | "openai" = "openai";

    if (voiceTier === "premium") {
      try {
        buffer = await synthesizeWithElevenLabs(text);
        provider = "elevenlabs";
      } catch (elevenErr) {
        console.warn("[speaking/synthesize] ElevenLabs fallback to OpenAI:", elevenErr);
        if (!process.env.OPENAI_API_KEY) {
          throw elevenErr;
        }
        buffer = await synthesizeWithOpenAi(text);
      }
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY is not configured" },
          { status: 503 }
        );
      }
      buffer = await synthesizeWithOpenAi(text);
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, max-age=3600",
        "X-Sarah-Voice-Tier": voiceTier,
        "X-Sarah-Voice-Provider": provider,
      },
    });
  } catch (error) {
    console.error("[api/speaking/synthesize]", error);
    const status = isOpenAiQuotaError(error) ? 429 : 500;
    return NextResponse.json(
      {
        error: friendlyOpenAiError(
          error,
          "Sarah's voice is temporarily unavailable. Your browser will read the response instead."
        ),
      },
      { status }
    );
  }
}

async function synthesizeWithOpenAi(text: string): Promise<Buffer> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: OPENAI_VOICE,
    input: text,
    speed: 0.92,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  if (!buffer.length) {
    throw new Error("Empty OpenAI audio response");
  }
  return buffer;
}
