"use client";

import { useEffect } from "react";

/** Persists GT programme for shared components (e.g. ActiveSession Part 3 test type). */
export default function GeneralProgrammeMarker() {
  useEffect(() => {
    sessionStorage.setItem("speakify_programme", "ielts_general");
  }, []);
  return null;
}
