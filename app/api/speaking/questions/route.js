import { NextResponse } from "next/server";
import {
  PART1_TOPICS,
  PART2_CUECARDS,
  getRandomPart1Topic,
  getRandomPart1Questions,
  getRandomCueCard,
  getPart3Questions,
  getTopicById,
  getCueCardById,
  getQuestionsForPart,
} from "../../../../lib/speakingQuestions.js";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const part = searchParams.get("part");
  const topicId = searchParams.get("topicId");
  const cueCardId = searchParams.get("cueCardId");
  const count = Number(searchParams.get("count") ?? 4);
  const excludeIds = searchParams.get("excludeIds");

  if (part === "part1" && topicId) {
    const topic = getTopicById(Number(topicId));
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    return NextResponse.json({
      topic,
      questions: getRandomPart1Questions(Number(topicId), count),
    });
  }

  if (part === "part1" && searchParams.get("random") === "true") {
    const topic = getRandomPart1Topic();
    return NextResponse.json({
      topic,
      questions: getRandomPart1Questions(topic.id, count),
    });
  }

  if (part === "part2") {
    const excluded = excludeIds
      ? excludeIds.split(",").map((id) => Number(id.trim())).filter(Boolean)
      : [];
    const cueCard = getRandomCueCard(excluded);
    return NextResponse.json({ cueCard });
  }

  if (part === "part3" && cueCardId) {
    return NextResponse.json({
      questions: getPart3Questions(Number(cueCardId)),
      cueCard: getCueCardById(Number(cueCardId)),
    });
  }

  if (cueCardId) {
    const cueCard = getCueCardById(Number(cueCardId));
    if (!cueCard) {
      return NextResponse.json({ error: "Cue card not found" }, { status: 404 });
    }
    return NextResponse.json({ cueCard });
  }

  if (topicId) {
    const topic = getTopicById(Number(topicId));
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    return NextResponse.json({ topic });
  }

  if (part) {
    return NextResponse.json(getQuestionsForPart(part));
  }

  return NextResponse.json({
    part1Topics: PART1_TOPICS,
    part2CueCards: PART2_CUECARDS,
  });
}
