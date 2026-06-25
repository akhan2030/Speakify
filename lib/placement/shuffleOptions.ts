import type { Question } from "./types";

export function shuffleOptions(correctAnswer: string, wrongOptions: string[]) {
  const allOptions = [correctAnswer, ...wrongOptions];
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }
  const correctIndex = allOptions.indexOf(correctAnswer);
  return {
    options: allOptions,
    correctIndex,
  };
}

function isMcqWithOptions(question: Question): boolean {
  return Boolean(question.options?.length && question.options.length >= 2);
}

/** Shuffle MCQ options at presentation time so correct answers vary across A–D. */
export function presentQuestion(question: Question): Question {
  if (!isMcqWithOptions(question)) {
    return question;
  }

  const distractors = question.options!.filter((opt) => opt !== question.correct);
  if (distractors.length === 0) {
    return question;
  }

  const { options } = shuffleOptions(question.correct, distractors);

  return {
    ...question,
    options,
  };
}

export function shuffleMcqQuestion(question: Question): Question {
  return presentQuestion(question);
}

export function shuffleMcqQuestions(questions: Question[]): Question[] {
  return questions.map(presentQuestion);
}
