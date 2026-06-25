import { NextResponse } from "next/server";
import { scoreWriting } from "@/lib/placement/aiScoring";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body.prompt ?? "").trim();
    const studentAnswer = String(body.studentAnswer ?? "").trim();
    const targetBand = Number(body.targetBand) || 5.5;

    if (!prompt || !studentAnswer) {
      return NextResponse.json(
        { error: "prompt and studentAnswer are required" },
        { status: 400 }
      );
    }

    const result = await scoreWriting(prompt, studentAnswer, targetBand);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[placement/score-writing]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 500 }
    );
  }
}
