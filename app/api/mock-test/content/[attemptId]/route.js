import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateReadingExamContent,
  getFallbackExamContent,
} from "@/lib/mock-test/generateReadingContent";
import { mergeSessionIntoExamContent, readSessionState } from "@/lib/mock-test/attemptSchema";
export const runtime = "nodejs";
export const maxDuration = 120;

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request, { params }) {
  try {
    const attemptId = String(params?.attemptId ?? "").trim();
    const url = new URL(request.url);
    const wantFallback = url.searchParams.get("fallback") === "true";

    if (wantFallback || !attemptId || attemptId.startsWith("local_")) {
      return NextResponse.json({
        content: getFallbackExamContent(),
        cached: false,
        placeholder: true,
      });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        content: getFallbackExamContent(),
        cached: false,
        placeholder: true,
      });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mock_test_attempts")
      .select("exam_content")
      .eq("id", attemptId)
      .maybeSingle();

    if (error) throw error;
    const session = readSessionState(data?.exam_content);
    const cached =
      session.report?.examContent ?? data?.exam_content?.generatedExamContent;
    if (cached?.version === 1) {
      return NextResponse.json({ content: cached, cached: true, placeholder: false });
    }

    return NextResponse.json({
      content: null,
      cached: false,
      needsGeneration: true,
    });
  } catch (err) {
    console.error("[mock-test/content] GET", err);
    return NextResponse.json({
      content: getFallbackExamContent(),
      cached: false,
      placeholder: true,
      error: err instanceof Error ? err.message : "Failed to load content",
    });
  }
}

export async function POST(request, { params }) {
  try {
    const attemptId = String(params?.attemptId ?? "").trim();
    const url = new URL(request.url);
    const skipAi = url.searchParams.get("skipAi") === "true";

    const content = skipAi
      ? getFallbackExamContent()
      : await generateReadingExamContent();

    if (attemptId && !attemptId.startsWith("local_") && process.env.SUPABASE_SERVICE_KEY) {
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("mock_test_attempts")
        .select("exam_content")
        .eq("id", attemptId)
        .maybeSingle();

      const session = readSessionState(existing?.exam_content);
      const exam_content = mergeSessionIntoExamContent(existing?.exam_content, {
        report: { ...session.report, examContent: content },
      });
      await supabase
        .from("mock_test_attempts")
        .update({ exam_content })
        .eq("id", attemptId);
    }

    return NextResponse.json({
      content,
      cached: false,
      placeholder: skipAi,
    });
  } catch (err) {
    console.error("[mock-test/content] POST", err);
    return NextResponse.json({
      content: getFallbackExamContent(),
      cached: false,
      placeholder: true,
      error: err instanceof Error ? err.message : "Failed to generate content",
    });
  }
}
