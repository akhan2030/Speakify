import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFreshAcceleratorTest, getSupabaseAdmin } from "@/lib/acceleratorTestPool";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_TRACKS = ["foundation", "plus", "elite"];
const VALID_SECTIONS = ["listening", "reading", "writing", "speaking"];

/**
 * GET /api/accelerator/get-fresh-test?track=plus&section=reading&studentId=xxx
 * Returns a published test this student has never seen (test-level + content-level).
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const track = url.searchParams.get("track") ?? "";
    const section = url.searchParams.get("section") ?? "";
    const testType = url.searchParams.get("testType") ?? "section_practice";
    const studentId =
      url.searchParams.get("studentId") ?? session?.user?.id ?? "";

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!VALID_TRACKS.includes(track)) {
      return NextResponse.json({ error: "Invalid track" }, { status: 400 });
    }
    if (testType === "section_practice" && !VALID_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const result = await getFreshAcceleratorTest({
      studentId,
      track,
      section: testType === "section_practice" ? section : null,
      testType,
      generateIfNeeded: true,
      markOnAssign: true,
      sourceActivityType: testType,
    });

    if (!result.test) {
      return NextResponse.json({
        message: "Generating fresh content for you...",
        retry: true,
      });
    }

    await supabase.from("accelerator_test_history").upsert(
      {
        student_id: studentId,
        test_id: result.test.id,
        track,
        section: section || null,
        test_type: result.test.test_type,
        started_at: new Date().toISOString(),
      },
      { onConflict: "student_id,test_id" }
    );

    return NextResponse.json({ test: result.test, generated: result.generated });
  } catch (err) {
    console.error("[get-fresh-test]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get test" },
      { status: 500 }
    );
  }
}
