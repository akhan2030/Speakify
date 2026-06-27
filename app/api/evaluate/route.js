import { NextResponse } from "next/server";
import { evaluateEssay } from "../../../lib/assistant.js";
import {
  combineGuidedParagraphs,
  evaluateWritingParagraph,
} from "../../../lib/ielts/writingParagraphEval.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const taskType = body?.taskType;
    const mode = body?.mode || "full";

    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json(
        { error: 'taskType must be "task1" or "task2"', success: false },
        { status: 400 }
      );
    }

    if (mode === "paragraph") {
      const paragraphText = body?.paragraphText;
      const stepIndex = Number(body?.stepIndex);
      const questionPrompt = body?.questionPrompt;

      if (typeof paragraphText !== "string" || !paragraphText.trim()) {
        return NextResponse.json(
          { error: "Paragraph is empty", success: false },
          { status: 400 }
        );
      }
      if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 3) {
        return NextResponse.json(
          { error: "stepIndex must be 0–3", success: false },
          { status: 400 }
        );
      }
      if (typeof questionPrompt !== "string" || !questionPrompt.trim()) {
        return NextResponse.json(
          { error: "questionPrompt is required", success: false },
          { status: 400 }
        );
      }

      const result = await evaluateWritingParagraph({
        taskType,
        stepIndex,
        paragraphText,
        questionPrompt,
        visualType: body?.visualType,
        essayType: body?.essayType,
        p1Text: body?.p1Text ?? "",
        p2Text: body?.p2Text ?? "",
        p3Text: body?.p3Text ?? "",
      });

      return NextResponse.json({ success: true, ...result }, { status: 200 });
    }

    if (mode === "guided-final") {
      const paragraphs = body?.paragraphs;
      if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
        return NextResponse.json(
          { error: "paragraphs array is required", success: false },
          { status: 400 }
        );
      }

      const essay = combineGuidedParagraphs(paragraphs);
      if (!essay.trim()) {
        return NextResponse.json(
          { error: "Combined essay is empty", success: false },
          { status: 400 }
        );
      }

      const { evaluation, bands } = await evaluateEssay(essay, taskType);
      return NextResponse.json(
        { evaluation, bands, success: true, guided: true },
        { status: 200 }
      );
    }

    const essay = body?.essay;
    if (typeof essay !== "string" || !essay.trim()) {
      return NextResponse.json(
        { error: "Essay is empty", success: false },
        { status: 400 }
      );
    }

    const { evaluation, bands } = await evaluateEssay(essay, taskType);
    return NextResponse.json({ evaluation, bands, success: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/evaluate] Error:", err?.message || err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Something went wrong",
        success: false,
      },
      { status: 500 }
    );
  }
}
