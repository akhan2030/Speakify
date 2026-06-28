import { NextResponse } from "next/server";
import { STEP_EXAM_MODEL, getStepSectionQuestionCounts } from "@/lib/step/examModel";

/** Public STEP exam specification for LMS and content agents */
export async function GET() {
  return NextResponse.json({
    model: STEP_EXAM_MODEL,
    questionCounts: getStepSectionQuestionCounts(),
  });
}
