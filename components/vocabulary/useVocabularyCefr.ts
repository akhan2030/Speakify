"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CEFR_LEVEL, VOCAB_STORAGE_KEY } from "@/lib/vocabulary";

export function useVocabularyCefr() {
  const [cefrLevel, setCefrLevelState] = useState(DEFAULT_CEFR_LEVEL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(VOCAB_STORAGE_KEY);
    if (stored) setCefrLevelState(stored);
    setReady(true);
  }, []);

  const setCefrLevel = useCallback((level: string) => {
    setCefrLevelState(level);
    localStorage.setItem(VOCAB_STORAGE_KEY, level);
  }, []);

  return { cefrLevel, setCefrLevel, ready };
}
