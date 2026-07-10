"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  readDailyPracticeContext,
  storeDailyPracticeContext,
  parseDailyPracticeSearchParams,
  type DailyPracticeContext,
} from "@/lib/dailyPractice/client";

export function useDailyPracticeSession(): DailyPracticeContext | null {
  const searchParams = useSearchParams();
  const [ctx, setCtx] = useState<DailyPracticeContext | null>(null);

  useEffect(() => {
    const fromUrl = parseDailyPracticeSearchParams(searchParams);
    if (fromUrl) {
      storeDailyPracticeContext(fromUrl);
      setCtx(fromUrl);
      return;
    }
    setCtx(readDailyPracticeContext());
  }, [searchParams]);

  return ctx;
}
