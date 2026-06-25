import { NextResponse } from "next/server";
import { evaluateEssay } from "../../../lib/assistant.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const essay = body?.essay;
    const taskType = body?.taskType;

    if (typeof essay !== "string" || !essay.trim()) {
      return NextResponse.json(
        { error: "Essay is empty", success: false },
        { status: 400 }
      );
    }

    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json(
        { error: 'taskType must be "task1" or "task2"', success: false },
        { status: 400 }
      );
    }

    const evaluation = await evaluateEssay(essay, taskType);

    return NextResponse.json({ evaluation, success: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/evaluate] Error:", err?.message || err);
    return NextResponse.json(
      { error: "Something went wrong", success: false },
      { status: 500 }
    );
  }
}

