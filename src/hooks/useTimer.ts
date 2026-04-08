import { useState, useEffect, useRef, useCallback } from "react";

export type TimerMode = "stopwatch" | "countdown";

interface UseTimerOptions {
  onComplete?: () => void;
}

export function useTimer(options?: UseTimerOptions) {
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [countdownFrom, setCountdownFrom] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (mode === "countdown") {
          const next = prev - 1;
          if (next <= 0) {
            setRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return next;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  const start = useCallback(() => {
    if (mode === "countdown" && seconds === 0) {
      setSeconds(countdownFrom);
    }
    setRunning(true);
  }, [mode, seconds, countdownFrom]);

  const pause = useCallback(() => {
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(mode === "countdown" ? countdownFrom : 0);
  }, [mode, countdownFrom]);

  const startCountdown = useCallback((duration: number) => {
    setMode("countdown");
    setCountdownFrom(duration);
    setSeconds(duration);
    setRunning(true);
  }, []);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      setRunning(false);
      setMode(newMode);
      if (newMode === "countdown") {
        setSeconds(countdownFrom);
      } else {
        setSeconds(0);
      }
    },
    [countdownFrom],
  );

  const setCountdownDuration = useCallback((duration: number) => {
    setCountdownFrom(duration);
    setSeconds(duration);
  }, []);

  return {
    mode,
    running,
    seconds,
    countdownFrom,
    setCountdownFrom,
    setCountdownDuration,
    start,
    pause,
    reset,
    startCountdown,
    switchMode,
  };
}
