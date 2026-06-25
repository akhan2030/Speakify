import OpenAI from "openai";

export async function getGrammarFeedback({
  category,
  exercisePrompt,
  modelAnswer,
  studentAnswer,
}) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      correct: false,
      feedback:
        "AI feedback is unavailable. Compare your answer with the model answer and try again.",
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are an IELTS grammar tutor helping Saudi students. Be concise, encouraging, and practical. Respond in JSON only: {"correct":boolean,"feedback":string,"suggestion":string}`,
      },
      {
        role: "user",
        content: `Category: ${category}
Exercise: ${exercisePrompt}
Model answer: ${modelAnswer}
Student answer: ${studentAnswer}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      correct: Boolean(parsed.correct),
      feedback: String(parsed.feedback ?? "Review the rule and try again."),
      suggestion: String(parsed.suggestion ?? modelAnswer),
    };
  } catch {
    return {
      correct: false,
      feedback: raw,
      suggestion: modelAnswer,
    };
  }
}
