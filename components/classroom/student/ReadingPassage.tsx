"use client";

import { useMemo, useState } from "react";

export type GlossaryEntry = { word: string; definition: string };

export type ReadingPassageProps = {
  title: string;
  passage: string;
  glossary?: GlossaryEntry[];
  wordCount?: number;
};

export default function ReadingPassage({
  title,
  passage,
  glossary = [],
  wordCount,
}: ReadingPassageProps) {
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const glossaryMap = useMemo(() => {
    const map = new Map<string, string>();
    glossary.forEach((g) => map.set(g.word.toLowerCase(), g.definition));
    return map;
  }, [glossary]);

  const glossaryPattern = useMemo(() => {
    if (!glossary.length) return null;
    const escaped = [...glossary]
      .map((g) => g.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);
    return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  }, [glossary]);

  function renderParagraph(para: string, key: string) {
    if (!glossaryPattern) {
      return (
        <p key={key} className="text-[17px] leading-8 text-slate-800">
          {para}
        </p>
      );
    }

    const parts = para.split(glossaryPattern);
    return (
      <p key={key} className="text-[17px] leading-8 text-slate-800">
        {parts.map((part, i) => {
          const def = glossaryMap.get(part.toLowerCase());
          if (!def) {
            return <span key={`${key}-${i}`}>{part}</span>;
          }
          const isOpen = activeWord === part.toLowerCase();
          return (
            <span key={`${key}-${i}`} className="relative inline">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveWord(isOpen ? null : part.toLowerCase());
                }}
                className="rounded-sm border-b border-dotted border-[#8a6a1f] bg-[#f7f4ef]/60 px-0.5 font-medium text-[#6f5518] hover:bg-[#f7f4ef]"
              >
                {part}
              </button>
              {isOpen ? (
                <span
                  role="tooltip"
                  className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 text-slate-700 shadow-md sm:w-64"
                >
                  <span className="font-semibold text-slate-900">{part}</span>
                  <span className="mt-0.5 block">{def}</span>
                </span>
              ) : null}
            </span>
          );
        })}
      </p>
    );
  }

  const paragraphs = passage.split(/\n\n+/).filter(Boolean);

  return (
    <article className="rounded-2xl border border-slate-200 bg-[#fcfbf8] p-5 sm:p-8">
      <div className="mb-5 flex items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        {wordCount != null ? (
          <span className="shrink-0 text-xs text-slate-500">
            {wordCount} words
          </span>
        ) : null}
      </div>

      {glossary.length > 0 ? (
        <p className="mb-4 text-xs text-slate-500">
          Tapped words show a short definition.
        </p>
      ) : null}

      <div className="space-y-4" onClick={() => setActiveWord(null)}>
        {paragraphs.map((para, i) =>
          renderParagraph(para, `p-${i}-${para.slice(0, 20)}`)
        )}
      </div>
    </article>
  );
}
