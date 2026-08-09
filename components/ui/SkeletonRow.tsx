import Skeleton from './Skeleton';

// Generic table-row placeholder: avatar + two text lines, a secondary
// column, and a trailing badge-shaped block. Shared by the admin bookings
// and users tables, which both follow this exact shape.
export default function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <Skeleton circle className="w-10 h-10 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-32 rounded" />
        <Skeleton className="h-3 w-44 rounded" />
      </div>
      <Skeleton className="hidden sm:block h-3 w-20 rounded shrink-0" />
      <Skeleton className="h-5 w-16 rounded-full shrink-0" />
    </div>
  );
}
