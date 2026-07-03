import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function normalizeWords(transcription) {
  const words = [];

  if (Array.isArray(transcription.words)) {
    for (const word of transcription.words) {
      const token = String(word.word || word.text || "").trim();
      if (!token) continue;
      words.push({
        word: token,
        start: Number(word.start) || 0,
        end: Number(word.end) || 0,
        confidence:
          word.confidence != null
            ? Number(word.confidence)
            : word.probability != null
              ? Number(word.probability)
              : undefined,
      });
    }
  }

  // Fallback: segment-level timing when word timestamps are missing.
  if (words.length === 0 && Array.isArray(transcription.segments)) {
    for (const segment of transcription.segments) {
      const tokens = String(segment.text || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const start = Number(segment.start) || 0;
      const end = Number(segment.end) || start;
      const span = Math.max(0.1, end - start);
      tokens.forEach((token, index) => {
        const t0 = start + (span * index) / tokens.length;
        const t1 = start + (span * (index + 1)) / tokens.length;
        words.push({
          word: token,
          start: t0,
          end: t1,
          confidence:
            segment.avg_logprob != null
              ? Math.max(0, Math.min(1, 1 + Number(segment.avg_logprob) / 5))
              : undefined,
        });
      });
    }
  }

  return words;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Transcription service not configured" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || typeof audio === "string") {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file =
      audio instanceof File
        ? audio
        : new File([audio], "recording.webm", { type: "audio/webm" });

    console.time("[speaking/transcribe] STT whisper");
    let transcription;
    try {
      transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: "en",
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
      });
    } finally {
      console.timeEnd("[speaking/transcribe] STT whisper");
    }

    const transcript = String(transcription.text ?? "").trim();
    const words = normalizeWords(transcription);

    return NextResponse.json({
      success: true,
      transcript,
      words,
      duration:
        transcription.duration != null ? Number(transcription.duration) : undefined,
    });
  } catch (err) {
    console.error("[speaking/transcribe]", err);
    return NextResponse.json(
      { error: err?.message ?? "Transcription failed" },
      { status: 500 }
    );
  }
}
