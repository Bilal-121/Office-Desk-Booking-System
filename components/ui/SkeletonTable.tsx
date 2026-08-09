import SkeletonRow from './SkeletonRow';

interface SkeletonTableProps {
  rows?: number;
  label?: string;
}

export default function SkeletonTable({ rows = 6, label = 'Loading' }: SkeletonTableProps) {
  return (
    <div
      className="card !p-0 divide-y divide-gray-100 overflow-hidden"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
