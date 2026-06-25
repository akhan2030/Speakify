import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { pickSectionPracticeContent } from "../../../../lib/listeningContentPool.js";
import { generateValidatedListeningSection } from "../../../../lib/listeningTestProvision.js";
import { getRandomTopic } from "../../../../lib/listeningGenerator.js";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
    return null;
  }
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function resolveStudentId(session, queryStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (queryStudentId && queryStudentId !== sessionId) return null;
  return sessionId;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));
    const sectionNumber = Number(searchParams.get("section"));

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![1, 2, 3, 4].includes(sectionNumber)) {
      return NextResponse.json(
        { error: "section must be 1, 2, 3, or 4" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (supabase) {
      const banked = await pickSectionPracticeContent(
        supabase,
        studentId,
        sectionNumber
      );

      if (banked) {
        const { bankRowId, testNumber, contentType, testId, ...payload } =
          banked;

        return NextResponse.json({
          success: true,
          fromBank: true,
          testId,
          testNumber,
          contentType,
          bankRowId,
          ...payload,
        });
      }
    }

    const topic = getRandomTopic(sectionNumber, []);
    const generated = await generateValidatedListeningSection(
      sectionNumber,
      topic
    );

    return NextResponse.json({
      success: true,
      fromBank: false,
      generatedLive: true,
      title: generated.title,
      section: generated.section,
      topic: generated.topic,
      transcript: generated.transcript,
      speakers: generated.speakers,
      questionType: generated.questionType,
      wordLimit: generated.wordLimit,
      questions: generated.questions,
    });
  } catch (err) {
    console.error("[listening/generate]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
