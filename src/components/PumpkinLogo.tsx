export default function PumpkinLogo({
  className = "w-8 h-8",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stem */}
      <path
        d="M30 8C30 8 31 2 34 2C37 2 35 8 35 8"
        stroke="#4ade80"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaf */}
      <path d="M34 5C37 3 41 4 40 7C39 10 35 8 34 5Z" fill="#4ade80" />
      {/* Main pumpkin body - left lobe */}
      <ellipse
        cx="22"
        cy="36"
        rx="14"
        ry="20"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Main pumpkin body - center */}
      <ellipse cx="32" cy="36" rx="13" ry="22" fill="currentColor" />
      {/* Main pumpkin body - right lobe */}
      <ellipse
        cx="42"
        cy="36"
        rx="14"
        ry="20"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Highlight / shine */}
      <ellipse cx="24" cy="28" rx="4" ry="8" fill="white" opacity="0.15" />
      {/* Crease lines */}
      <path
        d="M28 16C28 16 27 36 28 56"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.3"
      />
      <path
        d="M36 16C36 16 37 36 36 56"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.3"
      />
      {/* Cute face - eyes */}
      <circle cx="26" cy="34" r="2.5" fill="white" opacity="0.9" />
      <circle cx="38" cy="34" r="2.5" fill="white" opacity="0.9" />
      <circle cx="26.5" cy="34.5" r="1" fill="#1e293b" />
      <circle cx="38.5" cy="34.5" r="1" fill="#1e293b" />
      {/* Cute face - smile */}
      <path
        d="M28 41C30 44 34 44 36 41"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
