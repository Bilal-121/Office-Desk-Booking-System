import clsx from 'clsx';

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
} as const;

// Named tones instead of a raw className override — which color combo wins
// on top of the base classes depends on Tailwind's generated stylesheet
// order, not on JSX string order, so ad hoc overrides can silently render
// an invisible spinner. Pick the tone that matches the background instead.
const toneClasses = {
  default: 'border-gray-200 border-b-accent-600',
  onDark: 'border-white/25 border-b-white',
  onAccent: 'border-accent-800/30 border-b-gray-950',
} as const;

interface SpinnerProps {
  size?: keyof typeof sizeClasses;
  tone?: keyof typeof toneClasses;
  className?: string;
}

export default function Spinner({ size = 'md', tone = 'default', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx('animate-spin rounded-full', toneClasses[tone], sizeClasses[size], className)}
    />
  );
}
