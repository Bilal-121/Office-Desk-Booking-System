import LogoMark from './LogoMark';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  textClassName?: string;
  className?: string;
}

// Icon + "DESKIVO" wordmark, inline. For stacked layouts (auth pages), use
// LogoMark directly instead — this component only handles the row layout.
export default function Logo({
  size = 32,
  showWordmark = true,
  textClassName = 'text-xl',
  className = '',
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className={`font-bold uppercase tracking-tight text-gray-950 ${textClassName}`}>
          DESKI<span className="text-accent-500">V</span>O
        </span>
      )}
    </span>
  );
}
