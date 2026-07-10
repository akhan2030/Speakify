import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidTrack } from "@/lib/accelerator/tracks";
import {
  getAcceleratorTestById,
  recordAcceleratorCompletion,
} from "@/lib/acceleratorTestPool";
import {
  overallBandFromSkills,
  buildImprovementPlan,
} from "@/lib/accelerator/scoring";
import { scoreAcceleratorSection } from "@/lib/accelerator/serverEvaluate";

export const runtime = "nodejs";
export const maxDuration = 120;

const SECTIONS = ["listening", "reading", "writing", "speaking"];

function collectAnswerKey(test, section) {
  if (section === "writing" || section === "speaking") return null;

  const content = test.content ?? {};
  const sectionContent =
    test.test_type === "full_mock" && content[section]
      ? content[section]
      : content;

  return (
    test.answer_key ??
    sectionContent?.answer_key ??
    (sectionContent?.passages
      ? Object.fromEntries(
          (sectionContent.passages ?? []).map((p) => [
            `passage_${p.passage_number}`,
            p.answer_key,
          ])
        )
      : sectionContent?.parts
        ? Object.fromEntries(
            (sectionContent.parts ?? []).map((p) => [`part_${p.part}`, p.answer_key])
          )
        : {})
  );
}

function writingPrompts(test, sectionAnswers) {
  const content = test.content ?? {};
  const writingContent =
    test.test_type === "full_mock" && content.writing
      ? content.writing
      : content;

  return {
    task1:
      String(
        (writingContent.task1 as Record<string, unknown>)?.prompt ??
          sectionAnswers?.task1Prompt ??
          ""
      ) || undefined,
    task2:
      String(
        (writingContent.task2 as Record<string, unknown>)?.prompt ??
          sectionAnswers?.task2Prompt ??
          ""
      ) || undefined,
  };
}

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
    const allSectionAnswers = body.allSectionAnswers ?? null;
    const timeSpentMinutes = body.timeSpentMinutes ?? null;
    const speakingSessionId = body.sessionId ?? body.speakingSessionId ?? null;
    const recordHistory = body.recordHistory !== false;

    if (body.score != null || body.bandScore != null) {
      console.warn("[accelerator/practice/submit] Ignoring client-supplied score");
    }

    if (!isValidTrack(track) || !testId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const test = await getAcceleratorTestById(testId);
    if (!test || test.track !== track) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    let result;

    if (testType === "full_mock" && (allSectionAnswers || body.sectionResults)) {
      const sectionAnswers =
        allSectionAnswers && typeof allSectionAnswers === "object"
          ? allSectionAnswers
          : {};

      const skills = [];
      const sectionResults = {};

      for (const s of SECTIONS) {
        const sectionData = sectionAnswers[s] ?? {};
        const sectionAnswerPayload =
          s === "writing"
            ? {
                task1: sectionData.task1 ?? "",
                task2: sectionData.task2 ?? "",
              }
            : (sectionData.answers ?? sectionData);

        const scored = await scoreAcceleratorSection({
          section: s,
          answers: sectionAnswerPayload,
          answerKey: collectAnswerKey(test, s),
          track,
          studentId,
          sessionId: s === "speaking" ? speakingSessionId : null,
          taskPrompt: s === "writing" ? writingPrompts(test, sectionData) : undefined,
        });

        skills.push({ section: s, band: scored.band });
        sectionResults[s] = { band: scored.band, feedback: scored.feedback };
      }

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
        serverEvaluated: true,
      };
    } else if (!section || !SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    } else {
      const sectionAnswers =
        section === "writing"
          ? { task1: answers.task1, task2: answers.task2 }
          : answers;

      const scored = await scoreAcceleratorSection({
        section,
        answers: sectionAnswers,
        answerKey: collectAnswerKey(test, section),
        track,
        studentId,
        sessionId: section === "speaking" ? speakingSessionId : null,
        taskPrompt: section === "writing" ? writingPrompts(test, answers) : undefined,
      });

      result = {
        testType,
        section,
        bandScore: scored.band,
        score: scored.score ?? null,
        accuracy: scored.accuracy ?? null,
        totalQuestions: scored.totalQuestions ?? null,
        weakAreas: scored.weakAreas,
        modelAnswers: test.model_answers ?? test.content,
        feedback: scored.feedback,
        serverEvaluated: true,
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
