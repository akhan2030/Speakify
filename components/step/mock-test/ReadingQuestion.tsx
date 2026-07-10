import {
  ExamHighlightQuestionText,
  HighlightableInlineText,
} from "@/components/exam/ExamHighlightSection";
import type { MockExamClientQuestion } from "@/lib/step/mockExam/types";
import MockOptionButtons from "./MockOptionButtons";
import type { StepMcqOption } from "@/lib/step/types";

type Props = {
  question: MockExamClientQuestion;
  answer?: string;
  onAnswer: (ans: StepMcqOption) => void;
  questionNumber: number;
};

export default function ReadingQuestion({
  question,
  answer,
  onAnswer,
  questionNumber,
}: Props) {
  return (
    <div>
      {question.passage ? (
        <div className="mb-6 max-h-[400px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="mb-2 text-xs tracking-widest text-slate-500">PASSAGE</p>
          <p className="m-0 whitespace-pre-wrap text-[15px] leading-[1.8] text-[#0d1b35]">
            <HighlightableInlineText
              blockId={`${question.id}-passage`}
              text={question.passage}
            />
          </p>
        </div>
      ) : null}
      <p className="mb-4 text-base font-semibold text-[#0d1b35]">
        <ExamHighlightQuestionText
          blockId={`${question.id}-stem`}
          number={questionNumber}
          text={question.stem}
        />
      </p>
      <MockOptionButtons
        questionId={question.id}
        options={question.options}
        selected={answer}
        onSelect={onAnswer}
      />
    </div>
  );
}
