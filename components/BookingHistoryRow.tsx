import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import { BookingWithDetails } from '@/types';

interface BookingHistoryRowProps {
  booking: BookingWithDetails;
}

export default function BookingHistoryRow({ booking }: BookingHistoryRowProps) {
  const isCancelled = booking.status === 'CANCELLED';
  const location = `${booking.desk.floor.name}${booking.desk.zone ? ` • ${booking.desk.zone.name}` : ''}`;
  const dateLabel = format(new Date(booking.startTime), 'MMM d');
  const timeLabel = `${format(new Date(booking.startTime), 'h:mm a')} - ${format(
    new Date(booking.endTime),
    'h:mm a'
  )}`;
  const accentBorder = isCancelled ? 'border-l-danger-300' : 'border-l-gray-200';
  const badgeClass = isCancelled ? 'badge-danger' : 'badge-neutral';
  const statusLabel = isCancelled ? 'Cancelled' : 'Past';

  return (
    <div className={`border-l-4 ${accentBorder} ${isCancelled ? 'opacity-70' : ''}`}>
      {/* Desktop: single line */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-3">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="font-semibold text-gray-900 text-sm shrink-0">{booking.desk.deskNumber}</span>
          <span className="text-xs text-gray-500 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {location}
          </span>
        </div>
        <span className="text-xs text-gray-500 shrink-0 w-16 text-right">{dateLabel}</span>
        <span className="text-xs text-gray-500 shrink-0 w-32 text-right">{timeLabel}</span>
        <span className={`badge ${badgeClass} shrink-0`}>{statusLabel}</span>
      </div>

      {/* Mobile: stacked two lines */}
      <div className="sm:hidden px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-gray-900 text-sm truncate">{booking.desk.deskNumber}</span>
          <span className={`badge ${badgeClass} shrink-0`}>{statusLabel}</span>
        </div>
        <div className="mt-1 text-xs text-gray-500 truncate">
          {dateLabel} · {timeLabel} · {location}
        </div>
      </div>
    </div>
  );
}
