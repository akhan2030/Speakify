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
/** Full mock live generation may need multiple LLM calls — allow 60s. */
export const maxDuration = 60;

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
  const startedAt = Date.now();
  try {
    console.info("[listening/mock-test] start");
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    let picked = null;

    if (supabase) {
      console.info("[listening/mock-test] checking bank…");
      picked = await pickFullMockTest(supabase, studentId);
      if (picked) {
        console.info(
          `[listening/mock-test] from bank in ${Date.now() - startedAt}ms`
        );
      }
    }

    if (!picked) {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          {
            success: false,
            code: "SERVER_ERROR",
            error:
              "No banked mock available and OPENAI_API_KEY is not configured for live generation.",
          },
          { status: 503 }
        );
      }
      console.info("[listening/mock-test] live generate all 4 sections…");
      picked = await generateValidatedFullMock();
      console.info(
        `[listening/mock-test] live generate done in ${Date.now() - startedAt}ms`
      );
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
    console.error(
      `[listening/mock-test] failed after ${Date.now() - startedAt}ms`,
      err
    );
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
