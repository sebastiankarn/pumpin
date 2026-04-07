interface WeeklyRingProps {
  workouts: number;
  goal?: number;
}

export default function WeeklyRing({ workouts, goal = 7 }: WeeklyRingProps) {
  const size = 68;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(workouts / goal, 1);
  const offset = circumference - progress * circumference;
  const complete = workouts >= goal;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Completion glow */}
      {complete && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            boxShadow: "0 0 16px 4px rgba(249, 115, 22, 0.35)",
          }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={complete ? strokeWidth + 1 : strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: complete
              ? "drop-shadow(0 0 4px rgba(249, 115, 22, 0.6))"
              : undefined,
          }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={complete ? "#f59e0b" : "#f97316"} />
            <stop offset="100%" stopColor={complete ? "#fbbf24" : "#f59e0b"} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-sm font-black tabular-nums leading-none ${complete ? "text-primary" : "text-white"}`}
        >
          {workouts}/{goal}
        </span>
        <span className="text-[8px] text-gray-500 uppercase tracking-wide mt-0.5">
          days
        </span>
      </div>
    </div>
  );
}
