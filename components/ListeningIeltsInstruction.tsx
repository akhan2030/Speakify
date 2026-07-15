"use client";

import { HighlightableInlineText } from "@/components/exam/ExamHighlightSection";
import { getOfficialInstructionParts } from "@/lib/listeningIeltsInstructions";

export default function ListeningIeltsInstruction({
  questionType,
  chooseCount,
  matchingRange,
  maxWords,
}: {
  questionType: string;
  chooseCount?: number;
  matchingRange?: string;
  maxWords?: 1 | 2 | 3;
}) {
  const parts = getOfficialInstructionParts(questionType, {
    chooseCount,
    matchingRange,
    maxWords,
  });

  return (
    <p className="whitespace-pre-line text-sm leading-relaxed text-[#1a1a1a]">
      {parts.map((part, i) =>
        part.emphasis === "limit" ? (
          <strong key={i} className="font-bold text-[#1a1a1a]">
            <HighlightableInlineText
              blockId={`li-${questionType}-p-${i}`}
              text={part.text}
            />
          </strong>
        ) : (
          <HighlightableInlineText
            key={i}
            blockId={`li-${questionType}-p-${i}`}
            text={part.text}
          />
        )
      )}
    </p>
  );
}
