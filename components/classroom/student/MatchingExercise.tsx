"use client";

import { useMemo, useState } from "react";

export type MatchingPair = { left: string; right: string };

export type MatchingExerciseProps = {
  pairs: MatchingPair[];
  title?: string;
  showAnswer?: boolean;
  onComplete?: (allCorrect: boolean) => void;
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MatchingExercise({
  pairs,
  title = "Match the pairs",
  showAnswer = false,
  onComplete,
}: MatchingExerciseProps) {
  const leftItems = useMemo(() => pairs.map((p) => p.left), [pairs]);
  const [rightItems] = useState(() => shuffle(pairs.map((p) => p.right)));

  const answerMap = useMemo(() => {
    const map = new Map<string, string>();
    pairs.forEach((p) => map.set(p.left, p.right));
    return map;
  }, [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrongFlash, setWrongFlash] = useState<{
    left: string;
    right: string;
  } | null>(null);
  const [checked, setChecked] = useState(false);

  const matchedRights = new Set(Object.values(matches));

  function selectLeft(item: string) {
    if (matches[item]) return;
    setSelectedLeft(item);
    setWrongFlash(null);
  }

  function selectRight(item: string) {
    if (!selectedLeft || matchedRights.has(item)) return;

    const expected = answerMap.get(selectedLeft);
    if (expected === item) {
      const next = { ...matches, [selectedLeft]: item };
      setMatches(next);
      setSelectedLeft(null);
      setWrongFlash(null);
      if (Object.keys(next).length === pairs.length) {
        setChecked(true);
        onComplete?.(true);
      }
    } else {
      setWrongFlash({ left: selectedLeft, right: item });
      window.setTimeout(() => setWrongFlash(null), 700);
    }
  }

  function reset() {
    setMatches({});
    setSelectedLeft(null);
    setWrongFlash(null);
    setChecked(false);
  }

  const allCorrect =
    Object.keys(matches).length === pairs.length &&
    pairs.every((p) => matches[p.left] === p.right);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">
        Tap a word on the left, then tap its match on the right.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ul className="space-y-2">
          {leftItems.map((item) => {
            const matched = Boolean(matches[item]);
            const active = selectedLeft === item;
            const flashWrong = wrongFlash?.left === item;
            return (
              <li key={item}>
                <button
                  type="button"
                  disabled={matched}
                  onClick={() => selectLeft(item)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    matched
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                      : flashWrong
                        ? "border-red-400 bg-red-50 text-red-900"
                        : active
                          ? "border-[#8a6a1f] bg-[#fcfbf8] ring-1 ring-[#8a6a1f]"
                          : "border-slate-200 bg-[#f7f4ef] hover:bg-white"
                  }`}
                >
                  {item}
                  {matched ? (
                    <span className="mt-1 block text-xs text-emerald-700">
                      → {matches[item]}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="space-y-2">
          {rightItems.map((item) => {
            const used = matchedRights.has(item);
            const flashWrong = wrongFlash?.right === item;
            return (
              <li key={item}>
                <button
                  type="button"
                  disabled={used || !selectedLeft}
                  onClick={() => selectRight(item)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:opacity-50 ${
                    used
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                      : flashWrong
                        ? "border-red-400 bg-red-50 text-red-900"
                        : "border-slate-200 bg-white hover:border-[#8a6a1f]"
                  }`}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
        {checked || allCorrect ? (
          <span className="text-sm font-medium text-emerald-700">
            All pairs matched
          </span>
        ) : null}
        {showAnswer ? (
          <ul className="w-full space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {pairs.map((p) => (
              <li key={p.left}>
                {p.left} → {p.right}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
