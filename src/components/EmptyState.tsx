interface EmptyStateProps {
  type: "history" | "exercises" | "workouts";
  message?: string;
}

function DumbbellIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="mx-auto mb-3 opacity-20"
    >
      <rect x="8" y="30" width="8" height="20" rx="2" fill="#f97316" />
      <rect
        x="16"
        y="26"
        width="6"
        height="28"
        rx="2"
        fill="#f97316"
        opacity="0.7"
      />
      <rect
        x="22"
        y="36"
        width="36"
        height="8"
        rx="2"
        fill="#f97316"
        opacity="0.4"
      />
      <rect
        x="58"
        y="26"
        width="6"
        height="28"
        rx="2"
        fill="#f97316"
        opacity="0.7"
      />
      <rect x="64" y="30" width="8" height="20" rx="2" fill="#f97316" />
    </svg>
  );
}

function CalendarIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="mx-auto mb-3 opacity-20"
    >
      <rect
        x="12"
        y="16"
        width="56"
        height="52"
        rx="8"
        stroke="#f97316"
        strokeWidth="3"
      />
      <line
        x1="12"
        y1="32"
        x2="68"
        y2="32"
        stroke="#f97316"
        strokeWidth="2"
        opacity="0.5"
      />
      <circle cx="28" cy="22" r="2" fill="#f97316" />
      <circle cx="52" cy="22" r="2" fill="#f97316" />
      <rect
        x="22"
        y="40"
        width="8"
        height="8"
        rx="2"
        fill="#f97316"
        opacity="0.3"
      />
      <rect
        x="36"
        y="40"
        width="8"
        height="8"
        rx="2"
        fill="#f97316"
        opacity="0.5"
      />
      <rect
        x="50"
        y="40"
        width="8"
        height="8"
        rx="2"
        fill="#f97316"
        opacity="0.3"
      />
      <rect
        x="22"
        y="54"
        width="8"
        height="8"
        rx="2"
        fill="#f97316"
        opacity="0.3"
      />
      <rect
        x="36"
        y="54"
        width="8"
        height="8"
        rx="2"
        fill="#f97316"
        opacity="0.3"
      />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className="mx-auto mb-3 opacity-20"
    >
      <circle cx="34" cy="34" r="18" stroke="#f97316" strokeWidth="3" />
      <line
        x1="47"
        y1="47"
        x2="64"
        y2="64"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="26"
        y1="34"
        x2="42"
        y2="34"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="34"
        y1="26"
        x2="34"
        y2="42"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

const illustrations = {
  history: CalendarIllustration,
  exercises: SearchIllustration,
  workouts: DumbbellIllustration,
};

const defaultMessages = {
  history: "No completed workouts yet",
  exercises: "No exercises found",
  workouts: "Start your first workout!",
};

export default function EmptyState({ type, message }: EmptyStateProps) {
  const Illustration = illustrations[type];
  const text = message ?? defaultMessages[type];

  return (
    <div className="text-center py-16 animate-fade-in">
      <Illustration />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
