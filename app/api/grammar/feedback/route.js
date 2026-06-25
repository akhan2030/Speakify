import { NextResponse } from "next/server";
import { getGrammarFeedback } from "@/lib/grammarOpenai";
import { isGrammarCategorySlug } from "@/lib/grammar";
import { answersMatch, getLessonContent } from "@/lib/grammarContent";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const category = String(body?.category ?? "").trim();
    const exerciseId = String(body?.exerciseId ?? "").trim();
    const answer = String(body?.answer ?? "").trim();

    if (!isGrammarCategorySlug(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!answer) {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }

    const lesson = getLessonContent(category);
    const exercise = lesson.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const quickMatch = answersMatch(answer, exercise.modelAnswer);

    if (quickMatch) {
      return NextResponse.json({
        correct: true,
        feedback: "Excellent — your answer matches the expected grammar pattern.",
        suggestion: exercise.modelAnswer,
        usedAi: false,
      });
    }

    const ai = await getGrammarFeedback({
      category,
      exercisePrompt: exercise.prompt,
      modelAnswer: exercise.modelAnswer,
      studentAnswer: answer,
    });

    return NextResponse.json({
      ...ai,
      usedAi: true,
    });
  } catch (err) {
    console.error("[grammar/feedback]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Feedback failed" },
      { status: 500 }
    );
  }
}
