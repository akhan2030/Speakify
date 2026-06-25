"use client";

import { useCallback, useState } from "react";
import type { VocabRating, VocabularyWord } from "@/lib/vocabulary";

type Props = {
  word: VocabularyWord;
  index: number;
  total: number;
  onRate: (rating: VocabRating) => void;
  saving?: boolean;
};

export default function VocabularyFlashcard({
  word,
  index,
  total,
  onRate,
  saving = false,
}: Props) {
  const [flipped, setFlipped] = useState(false);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-GB";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [word.word]);

  const progress = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {index + 1} of {total}
          </span>
          <span className="font-medium text-[#0d9488]">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#0d9488] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group relative mx-auto block h-[320px] w-full [perspective:1200px]"
        aria-label={flipped ? "Show word front" : "Flip to see definition"}
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-lg [backface-visibility:hidden]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
              {word.part_of_speech ?? "word"} · {word.cefr_level}
            </p>
            <h2 className="mt-4 text-4xl font-bold text-[#0d1b35]">{word.word}</h2>
            {word.pronunciation_ipa ? (
              <p className="mt-2 text-lg text-slate-500">{word.pronunciation_ipa}</p>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speak();
              }}
              className="mt-6 flex items-center gap-2 rounded-full bg-[#0d1b35] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#152a4d]"
            >
              <span aria-hidden>🔊</span> Listen
            </button>
            <p className="mt-8 text-xs text-slate-400">Tap card to flip</p>
          </div>

          <div className="absolute inset-0 flex flex-col justify-center rounded-2xl border border-[#0d9488]/30 bg-gradient-to-br from-white to-teal-50/80 p-8 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-sm font-semibold text-[#0d1b35]">{word.definition}</p>
            {word.definition_arabic ? (
              <p className="mt-3 text-lg text-[#0d9488]" dir="rtl">
                {word.definition_arabic}
              </p>
            ) : null}
            <p className="mt-4 text-sm italic text-slate-600">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
            {word.memory_hook ? (
              <p className="mt-4 rounded-lg bg-[#c9972c]/10 px-3 py-2 text-xs text-slate-700">
                <span className="font-semibold text-[#c9972c]">Memory hook: </span>
                {word.memory_hook}
              </p>
            ) : null}
          </div>
        </div>
      </button>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => onRate("again")}
          className="rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          Again
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onRate("hard")}
          className="rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          Hard
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onRate("good")}
          className="rounded-xl bg-[#0d9488] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0b7c72] disabled:opacity-50"
        >
          Good
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onRate("easy")}
          className="rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          Easy
        </button>
      </div>
    </div>
  );
}
