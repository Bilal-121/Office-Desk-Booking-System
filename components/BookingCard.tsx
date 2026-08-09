import { format } from 'date-fns';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { BookingWithDetails } from '@/types';

interface BookingCardProps {
  booking: BookingWithDetails;
  onCancel?: (id: string) => void;
}

export default function BookingCard({ booking, onCancel }: BookingCardProps) {
  const isPast = new Date(booking.endTime) < new Date();
  const isCancelled = booking.status === 'CANCELLED';

  const accentBar = isCancelled
    ? 'border-l-4 border-l-danger-300'
    : isPast
    ? 'border-l-4 border-l-gray-200'
    : 'border-l-4 border-l-accent-500';

  return (
    <div className={`card card-hover ${accentBar} ${isCancelled ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-950 tracking-tight">
            {booking.desk.deskNumber}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {booking.desk.floor.name}
            {booking.desk.zone && ` • ${booking.desk.zone.name}`}
          </div>
        </div>
        <span
          className={`badge ${
            isCancelled ? 'badge-danger' : isPast ? 'badge-neutral' : 'badge-primary'
          }`}
        >
          {isCancelled ? 'Cancelled' : isPast ? 'Past' : 'Upcoming'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-700">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          {format(new Date(booking.startTime), 'MMMM d, yyyy')}
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          {format(new Date(booking.startTime), 'h:mm a')} -{' '}
          {format(new Date(booking.endTime), 'h:mm a')}
        </div>
      </div>

      {booking.notes && (
        <p className="text-sm text-gray-600 mb-4 italic">{booking.notes}</p>
      )}

      {!isCancelled && !isPast && onCancel && (
        <button
          onClick={() => onCancel(booking.id)}
          className="btn btn-ghost-danger w-full"
        >
          <X className="w-4 h-4" />
          Cancel booking
        </button>
      )}
    </div>
  );
}
