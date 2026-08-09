import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

const tones = {
  neutral: {
    chip: 'bg-gray-100 text-gray-500',
    value: 'text-gray-950',
  },
  accent: {
    chip: 'bg-accent-50 text-accent-700',
    value: 'text-accent-700',
  },
  danger: {
    chip: 'bg-danger-50 text-danger-600',
    value: 'text-danger-600',
  },
} as const;

interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  tone?: keyof typeof tones;
  animate?: boolean;
  suffix?: string;
  className?: string;
  onClick?: () => void;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  animate = false,
  suffix = '',
  className,
  onClick,
}: StatCardProps) {
  const toneClasses = tones[tone];
  const content = (
    <>
      <div className="flex items-center gap-3">
        {Icon && (
          <span
            className={clsx(
              'inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
              toneClasses.chip
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
          </span>
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex-1">{label}</p>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
        )}
      </div>
      <p className={clsx('mt-3 text-2xl font-bold tracking-tightest', toneClasses.value)}>
        {animate ? <AnimatedCounter value={value} suffix={suffix} /> : `${value.toLocaleString()}${suffix}`}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={clsx('card card-hover !p-5 text-left w-full group', className)}>
        {content}
      </button>
    );
  }

  return <div className={clsx('card !p-5', className)}>{content}</div>;
}
