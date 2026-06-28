import type { MockExamClientQuestion } from "@/lib/step/mockExam/types";
import MockOptionButtons from "./MockOptionButtons";
import type { StepMcqOption } from "@/lib/step/types";

type Props = {
  question: MockExamClientQuestion;
  answer?: string;
  onAnswer: (ans: StepMcqOption) => void;
  questionNumber: number;
};

export default function CompositionalQuestion({
  question,
  answer,
  onAnswer,
  questionNumber,
}: Props) {
  return (
    <div>
      <p className="mb-1 text-xs tracking-widest text-slate-500">COMPOSITIONAL ANALYSIS</p>
      <p className="mb-4 whitespace-pre-wrap text-base font-semibold text-[#0d1b35]">
        {questionNumber}. {question.stem}
      </p>
      <MockOptionButtons
        options={question.options}
        selected={answer}
        onSelect={onAnswer}
      />
    </div>
  );
}
