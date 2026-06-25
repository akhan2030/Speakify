import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  BANK_SETUP_HINT,
  CONTENT_TYPE_FULL_MOCK,
  pickFullMockTest,
} from "../../../../lib/listeningContentPool.js";
import { generateValidatedFullMock } from "../../../../lib/listeningTestProvision.js";

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

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    let picked = null;

    if (supabase) {
      picked = await pickFullMockTest(supabase, studentId);
    }

    if (!picked) {
      picked = await generateValidatedFullMock();
    }

    const sectionsPayload = {};
    for (const [key, section] of Object.entries(picked.sections)) {
      const rest = { ...section };
      delete rest.bankRowId;
      delete rest.testNumber;
      delete rest.contentType;
      sectionsPayload[key] = rest;
    }

    return NextResponse.json({
      success: true,
      fromBank: !picked.generatedLive,
      generatedLive: Boolean(picked.generatedLive),
      testId: picked.testId,
      testNumber: picked.testNumber,
      contentType: CONTENT_TYPE_FULL_MOCK,
      sections: sectionsPayload,
    });
  } catch (err) {
    console.error("[listening/mock-test]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load mock test";
    const isSetup = message.includes("not set up") || message.includes(BANK_SETUP_HINT);
    return NextResponse.json(
      {
        success: false,
        code: isSetup ? "BANK_SETUP_REQUIRED" : "SERVER_ERROR",
        error: message,
      },
      { status: isSetup ? 503 : 500 }
    );
  }
}
