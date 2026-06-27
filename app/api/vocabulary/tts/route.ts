import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { friendlyOpenAiError, isOpenAiQuotaError } from "@/lib/openaiErrors";

export const runtime = "nodejs";

const MAX_WORD_LENGTH = 120;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const word = String(body.word ?? body.text ?? "").trim();

    if (!word) {
      return NextResponse.json({ error: "Word is required." }, { status: 400 });
    }

    if (word.length > MAX_WORD_LENGTH) {
      return NextResponse.json({ error: "Word is too long." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "nova",
      input: word,
      speed: 0.92,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: "Empty audio response" }, { status: 500 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[api/vocabulary/tts]", error);
    const status = isOpenAiQuotaError(error) ? 429 : 500;
    return NextResponse.json(
      {
        error: friendlyOpenAiError(
          error,
          "AI pronunciation is temporarily unavailable."
        ),
      },
      { status }
    );
  }
}
