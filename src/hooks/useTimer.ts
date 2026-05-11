import { useState, useEffect, useRef, useCallback } from "react";

export type TimerMode = "stopwatch" | "countdown";

interface UseTimerOptions {
  onComplete?: () => void;
  /** sessionStorage key — if provided, timer state is persisted across reloads */
  storageKey?: string;
}

export function useTimer(options?: UseTimerOptions) {
  const storageKey = options?.storageKey;

  // Restore initial state from sessionStorage if a key is provided
  const getInitial = () => {
    if (!storageKey) return null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saved = getInitial();

  const [mode, setMode] = useState<TimerMode>(saved?.mode ?? "stopwatch");
  const [running, setRunning] = useState(false); // always start paused; we resume below
  const [seconds, setSeconds] = useState<number>(() => {
    if (!saved) return 0;
    // If the timer was running when we saved, compute how far it's progressed
    if (saved.running && saved.startTs) {
      const elapsed = Math.floor((Date.now() - saved.startTs) / 1000);
      if (saved.mode === "countdown") {
        return Math.max(0, saved.startSeconds - elapsed);
      }
      return saved.startSeconds + elapsed;
    }
    return saved.seconds ?? 0;
  });
  const [countdownFrom, setCountdownFrom] = useState<number>(
    saved?.countdownFrom ?? 60,
  );

  // Timestamp-based tracking so the timer stays accurate when the screen goes dark
  const startTsRef = useRef<number | null>(null); // Date.now() when last started
  const startSecondsRef = useRef(0); // seconds value at the moment we started

  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  // If the timer was running when we left, restart it after state is initialised
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!saved?.running || resumedRef.current) return;
    resumedRef.current = true;
    // Only resume if time is still left (countdown) or it was a stopwatch
    if (saved.mode === "countdown" && seconds <= 0) return;
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) {
      startTsRef.current = null;
      return;
    }

    // Capture reference point when we (re)start
    startTsRef.current = Date.now();
    startSecondsRef.current = seconds;

    const tick = () => {
      if (!startTsRef.current) return;
      const elapsed = Math.floor((Date.now() - startTsRef.current) / 1000);

      if (mode === "countdown") {
        const next = startSecondsRef.current - elapsed;
        if (next <= 0) {
          setSeconds(0);
          setRunning(false);
          startTsRef.current = null;
          onCompleteRef.current?.();
        } else {
          setSeconds(next);
        }
      } else {
        setSeconds(startSecondsRef.current + elapsed);
      }
    };

    // Poll every 200 ms — still lightweight but catches up quickly
    const interval = setInterval(tick, 200);

    // Re-sync the moment the screen wakes back up
    const handleVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  // Persist timer state whenever anything relevant changes
  useEffect(() => {
    if (!storageKey) return;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        mode,
        running,
        seconds,
        countdownFrom,
        startTs: startTsRef.current,
        startSeconds: startSecondsRef.current,
      }),
    );
  }, [storageKey, mode, running, seconds, countdownFrom]);

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
    startTsRef.current = null;
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
      startTsRef.current = null;
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
