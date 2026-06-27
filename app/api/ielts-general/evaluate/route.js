import { NextResponse } from "next/server";
import { evaluateGeneralWriting } from "@/lib/ielts-general/writingEval.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const taskType = body?.taskType;

    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json(
        { error: 'taskType must be "task1" (letter) or "task2" (essay)', success: false },
        { status: 400 }
      );
    }

    const essay = body?.essay;
    if (typeof essay !== "string" || !essay.trim()) {
      return NextResponse.json(
        { error: "Response is empty", success: false },
        { status: 400 }
      );
    }

    const { evaluation, bands } = await evaluateGeneralWriting({
      essay,
      taskType,
      letterType: body?.letterType,
      questionPrompt: body?.questionPrompt,
      essayType: body?.essayType,
    });

    return NextResponse.json({ evaluation, bands, success: true });
  } catch (err) {
    console.error("[ielts-general/evaluate]", err?.message || err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Evaluation failed",
        success: false,
      },
      { status: 500 }
    );
  }
}
