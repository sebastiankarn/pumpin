import { useState } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  Minus,
  Plus,
  Clock,
  Hourglass,
} from "lucide-react";
import { useTimer } from "../hooks/useTimer";

const PRESETS = [30, 60, 90, 120, 180];

function formatTimerDisplay(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function presetLabel(s: number) {
  return s >= 60 ? `${s / 60}m` : `${s}s`;
}

export default function WorkoutTimer({ onClose }: { onClose: () => void }) {
  const [minimized, setMinimized] = useState(false);

  const {
    mode,
    running,
    seconds,
    countdownFrom,
    start,
    pause,
    reset,
    switchMode,
    setCountdownDuration,
  } = useTimer({
    onComplete() {
      // Vibrate if available
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      setMinimized(false);
    },
  });

  const isActive = running || seconds > 0;

  // Minimized pill
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={`fixed bottom-22 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg transition-all ${
          mode === "countdown" && seconds <= 5 && seconds > 0
            ? "bg-danger/90 animate-pulse"
            : "glass-elevated"
        }`}
      >
        <Timer className="w-4 h-4 text-primary" />
        <span className="text-white font-mono text-sm font-semibold tracking-wide">
          {formatTimerDisplay(seconds)}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-22 left-4 right-4 z-40 max-w-lg mx-auto">
      <div className="glass-elevated rounded-2xl p-4 space-y-3 shadow-xl">
        {/* Top bar: mode toggle and close/minimize */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-background/50 rounded-lg p-0.5">
            <button
              onClick={() => switchMode("stopwatch")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                mode === "stopwatch"
                  ? "bg-primary/20 text-primary"
                  : "text-gray-400"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Stopwatch
            </button>
            <button
              onClick={() => switchMode("countdown")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                mode === "countdown"
                  ? "bg-primary/20 text-primary"
                  : "text-gray-400"
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              Countdown
            </button>
          </div>
          <div className="flex items-center gap-1">
            {isActive && (
              <button
                onClick={() => setMinimized(true)}
                className="p-1.5 text-gray-400 hover:text-gray-300 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                reset();
                setMinimized(false);
                onClose();
              }}
              className="p-1.5 text-gray-400 hover:text-gray-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer display */}
        <div className="flex items-center justify-center gap-4">
          {mode === "countdown" && !running && (
            <button
              onClick={() => {
                const next = Math.max(
                  15,
                  (running ? seconds : countdownFrom) - 15,
                );
                setCountdownDuration(next);
              }}
              className="p-2 rounded-xl bg-surface-light text-gray-400 hover:text-white transition"
            >
              <Minus className="w-5 h-5" />
            </button>
          )}
          <span
            className={`font-mono text-5xl font-bold tracking-wider ${
              mode === "countdown" && seconds <= 5 && seconds > 0 && running
                ? "text-danger animate-pulse"
                : "text-white"
            }`}
          >
            {formatTimerDisplay(seconds)}
          </span>
          {mode === "countdown" && !running && (
            <button
              onClick={() => {
                const next = (running ? seconds : countdownFrom) + 15;
                setCountdownDuration(next);
              }}
              className="p-2 rounded-xl bg-surface-light text-gray-400 hover:text-white transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Countdown presets */}
        {mode === "countdown" && !running && (
          <div className="flex justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setCountdownDuration(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  countdownFrom === p
                    ? "bg-primary/25 text-primary ring-1 ring-primary/40"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {presetLabel(p)}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="p-3 rounded-xl bg-surface-light text-gray-400 hover:text-white transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (running) {
                pause();
              } else {
                start();
              }
            }}
            className="px-8 py-3 rounded-xl btn-gradient font-semibold flex items-center gap-2 text-white"
          >
            {running ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {seconds > 0 ? "Resume" : "Start"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Button to place in the header to toggle the timer panel */
export function TimerToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-400 hover:text-primary transition"
      aria-label="Open workout timer"
    >
      <Hourglass className="w-5 h-5" />
    </button>
  );
}
