import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getQuestionById } from "@/lib/placement/questionBank";
import { gradeObjectiveAnswer } from "@/lib/placement/adaptiveEngine";
import { isValidQuestion } from "@/lib/placement/isValidQuestion";
import { isOpenAiQuotaError } from "@/lib/openaiErrors.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const questionId = String(body.questionId ?? "").trim();
    const studentAnswer = String(body.studentAnswer ?? "").trim();

    if (!questionId || !studentAnswer) {
      return NextResponse.json(
        { error: "questionId and studentAnswer are required" },
        { status: 400 }
      );
    }

    const question = getQuestionById(questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (question.type === "mcq" && !isValidQuestion(question)) {
      return NextResponse.json(
        { error: "invalid_question", skip: true },
        { status: 422 }
      );
    }

    const quick = gradeObjectiveAnswer(question, studentAnswer);
    if (quick) {
      return NextResponse.json({
        correct: true,
        feedback: "Your answer matches the expected form.",
        correct_answer: question.correct,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        correct: false,
        feedback: "Compare your answer with the model solution and try similar structures.",
        correct_answer: question.correct,
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    let parsed = {};
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an IELTS placement examiner. Decide if the student's answer is acceptable for the exercise (meaning and grammar). Saudi Arabic L1 context. Return JSON only: {"correct":boolean,"feedback":string,"correct_answer":string}`,
          },
          {
            role: "user",
            content: `Question: ${question.question}\nModel answer: ${question.correct}\nStudent answer: ${studentAnswer}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }
    } catch (err) {
      console.error("[placement/check-answer] AI fallback", err);
      return NextResponse.json({
        correct: false,
        feedback: isOpenAiQuotaError(err)
          ? "AI checking is temporarily unavailable. Compare your answer with the model solution."
          : "We couldn't verify your answer automatically. Compare with the model solution.",
        correct_answer: question.correct,
      });
    }

    return NextResponse.json({
      correct: Boolean(parsed.correct),
      feedback: String(parsed.feedback ?? question.explanation),
      correct_answer: String(parsed.correct_answer ?? question.correct),
    });
  } catch (err) {
    console.error("[placement/check-answer]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Check failed" },
      { status: 500 }
    );
  }
}
