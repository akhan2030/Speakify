import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUnitContent } from "@/lib/classroom/content";
import { loadUnitContentBySlug } from "@/lib/classroom/contentLoader";
import { scoreQuiz, type ScoreableQuestion } from "@/lib/classroom/quizEngine";
import { getLevelBySlug, getLevelByCode } from "@/lib/classroom/levels";
import { normalizeRole } from "@/lib/roles";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = normalizeRole((session?.user as { role?: string })?.role);
  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const levelCodeRaw = String(body?.levelCode ?? body?.levelSlug ?? "");
  const unitSlug = body?.unitSlug ? String(body.unitSlug) : "";
  const unitNumber = Number(body?.unitNumber);
  const answers =
    body?.answers && typeof body.answers === "object"
      ? (body.answers as Record<string, unknown>)
      : {};

  const level =
    getLevelByCode(levelCodeRaw) ?? getLevelBySlug(levelCodeRaw);
  if (!level) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  let questions: ScoreableQuestion[] = [];

  if (unitSlug) {
    const loaded = loadUnitContentBySlug(level.slug, unitSlug);
    if (loaded?.quiz?.questions?.length) {
      questions = loaded.quiz.questions.map((q) => ({
        id: q.id,
        type: String(q.type ?? "mcq"),
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        pairs: q.pairs,
        points: q.points,
      }));
    }
  }

  if (questions.length === 0 && Number.isFinite(unitNumber)) {
    const loaded = loadUnitContentBySlug(level.slug, `unit-${unitNumber}`);
    if (loaded?.quiz?.questions?.length) {
      questions = loaded.quiz.questions.map((q) => ({
        id: q.id,
        type: String(q.type ?? "mcq"),
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        pairs: q.pairs,
        points: q.points,
      }));
    }
  }

  if (questions.length === 0 && Number.isFinite(unitNumber)) {
    const pilot = getUnitContent(level.code, unitNumber);
    if (pilot?.quiz.questions?.length) {
      questions = pilot.quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        points: q.points,
      }));
    }
  }

  if (questions.length === 0) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const scored = scoreQuiz(questions, answers);

  return NextResponse.json({
    ...scored,
    userId: (session.user as { id?: string }).id ?? null,
    levelCode: level.code,
    unitNumber: Number.isFinite(unitNumber) ? unitNumber : null,
    unitSlug: unitSlug || null,
  });
}
