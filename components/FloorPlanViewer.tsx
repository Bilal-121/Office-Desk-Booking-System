import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users,
  MapPin,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

interface Desk {
  id: string;
  deskNumber: string;
  isBooked: boolean;
  bookedByMyTeam: boolean;
  zone: {
    id: string;
    name: string;
  } | null;
  features: Array<{
    deskFeature: {
      id: string;
      name: string;
    };
  }>;
  activeBooking: {
    id: string;
    startTime: string;
    endTime: string;
    user: {
      id: string;
      name: string;
      email: string;
      teamName: string | null;
    };
  } | null;
  // Coordinates as percentage of image dimensions
  positionX?: number | null;
  positionY?: number | null;
}

interface FloorPlanViewerProps {
  mapUrl: string;
  desks: Desk[];
  onDeskClick?: (desk: Desk) => void;
  onBookDesk?: (deskId: string) => void;
  bookingDeskId?: string | null;
  bookingSummary?: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.5;

export default function FloorPlanViewer({
  mapUrl,
  desks,
  onDeskClick,
  onBookDesk,
  bookingDeskId,
  bookingSummary,
}: FloorPlanViewerProps) {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  // Keep the last desk around so the modal's exit animation has content.
  const lastDeskRef = useRef<Desk | null>(null);
  // Tracks an in-flight booking for the selected desk so the modal can close
  // itself once the parent clears bookingDeskId (success or failure — the
  // parent's toast reports which).
  const wasBookingRef = useRef(false);

  const handleDeskClick = (desk: Desk) => {
    setSelectedDesk(desk);
    setStep('details');
    if (onDeskClick) {
      onDeskClick(desk);
    }
  };

  useEffect(() => {
    if (bookingDeskId && selectedDesk && bookingDeskId === selectedDesk.id) {
      wasBookingRef.current = true;
    } else if (!bookingDeskId && wasBookingRef.current) {
      wasBookingRef.current = false;
      setSelectedDesk(null);
    }
  }, [bookingDeskId, selectedDesk]);

  const formatBookingTime = (value: string) => {
    const date = new Date(value);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatBookingDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString();
  };

  // Render a YYYY-MM-DD string in the local timezone (avoids the UTC shift of
  // parsing a bare date string).
  const formatDay = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate days between start and end time
  const getBookingDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Same day math as the parent's booking loop, for display only.
  const summaryDayCount = bookingSummary
    ? Math.max(
        1,
        Math.ceil(
          (new Date(`${bookingSummary.endDate}T00:00:00`).getTime() -
            new Date(`${bookingSummary.startDate}T00:00:00`).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )
    : 1;

  // Filter desks that have positions
  const positionedDesks = desks.filter(
    (desk) => desk.positionX !== undefined && desk.positionX !== null && desk.positionY !== undefined && desk.positionY !== null
  );
  const unpositionedDesks = desks.filter(
    (desk) => desk.positionX === undefined || desk.positionX === null || desk.positionY === undefined || desk.positionY === null
  );

  const markerStyles = (desk: Desk) => {
    if (desk.bookedByMyTeam) {
      return {
        outer: 'bg-gray-950 border-2 border-white ring-2 ring-accent-400',
        inner: 'bg-accent-400',
      };
    }
    if (desk.isBooked) {
      return {
        outer: 'bg-white border-2 border-gray-400',
        inner: 'bg-gray-400',
      };
    }
    return {
      outer: 'bg-accent-500 border-2 border-white',
      inner: 'bg-white',
    };
  };

  const statusLabel = (desk: Desk) =>
    desk.bookedByMyTeam ? 'Booked by your team' : desk.isBooked ? 'Booked' : 'Available';

  const displayDesk = selectedDesk ?? lastDeskRef.current;
  if (selectedDesk) {
    lastDeskRef.current = selectedDesk;
  }

  return (
    <div className="space-y-4">
      {/* Legend — mirrors the marker treatments */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-700">
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-accent-500 border-2 border-white shadow-lg" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 shadow-lg" />
          Booked
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-gray-950 border-2 border-white shadow-lg ring-2 ring-accent-400" />
          Your team
        </span>
      </div>

      {/* Floor Plan with zoom */}
      <div className="relative">
        <div className="overflow-auto max-h-[70vh] rounded-xl ring-1 ring-gray-900/5 bg-gray-100 shadow-soft">
          {/* Width-based zoom: the %-positioned markers track the image for free. */}
          <div className="relative" style={{ width: `${scale * 100}%` }}>
            <img
              src={mapUrl}
              alt="Floor Plan"
              className="w-full h-auto block"
              onLoad={() => setImageLoaded(true)}
            />

            {imageLoaded && positionedDesks.map((desk) => {
              const marker = markerStyles(desk);
              return (
                <button
                  key={desk.id}
                  onClick={() => handleDeskClick(desk)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
                  style={{
                    left: `${desk.positionX}%`,
                    top: `${desk.positionY}%`,
                  }}
                  aria-label={`${desk.deskNumber} — ${statusLabel(desk)}`}
                >
                  <div className="relative">
                    <div
                      className={`w-7 h-7 rounded-full shadow-lg transition-transform group-hover:scale-125 ${marker.outer}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${marker.inner}`}></div>
                      </div>
                    </div>

                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 pointer-events-none z-10">
                      <div className="bg-gray-950 text-white rounded-xl px-3 py-2 shadow-card whitespace-nowrap text-left">
                        <p className="text-xs font-semibold">{desk.deskNumber}</p>
                        <p className="text-xs text-gray-400">{desk.zone?.name || 'Unzoned'}</p>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              desk.bookedByMyTeam
                                ? 'bg-accent-400'
                                : desk.isBooked
                                ? 'bg-gray-400'
                                : 'bg-accent-400'
                            }`}
                          />
                          {statusLabel(desk)}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-gray-950 rotate-45 mx-auto -mt-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute top-3 right-3 flex items-center gap-0.5 bg-white rounded-xl shadow-card ring-1 ring-gray-900/5 p-1">
          <button
            onClick={() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))}
            disabled={scale <= MIN_SCALE}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-950 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-700 w-11 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))}
            disabled={scale >= MAX_SCALE}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-950 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1)}
            disabled={scale === 1}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-950 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unpositioned Desks Warning */}
      {unpositionedDesks.length > 0 && (
        <div className="rounded-2xl bg-amber-50 ring-1 ring-inset ring-amber-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                {unpositionedDesks.length} desk{unpositionedDesks.length > 1 ? 's' : ''} not positioned on floor plan
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                These desks haven&apos;t been placed on the floor plan yet. Contact an admin to position them.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unpositionedDesks.slice(0, 10).map((desk) => (
                  <button
                    key={desk.id}
                    onClick={() => handleDeskClick(desk)}
                    className={`badge ${desk.isBooked ? 'badge-danger' : 'badge-success'} cursor-pointer hover:opacity-80`}
                  >
                    {desk.deskNumber}
                  </button>
                ))}
                {unpositionedDesks.length > 10 && (
                  <span className="badge badge-primary">
                    +{unpositionedDesks.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desk Detail / Booking Modal */}
      <Modal
        open={!!selectedDesk}
        onClose={() => setSelectedDesk(null)}
        labelledBy="desk-modal-title"
      >
        {displayDesk && (
          <AnimatePresence mode="wait" initial={false}>
            {step === 'details' ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 id="desk-modal-title" className="text-lg font-semibold text-gray-950 tracking-tight mb-1">
                      {displayDesk.deskNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{displayDesk.zone?.name || 'Unzoned'}</p>
                  </div>
                  <span
                    className={`badge ${displayDesk.isBooked ? 'badge-danger' : 'badge-success'}`}
                  >
                    {displayDesk.isBooked ? 'Booked' : 'Available'}
                  </span>
                </div>

                {/* Features */}
                {displayDesk.features && displayDesk.features.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-950 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {displayDesk.features.map((feature) => (
                        <span key={feature.deskFeature.id} className="badge badge-primary">
                          {feature.deskFeature.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Details */}
                {displayDesk.activeBooking ? (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-950 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Booking Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Booked by:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {displayDesk.activeBooking.user.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Team:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {displayDesk.activeBooking.user.teamName || 'No team'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatBookingDate(displayDesk.activeBooking.startTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Time:</span>
                        <span className="ml-2 font-medium text-gray-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {formatBookingTime(displayDesk.activeBooking.startTime)} -{' '}
                          {formatBookingTime(displayDesk.activeBooking.endTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {getBookingDuration(
                            displayDesk.activeBooking.startTime,
                            displayDesk.activeBooking.endTime
                          )}{' '}
                          day(s)
                        </span>
                      </div>
                    </div>
                    {displayDesk.bookedByMyTeam && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-accent-700">
                          <Users className="w-4 h-4" />
                          Booked by your team
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">This desk is available for booking.</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {!displayDesk.isBooked && onBookDesk && (
                    <button
                      className="btn btn-primary flex-1"
                      onClick={() => setStep('confirm')}
                    >
                      Book this desk
                    </button>
                  )}
                  <button className="btn btn-secondary flex-1" onClick={() => setSelectedDesk(null)}>
                    Close
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.15 }}
              >
                <h3 id="desk-modal-title" className="text-lg font-semibold text-gray-950 tracking-tight mb-1">
                  Confirm booking
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Desk <span className="font-semibold text-gray-900">{displayDesk.deskNumber}</span>
                  {displayDesk.zone?.name ? ` • ${displayDesk.zone.name}` : ''}
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {bookingSummary ? (
                      bookingSummary.startDate === bookingSummary.endDate ? (
                        <span className="font-medium text-gray-900">{formatDay(bookingSummary.startDate)}</span>
                      ) : (
                        <span className="font-medium text-gray-900">
                          {formatDay(bookingSummary.startDate)} – {formatDay(bookingSummary.endDate)}
                        </span>
                      )
                    ) : (
                      <span className="font-medium text-gray-900">Selected dates</span>
                    )}
                    {summaryDayCount > 1 && (
                      <span className="badge badge-primary">{summaryDayCount} days</span>
                    )}
                  </div>
                  {bookingSummary && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {bookingSummary.startTime} – {bookingSummary.endTime}
                      </span>
                      <span className="text-gray-500">each day</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    className="btn btn-accent flex-1"
                    onClick={() => onBookDesk && onBookDesk(displayDesk.id)}
                    disabled={bookingDeskId === displayDesk.id}
                  >
                    {bookingDeskId === displayDesk.id ? (
                      <>
                        <Spinner size="sm" tone="onAccent" />
                        Booking...
                      </>
                    ) : (
                      'Confirm booking'
                    )}
                  </button>
                  <button
                    className="btn btn-ghost flex-1"
                    onClick={() => setStep('details')}
                    disabled={bookingDeskId === displayDesk.id}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </Modal>
    </div>
  );
}
