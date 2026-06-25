import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidTrack } from "@/lib/accelerator/tracks";
import {
  getAcceleratorTestById,
  recordAcceleratorCompletion,
} from "@/lib/acceleratorTestPool";
import {
  scoreObjectiveSection,
  scoreWritingSection,
  scoreSpeakingSection,
  overallBandFromSkills,
  buildImprovementPlan,
} from "@/lib/accelerator/scoring";

export const runtime = "nodejs";

const SECTIONS = ["listening", "reading", "writing", "speaking"];

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const track = body.track ?? "";
    const testId = body.testId ?? "";
    const testType = body.testType ?? "section_practice";
    const section = body.section ?? null;
    const answers = body.answers ?? {};
    const timeSpentMinutes = body.timeSpentMinutes ?? null;
    const sectionResults = body.sectionResults ?? null;
    const recordHistory = body.recordHistory !== false;

    if (!isValidTrack(track) || !testId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const test = await getAcceleratorTestById(testId);
    if (!test || test.track !== track) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    let result;

    if (testType === "full_mock" && sectionResults) {
      const skills = SECTIONS.map((s) => ({
        section: s,
        band: Number(sectionResults[s]?.band ?? 5),
      }));
      const overallBand = overallBandFromSkills(skills.map((s) => s.band));

      result = {
        testType: "full_mock",
        section: null,
        bandScore: overallBand,
        score: null,
        accuracy: null,
        totalQuestions: null,
        weakAreas: skills
          .filter((s) => s.band < overallBand)
          .map((s) => `${s.section}: Band ${s.band.toFixed(1)}`),
        sectionResults,
        improvementPlan: buildImprovementPlan(track, skills),
        modelAnswers: test.model_answers,
        feedback: { skills, overallBand },
      };
    } else if (!section || !SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    } else if (section === "writing") {
      const scored = scoreWritingSection(
        { task1: answers.task1, task2: answers.task2 },
        track
      );
      result = {
        testType,
        section,
        bandScore: scored.band,
        score: null,
        accuracy: null,
        totalQuestions: null,
        weakAreas: scored.weakAreas,
        modelAnswers: test.model_answers ?? test.content,
        feedback: scored,
      };
    } else if (section === "speaking") {
      const scored = scoreSpeakingSection(answers, track);
      result = {
        testType,
        section,
        bandScore: scored.band,
        score: null,
        accuracy: null,
        totalQuestions: null,
        weakAreas: scored.weakAreas,
        modelAnswers: test.model_answers ?? test.content,
        feedback: scored,
      };
    } else {
      const answerKey =
        test.answer_key ??
        test.content?.answer_key ??
        (test.content?.passages
          ? Object.fromEntries(
              (test.content.passages ?? []).map((p) => [
                `passage_${p.passage_number}`,
                p.answer_key,
              ])
            )
          : test.content?.parts
            ? Object.fromEntries(
                (test.content.parts ?? []).map((p) => [
                  `part_${p.part}`,
                  p.answer_key,
                ])
              )
            : {});

      const scored = scoreObjectiveSection(answers, answerKey);
      result = {
        testType,
        section,
        bandScore: scored.band,
        score: scored.correct,
        accuracy: scored.accuracy,
        totalQuestions: scored.total,
        weakAreas: scored.weakAreas,
        modelAnswers: test.model_answers ?? test.content,
        feedback: scored,
      };
    }

    if (recordHistory) {
      await recordAcceleratorCompletion({
        studentId,
        testId,
        track,
        testType,
        section,
        bandScore: result.bandScore,
        score: result.score,
        accuracy: result.accuracy,
        totalQuestions: result.totalQuestions,
        weakAreas: result.weakAreas,
        answers,
        feedback: result.feedback,
        timeSpentMinutes,
        completedAt: new Date().toISOString(),
        test,
        attemptId: body.attemptId ?? `${testId}:complete:${Date.now()}`,
      });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[accelerator/practice/submit POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}
