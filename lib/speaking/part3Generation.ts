import OpenAI from "openai";

export type Part2CueCardInput = {
  id?: string;
  title: string;
  prompt: string;
  bullets: string[];
  closing?: string;
  topicCategory?: string;
};

export type SpeakingTestType =
  | "ielts_academic"
  | "ielts_general_training"
  | "pathways"
  | "practice"
  | "mock"
  | string;

export function normalizeExaminerCueCard(card: {
  id?: string;
  topic?: string;
  prompt?: string;
  bullets?: string[];
  closing?: string;
}): Part2CueCardInput | null {
  if (!card?.topic || !card?.prompt) return null;
  return {
    id: card.id,
    title: String(card.topic).trim(),
    prompt: String(card.prompt).trim(),
    bullets: Array.isArray(card.bullets) ? card.bullets.map(String) : [],
    closing: card.closing ? String(card.closing) : undefined,
  };
}

export function normalizeLegacyCueCard(card: {
  id?: number | string;
  topic?: string;
  prompt?: string;
  bullets?: string[];
}): Part2CueCardInput | null {
  if (!card?.topic || !card?.prompt) return null;
  const bullets = Array.isArray(card.bullets) ? card.bullets.map(String) : [];
  const closing =
    bullets.length > 0 && /^explain /i.test(bullets[bullets.length - 1])
      ? bullets[bullets.length - 1]
      : undefined;
  return {
    id: card.id != null ? String(card.id) : undefined,
    title: String(card.topic).trim(),
    prompt: String(card.prompt).trim(),
    bullets,
    closing,
  };
}

export function extractPart2TranscriptFromSession(transcript: unknown): string {
  const entries = Array.isArray(transcript) ? transcript : [];
  return entries
    .filter((entry) => entry?.role === "student" && Number(entry?.part) === 2)
    .map((entry) => String(entry?.text || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function buildPart3GenerationPrompt(
  cueCard: Part2CueCardInput,
  part2Transcript: string,
  testType?: SpeakingTestType
) {
  const testLabel =
    testType === "pathways"
      ? "English Pathways speaking practice"
      : testType === "ielts_general_training"
        ? "IELTS General Training"
        : "IELTS Academic";

  return `You are generating ${testLabel} Speaking Part 3 discussion questions.

Part 2 cue card topic: "${cueCard.title}"
Part 2 prompt: "${cueCard.prompt}"
Part 2 bullets: ${JSON.stringify(cueCard.bullets)}
${cueCard.closing ? `Closing bullet: "${cueCard.closing}"` : ""}
Student's Part 2 answer (for context, not scoring): "${part2Transcript || "No answer recorded yet."}"

Generate 4-6 Part 3 questions that:
- Stay thematically connected to the Part 2 topic
- Move from personal/concrete to abstract/societal
  (e.g. personal experience → general trends → opinions → comparisons across generations/cultures)
- Do NOT ask about a completely different subject
- Match the register of a real IELTS examiner
- If the student mentioned something specific in Part 2, you may reference that theme once, but keep questions general enough for any candidate

Return JSON in this exact shape:
{ "questions": ["question 1", "question 2", "..."] }`;
}

export function fallbackPart3Questions(
  cueCard: Part2CueCardInput,
  staticFallback?: string[]
): string[] {
  if (Array.isArray(staticFallback) && staticFallback.length >= 3) {
    return staticFallback.slice(0, 6);
  }

  const title = cueCard.title.toLowerCase();

  if (title.includes("help")) {
    return [
      "Why is it important for people to help others in society?",
      "Do you think people are less willing to help strangers today than in the past?",
      "Should schools teach children the value of helping others?",
      "How can communities encourage volunteering and mutual support?",
      "Do younger and older generations have different attitudes to helping others?",
    ];
  }

  if (title.includes("person") || title.includes("influence") || title.includes("inspir")) {
    return [
      "What qualities do you think make a good role model for young people?",
      "Do you think celebrities have too much influence on young people today?",
      "How can parents and teachers inspire children?",
      "Has the idea of leadership changed in modern society?",
    ];
  }

  if (title.includes("place") || title.includes("visit") || title.includes("journey") || title.includes("travel")) {
    return [
      "Why do you think people enjoy visiting new places?",
      "How has travel changed in recent years?",
      "Do you think tourism always benefits local communities?",
      "How important is it for young people to experience other cultures?",
    ];
  }

  if (title.includes("skill") || title.includes("learn") || title.includes("goal")) {
    return [
      "What skills do you think are most important in the modern workplace?",
      "Do you think formal education or practical experience is more valuable?",
      "How has technology changed the way people learn new skills?",
      "Should governments do more to support lifelong learning?",
    ];
  }

  if (title.includes("technology") || title.includes("device") || title.includes("useful")) {
    return [
      "How has technology changed everyday life in your country?",
      "Do you think people rely too much on technology nowadays?",
      "Should older people receive more help learning to use modern technology?",
      "What are the possible downsides of becoming too dependent on technology?",
    ];
  }

  if (title.includes("book") || title.includes("film")) {
    return [
      "Why do you think stories in books and films are so influential?",
      "Do you think reading is less popular today than in the past?",
      "Should schools focus more on literature and media literacy?",
      "How has streaming changed the way people consume films and books?",
    ];
  }

  return [
    `In general, why is "${cueCard.title}" an important topic for people to talk about?`,
    `How common is this kind of experience in your country today?`,
    `Has society's attitude to this topic changed over recent years?`,
    `Do you think this will become more or less important in the future?`,
    `How might this topic differ across generations or cultures?`,
  ];
}

export async function generatePart3Questions(
  openai: OpenAI | null,
  cueCard: Part2CueCardInput,
  part2Transcript = "",
  testType?: SpeakingTestType,
  staticFallback?: string[]
): Promise<string[]> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    return fallbackPart3Questions(cueCard, staticFallback);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an experienced IELTS Speaking examiner preparing authentic Part 3 discussion questions.",
        },
        {
          role: "user",
          content: buildPart3GenerationPrompt(cueCard, part2Transcript, testType),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 700,
      temperature: 0.35,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw) as { questions?: unknown };
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map((q) => String(q || "").trim()).filter(Boolean)
      : [];

    if (questions.length >= 3) {
      return questions.slice(0, 6);
    }
  } catch (error) {
    console.warn("[part3Generation] LLM generation failed:", error);
  }

  return fallbackPart3Questions(cueCard, staticFallback);
}

export function buildPart3TransitionSpeech(cueCard: Part2CueCardInput, firstQuestion: string) {
  return `We've been talking about ${cueCard.title}, and I'd like to discuss some related questions with you. ${firstQuestion}`;
}
