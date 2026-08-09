interface LogoMarkProps {
  size?: number;
  // Brackets only, no interior accent shapes — for use at very small sizes
  // (favicon) where the full mark would just read as noise.
  simplified?: boolean;
  className?: string;
}

// Two opposing rounded corner brackets forming an incomplete "viewfinder"
// frame, with a small accent square and circle inside. Colors are hardcoded
// (not currentColor) so this renders identically wherever it's dropped,
// including the static favicon.svg file which shares this exact geometry.
// The stroke color matches Tailwind's gray-950 exactly, so the logo never
// reads as a different black from the text sitting next to it.
export default function LogoMark({ size = 32, simplified = false, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 10V6.5Q4 4 6.5 4H10"
        stroke="#030712"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 14V17.5Q20 20 17.5 20H14"
        stroke="#030712"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!simplified && (
        <>
          <rect x="7" y="13.5" width="3.5" height="3.5" rx="1" fill="#14cd82" />
          <circle cx="15.5" cy="8.5" r="1.9" fill="#14cd82" />
        </>
      )}
    </svg>
  );
}
