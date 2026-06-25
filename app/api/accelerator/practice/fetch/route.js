import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidTrack } from "@/lib/accelerator/tracks";
import {
  assignAcceleratorTestToStudent,
  getFreshAcceleratorTest,
  getAcceleratorTestById,
} from "@/lib/acceleratorTestPool";

export const runtime = "nodejs";
export const maxDuration = 120;

const SECTIONS = ["listening", "reading", "writing", "speaking"];

const STUDENT_FRIENDLY_ERROR =
  "We're preparing fresh practice content. Please go back and try again in a moment.";

function serializeTest(test) {
  return {
    id: test.id,
    track: test.track,
    test_type: test.test_type,
    section: test.section,
    topic: test.topic,
    target_band: test.target_band,
    content: test.content,
    answer_key: test.answer_key,
    model_answers: test.model_answers,
    marking_rubric: test.marking_rubric,
  };
}

function studentErrorResponse(message, status = 503) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const track = body.track ?? "";
    const testType = body.testType ?? "section_practice";
    const section = body.section ?? null;
    const testId = body.testId ?? null;
    const loadOnly = body.loadOnly === true;
    const generateIfNeeded =
      body.generateIfNeeded !== false && testType === "full_mock";

    if (!isValidTrack(track)) {
      return NextResponse.json({ error: "Invalid track" }, { status: 400 });
    }

    if (testType === "section_practice" && section && !SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    if (testId) {
      const test = await getAcceleratorTestById(testId);
      if (!test || test.track !== track) {
        return NextResponse.json({ error: "Test not found" }, { status: 404 });
      }

      // Session resume: return content without re-assigning or duplicate checks
      if (loadOnly) {
        return NextResponse.json({ test: serializeTest(test), generated: false });
      }

      const assignment = await assignAcceleratorTestToStudent({
        studentId,
        test,
        track,
        testType,
        section: testType === "section_practice" ? section : null,
        markUsed: true,
        sourceActivityType: testType,
      });

      if (!assignment.ok) {
        console.warn(
          "[accelerator/practice/fetch] Blocked duplicate testId — fetching fresh replacement",
          { studentId, testId, duplicates: assignment.duplicates?.length }
        );

        const replacement = await getFreshAcceleratorTest({
          studentId,
          track,
          section: testType === "section_practice" ? section : null,
          testType,
          generateIfNeeded: false,
          markOnAssign: true,
          sourceActivityType: testType,
        });

        if (!replacement.test) {
          return studentErrorResponse(STUDENT_FRIENDLY_ERROR, 503);
        }

        return NextResponse.json({
          test: serializeTest(replacement.test),
          generated: replacement.generated,
          replacedDuplicate: true,
        });
      }

      return NextResponse.json({ test: serializeTest(test), generated: false });
    }

    const result = await getFreshAcceleratorTest({
      studentId,
      track,
      section: testType === "section_practice" ? section : null,
      testType,
      generateIfNeeded,
      markOnAssign: true,
      sourceActivityType: testType,
    });

    if (!result.test) {
      return studentErrorResponse(STUDENT_FRIENDLY_ERROR, 503);
    }

    return NextResponse.json({
      test: serializeTest(result.test),
      generated: result.generated,
    });
  } catch (err) {
    console.error("[accelerator/practice/fetch POST]", err);
    return studentErrorResponse(STUDENT_FRIENDLY_ERROR, 503);
  }
}
