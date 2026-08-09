import clsx from 'clsx';

interface SegmentedControlOption {
  value: string;
  label: string;
  count?: number;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      className={clsx('inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              active
                ? 'bg-white text-gray-950 font-semibold shadow-soft'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={clsx(
                  'text-xs font-semibold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-accent-50 text-accent-700' : 'bg-gray-200/70 text-gray-500'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
