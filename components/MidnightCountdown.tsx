"use client";

import { useEffect, useState } from "react";
import {
  formatMidnightCountdown,
  getSecondsUntilMidnight,
} from "@/lib/readingDailyLimit";

export default function MidnightCountdown({
  prefix = "Resets in:",
  className = "",
}: {
  prefix?: string;
  className?: string;
}) {
  const [countdown, setCountdown] = useState(getSecondsUntilMidnight());

  useEffect(() => {
    setCountdown(getSecondsUntilMidnight());
    const id = window.setInterval(() => {
      setCountdown(getSecondsUntilMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className={className}>
      {prefix}{" "}
      <span className="font-mono font-bold">{formatMidnightCountdown(countdown)}</span>
    </p>
  );
}
