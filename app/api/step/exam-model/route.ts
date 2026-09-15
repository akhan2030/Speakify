import { NextResponse } from "next/server";
import { STEP_EXAM_MODEL, getStepSectionQuestionCounts } from "@/lib/step/examModel";
import {
  STEP_OFFICIAL_SOURCES,
  STEP_REGISTRATION_POLICY,
  STEP_SOURCE_CHECKLIST,
  STEP_STRUCTURE_CODE_TOUCHPOINTS,
} from "@/lib/step/officialBlueprint";

/** Public STEP exam specification for LMS and content agents */
export async function GET() {
  return NextResponse.json({
    model: STEP_EXAM_MODEL,
    questionCounts: getStepSectionQuestionCounts(),
    officialSources: STEP_OFFICIAL_SOURCES,
    sourceChecklist: STEP_SOURCE_CHECKLIST,
    codeTouchpointsWhenACurrentSourceArrives: STEP_STRUCTURE_CODE_TOUCHPOINTS,
    registrationPolicy: STEP_REGISTRATION_POLICY,
  });
}
