"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakWithBrowser, stopBrowserSpeech, type BrowserSpeechLang } from "@/lib/browserSpeech";
import type { VocabRating, VocabularyWord } from "@/lib/vocabulary";

type PronunciationAccent = "us" | "gb";

const ACCENT_STORAGE_KEY = "vocabulary-pronunciation-accent";

function accentToLang(accent: PronunciationAccent): BrowserSpeechLang {
  return accent === "us" ? "en-US" : "en-GB";
}

function readStoredAccent(): PronunciationAccent {
  if (typeof window === "undefined") return "us";
  return localStorage.getItem(ACCENT_STORAGE_KEY) === "gb" ? "gb" : "us";
}

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
  const [listening, setListening] = useState(false);
  const [listenError, setListenError] = useState<string | null>(null);
  const [accent, setAccent] = useState<PronunciationAccent>("us");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const listenMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAccent(readStoredAccent());
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    const preloadVoices = () => {
      synth.getVoices();
    };
    preloadVoices();
    synth.addEventListener("voiceschanged", preloadVoices);
    return () => synth.removeEventListener("voiceschanged", preloadVoices);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (listenMenuRef.current && !listenMenuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [dropdownOpen]);

  const speak = useCallback(() => {
    setListenError(null);
    setListening(true);
    stopBrowserSpeech();

    void speakWithBrowser(word.word, accentToLang(accent))
      .catch((err) => {
        setListenError(err instanceof Error ? err.message : "Could not play audio.");
      })
      .finally(() => {
        setListening(false);
      });
  }, [word.word, accent]);

  const selectAccent = useCallback(
    (next: PronunciationAccent) => {
      setAccent(next);
      localStorage.setItem(ACCENT_STORAGE_KEY, next);
      setDropdownOpen(false);
    },
    []
  );

  const progress = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
  const synonyms = (word.synonyms ?? []).filter((item) => item.trim());

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

      <div className="group relative mx-auto h-[380px] w-full [perspective:1200px]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
          className="relative h-full w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] rounded-2xl"
          style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
          aria-label={flipped ? "Show word front" : "Flip to see definition"}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-lg [backface-visibility:hidden]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
              {word.part_of_speech ?? "word"} · {word.cefr_level}
            </p>
            <h2 className="mt-4 text-4xl font-bold text-[#0d1b35]">{word.word}</h2>
            {/* Short lexical Arabic equivalent — fast speaking recall anchor. */}
            {word.arabic_equivalent?.trim() ? (
              <p
                className="mt-3 text-3xl font-bold leading-none text-[#0d9488]"
                dir="rtl"
                lang="ar"
              >
                {word.arabic_equivalent.trim()}
              </p>
            ) : null}
            {word.pronunciation_ipa ? (
              <p className="mt-2 text-lg text-slate-500">{word.pronunciation_ipa}</p>
            ) : null}
            {word.definition ? (
              <div className="mt-4 max-w-md px-2 text-center">
                <p className="text-sm leading-relaxed text-slate-700">{word.definition}</p>
                {/* Full Arabic definition — secondary conceptual explanation. */}
                {word.definition_arabic?.trim() ? (
                  <p
                    className="mt-2 text-sm leading-relaxed text-slate-500"
                    dir="rtl"
                    lang="ar"
                  >
                    {word.definition_arabic.trim()}
                  </p>
                ) : null}
              </div>
            ) : word.definition_arabic?.trim() ? (
              <p
                className="mt-4 max-w-md px-2 text-center text-sm leading-relaxed text-slate-500"
                dir="rtl"
                lang="ar"
              >
                {word.definition_arabic.trim()}
              </p>
            ) : null}
            <div
              ref={listenMenuRef}
              className="relative mt-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="inline-flex overflow-hidden rounded-full bg-[#0d1b35] text-sm font-semibold text-white shadow-sm">
                <button
                  type="button"
                  onClick={() => void speak()}
                  disabled={listening}
                  className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[#152a4d] disabled:opacity-60"
                >
                  <span aria-hidden>{listening ? "⏳" : "🔊"}</span>
                  <span>{listening ? "Playing…" : "Listen"}</span>
                  <span className="text-xs font-bold text-[#c9972c]">
                    {accent === "us" ? "🇺🇸 US" : "🇬🇧 GB"}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Choose pronunciation accent"
                  aria-expanded={dropdownOpen}
                  disabled={listening}
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="border-l border-white/20 px-2.5 py-2.5 transition-colors hover:bg-[#152a4d] disabled:opacity-60"
                >
                  <span aria-hidden className="text-xs">
                    ▼
                  </span>
                </button>
              </div>

              {dropdownOpen ? (
                <div className="absolute left-1/2 top-full z-20 mt-2 min-w-[160px] -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left text-sm shadow-lg">
                  <button
                    type="button"
                    onClick={() => selectAccent("us")}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 hover:bg-slate-50 ${
                      accent === "us" ? "bg-slate-50 font-semibold text-[#0d1b35]" : "text-slate-700"
                    }`}
                  >
                    🇺🇸 American
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAccent("gb")}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 hover:bg-slate-50 ${
                      accent === "gb" ? "bg-slate-50 font-semibold text-[#0d1b35]" : "text-slate-700"
                    }`}
                  >
                    🇬🇧 British
                  </button>
                </div>
              ) : null}

              {listenError ? (
                <p className="mt-3 max-w-xs text-center text-xs text-red-600">{listenError}</p>
              ) : null}
            </div>
            <p className="mt-8 text-xs text-slate-400">Tap card to flip</p>
          </div>

          <div className="absolute inset-0 flex flex-col justify-center rounded-2xl border border-[#0d9488]/30 bg-gradient-to-br from-white to-teal-50/80 p-8 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {word.arabic_equivalent?.trim() ? (
              <p
                className="mb-2 text-2xl font-bold text-[#0d9488]"
                dir="rtl"
                lang="ar"
              >
                {word.arabic_equivalent.trim()}
              </p>
            ) : null}
            <p className="text-sm font-semibold text-[#0d1b35]">{word.definition}</p>
            {word.definition_arabic?.trim() ? (
              <p
                className="mt-2 text-sm leading-relaxed text-slate-500"
                dir="rtl"
                lang="ar"
              >
                {word.definition_arabic.trim()}
              </p>
            ) : null}
            {synonyms.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500">Synonyms:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {synonyms.map((synonym) => (
                    <span
                      key={synonym}
                      className="rounded-full border border-[#0d9488]/30 bg-white px-2.5 py-0.5 text-xs font-medium text-[#0d9488]"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-4 text-sm italic text-slate-600">
              &ldquo;{word.ielts_example?.trim() || word.example_sentence}&rdquo;
            </p>
            {word.ielts_example?.trim() ? (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#c9972c]">
                IELTS-style example
              </p>
            ) : null}
            {word.memory_hook ? (
              <p className="mt-4 rounded-lg bg-[#c9972c]/10 px-3 py-2 text-xs text-slate-700">
                <span className="font-semibold text-[#c9972c]">Memory hook: </span>
                {word.memory_hook}
              </p>
            ) : null}
          </div>
        </div>
      </div>

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
