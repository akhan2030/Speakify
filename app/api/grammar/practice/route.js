import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  answersMatch,
  getPracticePool,
  pickPracticeQuestions,
} from "@/lib/grammarContent";

export const runtime = "nodejs";

function parseProgramme(value) {
  return value === "general" ? "general" : "academic";
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programme = parseProgramme(searchParams.get("programme"));
    const focusRaw = String(searchParams.get("focus") ?? "").trim();
    const focusCategories = focusRaw
      ? focusRaw.split(",").map((part) => part.trim()).filter(Boolean)
      : [];

    const questions = pickPracticeQuestions(10, programme, {
      focusCategories,
    }).map((q) => ({
      id: `${q.category}-${q.id}`,
      exerciseId: q.id,
      category: q.category,
      categoryName: q.categoryName,
      type: q.type,
      prompt: q.prompt,
      hint: q.hint ?? null,
    }));

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[grammar/practice] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load practice" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const programme = parseProgramme(body?.programme);
    const submissions = Array.isArray(body?.answers) ? body.answers : [];

    const poolById = new Map(
      getPracticePool(programme).map((q) => [`${q.category}-${q.id}`, q])
    );

    let correct = 0;
    const results = [];
    const weakByCategory = {};

    for (const sub of submissions) {
      const id = String(sub?.id ?? "");
      const studentAnswer = String(sub?.answer ?? "").trim();
      const question = poolById.get(id);
      if (!question) continue;

      const isCorrect = answersMatch(studentAnswer, question.modelAnswer);
      if (isCorrect) correct += 1;
      else {
        weakByCategory[question.categoryName] =
          (weakByCategory[question.categoryName] ?? 0) + 1;
      }

      results.push({
        id,
        correct: isCorrect,
        modelAnswer: question.modelAnswer,
        categoryName: question.categoryName,
      });
    }

    const total = results.length || 1;
    const scorePercent = Math.round((correct / total) * 100);

    const weakAreas = Object.entries(weakByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      correct,
      total: results.length,
      scorePercent,
      results,
      weakAreas,
    });
  } catch (err) {
    console.error("[grammar/practice] POST", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to score practice" },
      { status: 500 }
    );
  }
}
