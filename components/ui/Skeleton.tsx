import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  circle?: boolean;
}

// Base pulsing placeholder block. Always pass an explicit rounded-* class via
// className (or use `circle` for avatars) — no default radius here, so it
// never fights a caller-supplied one.
export default function Skeleton({ className, circle }: SkeletonProps) {
  return <div className={clsx('skeleton', circle && 'rounded-full', className)} />;
}
