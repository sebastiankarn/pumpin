export default function PumpkinIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 28 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stem */}
      <path d="M13 3C13 3 13.3 1 14 1C14.7 1 14.5 3 14.5 3" />
      {/* Left lobe */}
      <ellipse cx="8.5" cy="13" rx="7" ry="9.5" opacity="0.85" />
      {/* Center lobe */}
      <ellipse cx="14" cy="13" rx="6.5" ry="10.5" />
      {/* Right lobe */}
      <ellipse cx="19.5" cy="13" rx="7" ry="9.5" opacity="0.85" />
      {/* Carved eyes - cut out */}
      <polygon
        points="9.5,10 8,13 11,13"
        fill="var(--color-background, #0c0a09)"
      />
      <polygon
        points="18.5,10 17,13 20,13"
        fill="var(--color-background, #0c0a09)"
      />
      {/* Carved mouth - smile */}
      <path
        d="M10 16C11.5 18.5 16.5 18.5 18 16"
        stroke="var(--color-background, #0c0a09)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
