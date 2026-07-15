"use client";

import { useState } from "react";
import { speakWord } from "@/lib/classroom/ttsHelper";

export type VocabCardProps = {
  word: string;
  definition?: string;
  example?: string;
  arabicHint?: string;
  partOfSpeech?: string;
  collocation?: string;
};

export default function VocabCard({
  word,
  definition,
  example,
  arabicHint,
  partOfSpeech,
  collocation,
}: VocabCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="perspective-[1000px] h-[220px] w-full">
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 [backface-visibility:hidden]">
          {partOfSpeech ? (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6a1f]">
              {partOfSpeech}
            </span>
          ) : null}
          <p className="text-center text-2xl font-semibold tracking-tight text-slate-900">
            {word}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakWord(word);
              }}
              className="rounded-md border border-slate-300 bg-[#f7f4ef] px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
              aria-label={`Pronounce ${word}`}
            >
              Listen
            </button>
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="rounded-md border border-[#8a6a1f] bg-[#8a6a1f] px-3 py-1.5 text-sm text-white hover:bg-[#6f5518]"
            >
              Flip
            </button>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#d4c4a0] bg-[#fcfbf8] p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="space-y-2 overflow-y-auto text-sm">
            {definition ? (
              <p className="text-slate-800">
                <span className="font-semibold text-slate-900">Meaning: </span>
                {definition}
              </p>
            ) : null}
            {example ? (
              <p className="italic text-slate-600">“{example}”</p>
            ) : null}
            {collocation ? (
              <p className="text-slate-700">
                <span className="font-semibold">Collocation: </span>
                {collocation}
              </p>
            ) : null}
            {arabicHint ? (
              <p className="text-slate-700" dir="rtl" lang="ar">
                {arabicHint}
              </p>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakWord(word);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              aria-label={`Pronounce ${word}`}
            >
              Listen
            </button>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Front
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
