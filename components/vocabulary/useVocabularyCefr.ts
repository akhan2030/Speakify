"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CEFR_LEVEL,
  normalizeSpeakifyCefrLevel,
  profileCefrToSpeakify,
  VOCAB_MANUAL_CEFR_KEY,
  VOCAB_STORAGE_KEY,
} from "@/lib/vocabulary";

export type CefrSource = "placement" | "profile" | "manual" | "default";

export function useVocabularyCefr() {
  const [cefrLevel, setCefrLevelState] = useState(DEFAULT_CEFR_LEVEL);
  const [source, setSource] = useState<CefrSource>("default");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const manual = localStorage.getItem(VOCAB_MANUAL_CEFR_KEY) === "1";
      const stored = localStorage.getItem(VOCAB_STORAGE_KEY);

      if (manual && stored) {
        const normalized = normalizeSpeakifyCefrLevel(stored);
        if (!cancelled) {
          setCefrLevelState(normalized);
          setSource("manual");
          setReady(true);
        }
        return;
      }

      try {
        const res = await fetch("/api/student/placement-status");
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        const fromBandOrProfile = profileCefrToSpeakify(
          json.placementCefrLevel || json.cefrLevel,
          json.placementBand
        );

        const hasPlacement =
          Boolean(json.placementCompleted) &&
          (json.placementBand != null || json.placementCefrLevel);

        setCefrLevelState(fromBandOrProfile);
        localStorage.setItem(VOCAB_STORAGE_KEY, fromBandOrProfile);
        setSource(
          hasPlacement
            ? "placement"
            : json.cefrLevel
              ? "profile"
              : "default"
        );
      } catch {
        const fallback = normalizeSpeakifyCefrLevel(stored ?? DEFAULT_CEFR_LEVEL);
        if (!cancelled) {
          setCefrLevelState(fallback);
          setSource(stored ? "manual" : "default");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setCefrLevel = useCallback((level: string) => {
    const normalized = normalizeSpeakifyCefrLevel(level);
    setCefrLevelState(normalized);
    setSource("manual");
    localStorage.setItem(VOCAB_STORAGE_KEY, normalized);
    localStorage.setItem(VOCAB_MANUAL_CEFR_KEY, "1");
  }, []);

  return { cefrLevel, setCefrLevel, source, ready };
}
