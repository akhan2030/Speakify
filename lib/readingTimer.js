"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const READING_TIMER_STORAGE_KEY = "reading_timer_timed_out_at";

/**
 * @param {number} seconds
 * @returns {string}
 */
export function formatReadingTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * @param {number} timeRemaining
 * @returns {"green"|"amber"|"red"}
 */
export function getTimerColor(timeRemaining) {
  if (timeRemaining > 600) return "green";
  if (timeRemaining >= 300) return "amber";
  return "red";
}

/**
 * @param {object} params
 * @param {number} params.durationSeconds
 * @param {() => void} [params.onTimeUp]
 * @param {boolean} [params.autoStart]
 */
export function useReadingTimer({
  durationSeconds,
  onTimeUp,
  autoStart = false,
}) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const onTimeUpRef = useRef(onTimeUp);
  const timedOutFiredRef = useRef(false);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setTimeRemaining(durationSeconds);
    setIsTimedOut(false);
    setIsPaused(false);
    timedOutFiredRef.current = false;
    setIsRunning(Boolean(autoStart));
  }, [durationSeconds, autoStart]);

  const handleTimeUp = useCallback(() => {
    if (timedOutFiredRef.current) return;

    timedOutFiredRef.current = true;
    setTimeRemaining(0);
    setIsTimedOut(true);
    setIsRunning(false);
    setIsPaused(false);

    try {
      localStorage.setItem(READING_TIMER_STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }

    onTimeUpRef.current?.();
  }, []);

  useEffect(() => {
    if (!isRunning || isPaused || isTimedOut) return;

    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, isPaused, isTimedOut, handleTimeUp]);

  const start = useCallback(() => {
    if (isTimedOut) return;
    setIsRunning(true);
    setIsPaused(false);
  }, [isTimedOut]);

  const pause = useCallback(() => {
    if (!isRunning || isTimedOut) return;
    setIsPaused(true);
  }, [isRunning, isTimedOut]);

  const timerColor = useMemo(
    () => (isTimedOut ? "red" : getTimerColor(timeRemaining)),
    [timeRemaining, isTimedOut]
  );

  return {
    timeRemaining,
    isRunning,
    isTimedOut,
    formattedTime: formatReadingTime(timeRemaining),
    timerColor,
    start,
    pause,
  };
}
