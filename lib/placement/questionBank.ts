import { buildGrammarQuestions } from "./bank/grammar";
import { buildListeningQuestions } from "./bank/listening";
import { buildReadingQuestions } from "./bank/reading";
import { buildVocabularyQuestions } from "./bank/vocabulary";
import { buildWritingQuestions } from "./bank/writing";
import { isValidQuestion } from "./isValidQuestion";
import type { Band, Question, Section } from "./types";

export type {
  Band,
  Question,
  QuestionType,
  Section,
  Answer,
  TestState,
  PlacementResult,
} from "./types";

export type { Question as PlacementQuestion };

const VOCABULARY = buildVocabularyQuestions();
const GRAMMAR = buildGrammarQuestions();
const READING = buildReadingQuestions();
const WRITING = buildWritingQuestions();
const LISTENING = buildListeningQuestions();

export const QUESTION_BANK: Question[] = [
  ...VOCABULARY,
  ...GRAMMAR,
  ...READING,
  ...WRITING,
  ...LISTENING,
].filter((q) => q.type !== "mcq" || isValidQuestion(q));

const BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export function getQuestionById(id: string): Question | undefined {
  return BY_ID.get(id);
}

export function getQuestionsBySection(section: Section): Question[] {
  return QUESTION_BANK.filter((q) => q.section === section);
}

export function getQuestionsByBand(band: Band): Question[] {
  return QUESTION_BANK.filter((q) => q.band === band);
}

export const QUESTION_BANK_STATS = {
  total: QUESTION_BANK.length,
  vocabulary: VOCABULARY.length,
  grammar: GRAMMAR.length,
  reading: READING.length,
  writing: WRITING.length,
  listening: LISTENING.length,
};
