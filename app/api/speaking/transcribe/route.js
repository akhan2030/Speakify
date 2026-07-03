import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

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
      });
    } finally {
      console.timeEnd("[speaking/transcribe] STT whisper");
    }

    return NextResponse.json({
      success: true,
      transcript: transcription.text?.trim() ?? "",
    });
  } catch (err) {
    console.error("[speaking/transcribe]", err);
    return NextResponse.json(
      { error: err?.message ?? "Transcription failed" },
      { status: 500 }
    );
  }
}
