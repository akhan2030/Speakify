"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CEFR_LEVEL,
  normalizeSpeakifyCefrLevel,
  VOCAB_STORAGE_KEY,
} from "@/lib/vocabulary";

export function useVocabularyCefr() {
  const [cefrLevel, setCefrLevelState] = useState(DEFAULT_CEFR_LEVEL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(VOCAB_STORAGE_KEY);
    const normalized = normalizeSpeakifyCefrLevel(stored ?? DEFAULT_CEFR_LEVEL);
    setCefrLevelState(normalized);
    if (stored && stored !== normalized) {
      localStorage.setItem(VOCAB_STORAGE_KEY, normalized);
    }
    setReady(true);
  }, []);

  const setCefrLevel = useCallback((level: string) => {
    const normalized = normalizeSpeakifyCefrLevel(level);
    setCefrLevelState(normalized);
    localStorage.setItem(VOCAB_STORAGE_KEY, normalized);
  }, []);

  return { cefrLevel, setCefrLevel, ready };
}
