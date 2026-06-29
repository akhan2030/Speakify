import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchBusinessEnglishModules } from "@/lib/businessEnglishLms";
import { getSupabase, getSupabaseUrl } from "@/lib/vocabularySupabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!getSupabaseUrl() || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ modules: [] });
    }

    const supabase = getSupabase();
    const modules = await fetchBusinessEnglishModules(supabase);

    return NextResponse.json({ modules });
  } catch (err) {
    console.error("[business-english/modules]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load modules" },
      { status: 500 }
    );
  }
}
