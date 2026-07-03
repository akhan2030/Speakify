import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function normalizeWords(transcription) {
  const words = [];

  if (Array.isArray(transcription?.words)) {
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

  if (words.length === 0 && Array.isArray(transcription?.segments)) {
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

function toAudioFile(audio) {
  if (audio instanceof File) {
    const name = audio.name || "recording.webm";
    if (name.includes(".")) return audio;
    const type = audio.type || "audio/webm";
    const ext = type.includes("wav")
      ? "wav"
      : type.includes("mp4") || type.includes("m4a")
        ? "m4a"
        : "webm";
    return new File([audio], `recording.${ext}`, { type });
  }

  const type =
    typeof audio?.type === "string" && audio.type
      ? audio.type
      : "audio/webm";
  const ext = type.includes("wav")
    ? "wav"
    : type.includes("mp4") || type.includes("m4a")
      ? "m4a"
      : "webm";
  return new File([audio], `recording.${ext}`, { type });
}

async function transcribeWithFallback(openai, file) {
  // Prefer word timings for Phase 3 metrics; fall back if the API rejects the format.
  try {
    const verbose = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    });
    return {
      transcript: String(verbose.text ?? "").trim(),
      words: normalizeWords(verbose),
      duration: verbose.duration != null ? Number(verbose.duration) : undefined,
    };
  } catch (verboseError) {
    console.warn(
      "[speaking/transcribe] verbose_json failed, falling back to text:",
      verboseError?.message || verboseError
    );
  }

  try {
    const verboseSegments = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
      response_format: "verbose_json",
    });
    return {
      transcript: String(verboseSegments.text ?? "").trim(),
      words: normalizeWords(verboseSegments),
      duration:
        verboseSegments.duration != null
          ? Number(verboseSegments.duration)
          : undefined,
    };
  } catch (segmentError) {
    console.warn(
      "[speaking/transcribe] verbose segments failed, falling back to plain text:",
      segmentError?.message || segmentError
    );
  }

  const plain = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
    response_format: "json",
  });

  return {
    transcript: String(plain.text ?? "").trim(),
    words: [],
    duration: undefined,
  };
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
    const file = toAudioFile(audio);

    if (file.size < 200) {
      return NextResponse.json(
        { error: "Recording too short. Please speak a bit longer." },
        { status: 400 }
      );
    }

    console.time("[speaking/transcribe] STT whisper");
    let result;
    try {
      result = await transcribeWithFallback(openai, file);
    } finally {
      console.timeEnd("[speaking/transcribe] STT whisper");
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      words: result.words,
      duration: result.duration,
    });
  } catch (err) {
    console.error("[speaking/transcribe]", err);
    const message =
      err?.message ||
      err?.error?.message ||
      "Transcription failed. Please try speaking again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
