import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_CEFR_LEVEL, normalizeSpeakifyCefrLevel } from "@/lib/vocabulary";
import { getSupabase, getSupabaseUrl } from "@/lib/vocabularySupabase";
import { getTopicSummariesForLevel } from "@/lib/vocabularyStudy";
import { formatVocabTopicLabel } from "@/lib/vocabularyTopics";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cefrLevel = normalizeSpeakifyCefrLevel(
      searchParams.get("cefrLevel") || DEFAULT_CEFR_LEVEL
    );

    if (!getSupabaseUrl() || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ topics: [], cefrLevel });
    }

    const supabase = getSupabase();
    const summaries = await getTopicSummariesForLevel(supabase, cefrLevel);

    const topics = summaries.map((row) => ({
      key: row.key,
      label: formatVocabTopicLabel(row.key),
      wordCount: row.wordCount,
    }));

    return NextResponse.json({ topics, cefrLevel });
  } catch (err) {
    console.error("[vocabulary/topics]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load topics" },
      { status: 500 }
    );
  }
}
