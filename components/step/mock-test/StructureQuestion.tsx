import type { MockExamClientQuestion } from "@/lib/step/mockExam/types";
import MockOptionButtons from "./MockOptionButtons";
import type { StepMcqOption } from "@/lib/step/types";

type Props = {
  question: MockExamClientQuestion;
  answer?: string;
  onAnswer: (ans: StepMcqOption) => void;
  questionNumber: number;
};

export default function StructureQuestion({
  question,
  answer,
  onAnswer,
  questionNumber,
}: Props) {
  const sentence = question.sentence ?? question.stem;
  return (
    <div>
      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-5">
        <p className="mb-1 text-xs tracking-widest text-amber-800">STRUCTURE & GRAMMAR</p>
        <p className="m-0 text-lg font-medium leading-relaxed text-[#0d1b35]">{sentence}</p>
      </div>
      <p className="mb-4 text-[15px] text-[#0d1b35]">
        Question {questionNumber}: Choose the best answer.
      </p>
      <MockOptionButtons
        options={question.options}
        selected={answer}
        onSelect={onAnswer}
      />
    </div>
  );
}
