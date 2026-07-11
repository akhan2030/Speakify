import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { buildQuestionGroups } from "@/lib/listeningQuestionGroups";
import { generateMultiVoiceAudio } from "@/lib/listeningTts";
import { resolveTranscriptAudioSlice } from "@/lib/listeningTranscriptSplit";
import { normalizeSpeakersFromPayload } from "@/lib/listeningSpeakerProfiles.js";
import { applySpeakerIdentitiesToPayload } from "@/lib/listeningSpeakerIdentity.js";
import { assertNoQuestionZeroInUserText } from "@/lib/listeningUserFacingValidation.js";
import { friendlyOpenAiError, isOpenAiQuotaError } from "@/lib/openaiErrors.js";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 12000;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const isPlacement = Boolean(body?.placement);
    const isMockTest = Boolean(body?.mockTest);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !isPlacement && !isMockTest) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { success: false, error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }
    const text = String(body?.text ?? body?.transcript ?? "").trim();
    const isAnnouncement = Boolean(body?.announcement);
    const sectionNumber = Number(body?.sectionNumber ?? body?.section ?? 0);
    const audioPart = String(body?.audioPart ?? "full").toLowerCase();
    const questions = Array.isArray(body?.questions) ? body.questions : [];
    const rawSpeakers = Array.isArray(body?.speakers) ? body.speakers : [];
    let speakSourceText = text;
    let speakers = rawSpeakers;

    if (!isAnnouncement && sectionNumber >= 1) {
      const refreshed = applySpeakerIdentitiesToPayload(
        {
          section: sectionNumber,
          transcript: text,
          speakers: rawSpeakers,
          testId: body?.testId ?? body?.sessionId,
        },
        {
          testSeed: String(body?.testId ?? body?.sessionId ?? `tts-s${sectionNumber}`),
          source: "tts_route",
        }
      );
      speakers = refreshed.speakers ?? rawSpeakers;
      speakSourceText = refreshed.transcript ?? text;
    } else if (rawSpeakers.length > 0) {
      speakers = normalizeSpeakersFromPayload(rawSpeakers, sectionNumber);
    }

    if (!text) {
      return Response.json(
        { success: false, error: "Text is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (isAnnouncement) {
      try {
        assertNoQuestionZeroInUserText(text);
      } catch (err) {
        return Response.json(
          {
            success: false,
            error:
              err instanceof Error
                ? err.message
                : "Invalid announcement text (question numbering)",
          },
          { status: 400 }
        );
      }
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return Response.json(
        {
          success: false,
          error: `Text must be under ${MAX_TEXT_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let buffer;
    let timeline = [];

    if (isAnnouncement) {
      const voice = String(body?.voice ?? "alloy").toLowerCase();
      const speed = Number(body?.speed ?? 0.95);
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: ["alloy", "nova", "shimmer", "onyx", "echo", "fable"].includes(
          voice
        )
          ? voice
          : "alloy",
        input: text,
        speed: Math.min(4, Math.max(0.25, speed)),
      });
      buffer = Buffer.from(await mp3.arrayBuffer());
    } else {
      const groups = buildQuestionGroups(questions, sectionNumber);
      const speakText = resolveTranscriptAudioSlice(
        speakSourceText,
        questions,
        audioPart,
        groups
      );

      if (!speakText.trim()) {
        return Response.json(
          { success: false, error: "Transcript has no speakable content" },
          { status: 400 }
        );
      }

      const result = await generateMultiVoiceAudio(
        openai,
        speakText,
        sectionNumber,
        speakers,
        isMockTest ? { model: "tts-1" } : undefined
      );
      buffer = result.buffer;
      timeline = result.timeline ?? [];
    }

    if (!buffer?.length) {
      return Response.json(
        { success: false, error: "Transcript has no speakable content" },
        { status: 400 }
      );
    }

    const headers = {
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.byteLength.toString(),
      "Cache-Control": "public, max-age=3600",
    };

    if (timeline?.length > 0) {
      headers["X-Speaker-Timeline"] = encodeURIComponent(
        JSON.stringify(timeline)
      );
    }

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[listening/tts]", error);
    const status = isOpenAiQuotaError(error) ? 429 : 500;
    const message = friendlyOpenAiError(
      error,
      "AI audio is temporarily unavailable. Your browser will read the transcript instead."
    );
    return Response.json(
      { success: false, error: message },
      { status }
    );
  }
}
