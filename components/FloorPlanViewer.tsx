import { useState, useRef, useEffect } from 'react';
import { Users, MapPin, AlertCircle } from 'lucide-react';

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
}

export default function FloorPlanViewer({
  mapUrl,
  desks,
  onDeskClick,
  onBookDesk,
  bookingDeskId,
}: FloorPlanViewerProps) {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const handleDeskClick = (desk: Desk) => {
    setSelectedDesk(desk);
    if (onDeskClick) {
      onDeskClick(desk);
    }
  };

  const formatBookingTime = (value: string) => {
    const date = new Date(value);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatBookingDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString();
  };

  // Calculate days between start and end time
  const getBookingDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter desks that have positions
  const positionedDesks = desks.filter(
    (desk) => desk.positionX !== undefined && desk.positionX !== null && desk.positionY !== undefined && desk.positionY !== null
  );
  const unpositionedDesks = desks.filter(
    (desk) => desk.positionX === undefined || desk.positionX === null || desk.positionY === undefined || desk.positionY === null
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="badge badge-success">
          <span className="badge-dot bg-success-500"></span>
          Available
        </span>
        <span className="badge badge-danger">
          <span className="badge-dot bg-danger-500"></span>
          Booked
        </span>
        <span className="badge badge-primary">
          <span className="badge-dot bg-primary-500"></span>
          Your Team
        </span>
      </div>

      {/* Floor Plan */}
      <div className="relative bg-gray-100 rounded-xl overflow-hidden ring-1 ring-gray-900/5 shadow-soft" ref={containerRef}>
        <img
          src={mapUrl}
          alt="Floor Plan"
          className="w-full h-auto"
          onLoad={() => setImageLoaded(true)}
        />

        {imageLoaded && positionedDesks.map((desk) => (
          <button
            key={desk.id}
            onClick={() => handleDeskClick(desk)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${desk.positionX}%`,
              top: `${desk.positionY}%`,
            }}
            title={`${desk.deskNumber} - ${desk.isBooked ? 'Booked' : 'Available'}`}
          >
            {/* Desk Icon */}
            <div className="relative">
              <div
                className={`w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-125 ${
                  desk.bookedByMyTeam
                    ? 'bg-blue-500'
                    : desk.isBooked
                    ? 'bg-red-500'
                    : 'bg-green-500'
                }`}
              >
                {/* Inner dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Desk Number Label */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {desk.deskNumber}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Unpositioned Desks Warning */}
      {unpositionedDesks.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">
                {unpositionedDesks.length} desk{unpositionedDesks.length > 1 ? 's' : ''} not positioned on floor plan
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
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

      {/* Desk Detail Modal */}
      {selectedDesk && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDesk(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl ring-1 ring-gray-900/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedDesk.deskNumber}</h3>
                <p className="text-sm text-gray-600">{selectedDesk.zone?.name || 'Unzoned'}</p>
              </div>
              <span
                className={`badge ${selectedDesk.isBooked ? 'badge-danger' : 'badge-success'}`}
              >
                {selectedDesk.isBooked ? 'Booked' : 'Available'}
              </span>
            </div>

            {/* Features */}
            {selectedDesk.features && selectedDesk.features.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDesk.features.map((feature) => (
                    <span key={feature.deskFeature.id} className="badge badge-primary">
                      {feature.deskFeature.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Details */}
            {selectedDesk.activeBooking ? (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Booking Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Booked by:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedDesk.activeBooking.user.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Team:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedDesk.activeBooking.user.teamName || 'No team'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatBookingDate(selectedDesk.activeBooking.startTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <span className="ml-2 font-medium text-gray-900 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formatBookingTime(selectedDesk.activeBooking.startTime)} -{' '}
                      {formatBookingTime(selectedDesk.activeBooking.endTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {getBookingDuration(
                        selectedDesk.activeBooking.startTime,
                        selectedDesk.activeBooking.endTime
                      )}{' '}
                      day(s)
                    </span>
                  </div>
                </div>
                {selectedDesk.bookedByMyTeam && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center gap-2 text-sm text-blue-700">
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
              {!selectedDesk.isBooked && onBookDesk && (
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => {
                    onBookDesk(selectedDesk.id);
                    setSelectedDesk(null);
                  }}
                  disabled={bookingDeskId === selectedDesk.id}
                >
                  {bookingDeskId === selectedDesk.id ? 'Booking...' : 'Book This Desk'}
                </button>
              )}
              <button className="btn btn-secondary flex-1" onClick={() => setSelectedDesk(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
