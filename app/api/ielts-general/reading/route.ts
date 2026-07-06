import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  getBuiltinPassages,
  getFullGtReadingTest,
  getSectionPracticeBundle,
  mergeBankPassage,
  sectionKeyFromSlug,
  type GtReadingPassage,
} from "@/lib/ielts-general/readingContent";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchBankPassage(section: "A" | "B" | "C"): Promise<GtReadingPassage | null> {
  if (!process.env.SUPABASE_SERVICE_KEY) return null;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("step_practice_bank")
      .select("id, title, content, status")
      .eq("section", "gt_reading")
      .eq("status", "published")
      .order("generation_date", { ascending: false })
      .limit(12);

    if (error || !data?.length) return null;

    const saudiFirst = data
      .map((row) => mergeBankPassage(row))
      .filter((p): p is GtReadingPassage => p != null && p.section === section)
      .sort((a, b) => Number(Boolean(b.saudiContext)) - Number(Boolean(a.saudiContext)));

    return saudiFirst[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = String(searchParams.get("mode") ?? "section");
  const sectionSlug = String(searchParams.get("section") ?? "");

  if (mode === "full") {
    const bundle = getFullGtReadingTest();
    return NextResponse.json({
      mode: "full",
      durationMinutes: 60,
      passages: bundle.passages,
      questions: bundle.questions,
      sectionMeta: bundle.sectionMeta,
    });
  }

  const sectionKey = sectionKeyFromSlug(sectionSlug);
  if (!sectionKey) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const bankPassage = await fetchBankPassage(sectionKey);
  const fallback = getSectionPracticeBundle(sectionKey);
  const passage = bankPassage ?? fallback.passage;

  return NextResponse.json({
    mode: "section",
    section: sectionKey,
    meta: fallback.meta,
    passage,
    source: bankPassage ? "step_practice_bank" : "builtin",
  });
}
