import { NextResponse } from "next/server";
import OpenAI from "openai";
import { scoreSpeaking } from "@/lib/placement/aiScoring";
import { isOpenAiQuotaError } from "@/lib/openaiErrors.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const targetBand = Number(formData.get("targetBand")) || 5.5;

    if (!audio || typeof audio === "string") {
      return NextResponse.json(
        { error: "Audio recording is required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI is not configured." },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const blob = audio;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const mime = blob.type || "audio/webm";
    const ext = mime.includes("mp4") ? "mp4" : mime.includes("wav") ? "wav" : "webm";

    const file = new File([buffer], `speaking.${ext}`, { type: mime });

    let transcript = "";
    try {
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: "en",
      });
      transcript = transcription.text?.trim() ?? "";
    } catch (err) {
      console.error("[placement/score-speaking] transcription fallback", err);
      if (isOpenAiQuotaError(err)) {
        const score = await scoreSpeaking("", targetBand);
        return NextResponse.json({
          ...score,
          transcript: "",
        });
      }
      throw err;
    }

    const score = await scoreSpeaking(transcript, targetBand);

    return NextResponse.json({
      ...score,
      transcript,
    });
  } catch (err) {
    console.error("[placement/score-speaking]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Speaking scoring failed" },
      { status: 500 }
    );
  }
}
