import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { generatePassage } from "../../../../lib/passageGenerator.js";
import { buildCorrectAnswersFromContent } from "../../../../lib/passageContentAdapter.js";
import {
  isValidQuestionType,
  normalizeQuestionType,
} from "../../../../lib/readingPassageTypes.js";

export const runtime = "nodejs";

/**
 * @param {object|null|undefined} session
 * @param {string|null|undefined} queryStudentId
 */
function resolveStudentId(session, queryStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (queryStudentId && queryStudentId !== sessionId) return null;
  return sessionId;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));
    const questionType = normalizeQuestionType(
      searchParams.get("questionType") ?? ""
    );
    const testType = String(searchParams.get("testType") ?? "practice");

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isValidQuestionType(questionType)) {
      return NextResponse.json(
        { error: "Invalid question type" },
        { status: 400 }
      );
    }

    const result = await generatePassage(questionType, studentId, testType);
    const correctAnswers = buildCorrectAnswersFromContent(result.content);

    return NextResponse.json({
      success: true,
      passage: result.content,
      correctAnswers,
      bankId: result.bankId,
      generated: result.generated,
    });
  } catch (err) {
    console.error("[reading/get-passage]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load passage" },
      { status: 500 }
    );
  }
}
