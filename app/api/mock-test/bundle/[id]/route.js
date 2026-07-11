import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveAcademicMockBundle } from "@/lib/mock-test/resolveFullMockContent";

export const runtime = "nodejs";

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

/** Load resolved academic mock bundle by generated_mock_tests id. */
export async function GET(_request, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid mock id" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      const bundle = resolveAcademicMockBundle({ mockNumber: id, test_number: id });
      return NextResponse.json({ bundle });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("generated_mock_tests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Mock not found" }, { status: 404 });
    }

    const bundle = resolveAcademicMockBundle({
      ...data,
      generatedMockTestId: data.id,
    });

    return NextResponse.json({ bundle });
  } catch (err) {
    console.error("[mock-test/bundle] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load mock bundle" },
      { status: 500 }
    );
  }
}
