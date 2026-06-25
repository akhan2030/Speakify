"use client";

import { getOfficialInstructionParts } from "@/lib/listeningIeltsInstructions";

export default function ListeningIeltsInstruction({
  questionType,
  chooseCount,
}: {
  questionType: string;
  chooseCount?: number;
}) {
  const parts = getOfficialInstructionParts(questionType, { chooseCount });

  return (
    <div className="rounded-r-lg border-l-[3px] border-[#0d1b35] bg-[#c9972c]/15 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
        Instructions:
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#0d1b35]">
        {parts.map((part, i) =>
          part.emphasis === "limit" ? (
            <strong key={i} className="font-bold text-red-600">
              {part.text}
            </strong>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </p>
    </div>
  );
}
