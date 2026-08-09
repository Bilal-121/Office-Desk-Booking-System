import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FloorPlanViewer from '@/components/FloorPlanViewer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MapPin,
  Users,
  RefreshCw,
  Info,
  Armchair,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ChevronDown,
  X,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import Popover from '@/components/ui/Popover';

interface FloorOption {
  id: string;
  name: string;
  floorNumber: number;
  mapUrl?: string | null;
  office: {
    id: string;
    name: string;
  };
  _count: {
    desks: number;
  };
}

interface FloorDesk {
  id: string;
  positionX?: number;
  positionY?: number;
  deskNumber: string;
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
  isBooked: boolean;
  bookedByMyTeam: boolean;
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
}

export default function FindADesk() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookingDeskId, setBookingDeskId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [floorDesks, setFloorDesks] = useState<FloorDesk[]>([]);
  const [loadingFloorPlan, setLoadingFloorPlan] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Only show the floor-plan skeleton if a refetch takes longer than ~200ms,
  // so fast filter changes don't flash a loading state.
  const [showFloorSkeleton, setShowFloorSkeleton] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(tomorrow.toISOString().split('T')[0]); // Default to same day
  }, []);

  const fetchFloors = useCallback(async () => {
    try {
      const response = await fetch('/api/floors');
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to load floors');
        return;
      }

      const floorList: FloorOption[] = result.data || [];
      setFloors(floorList);

      if (floorList.length > 0) {
        setSelectedFloorId((current) => current || floorList[0].id);
      }
    } catch (error) {
      console.error('Error loading floors:', error);
      toast.error('Failed to load floors');
    }
  }, []);

  const fetchFloorDesks = useCallback(async () => {
    if (!selectedFloorId || !startDate) return;

    setLoadingFloorPlan(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);

      const response = await fetch(
        `/api/floors/${selectedFloorId}/desks?startTime=${encodeURIComponent(startDateTime.toISOString())}&endTime=${encodeURIComponent(endDateTime.toISOString())}`
      );
      const result = await response.json();

      if (result.success) {
        setFloorDesks(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load floor desks');
      }
    } catch (error) {
      console.error('Error loading floor desks:', error);
      toast.error('Failed to load floor desks');
    } finally {
      setLoadingFloorPlan(false);
    }
  }, [selectedFloorId, startDate, startTime, endTime]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFloors();
    }
  }, [status, fetchFloors]);

  useEffect(() => {
    if (!loadingFloorPlan) {
      setShowFloorSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowFloorSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [loadingFloorPlan]);

  useEffect(() => {
    if (status !== 'authenticated' || !selectedFloorId || !startDate) {
      return;
    }
    fetchFloorDesks();
  }, [status, selectedFloorId, startDate, startTime, endTime, fetchFloorDesks]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (!event.newValue) {
        return;
      }

      if (event.key === 'floorPlanUpdated') {
        try {
          const payload = JSON.parse(event.newValue) as { floorId?: string };
          toast.success('Floor plan updated');
          fetchFloors();
          if (!payload?.floorId || payload.floorId === selectedFloorId) {
            fetchFloorDesks();
          }
        } catch {
          toast.success('Floor plan updated');
          fetchFloors();
          fetchFloorDesks();
        }
      } else if (event.key === 'floorsUpdated') {
        try {
          toast.success('New floor available');
          fetchFloors();
        } catch {
          fetchFloors();
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [status, selectedFloorId, fetchFloors, fetchFloorDesks]);



  const handleBookDesk = async (deskId: string) => {
    if (!startDate || !endDate) {
      toast.error('Please select dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setBookingDeskId(deskId);
      
      // Calculate number of days
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysDiff > 30) {
        toast.error('Cannot book more than 30 days at once');
        return;
      }

      // Create bookings for each day
      const bookingPromises = [];
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const startDateTime = new Date(`${dateStr}T${startTime}`);
        const endDateTime = new Date(`${dateStr}T${endTime}`);

        bookingPromises.push(
          fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deskId,
              startTime: startDateTime.toISOString(),
              endTime: endDateTime.toISOString(),
            }),
          })
        );
      }

      const responses = await Promise.all(bookingPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      const failedBookings = results.filter(r => !r.success);
      
      if (failedBookings.length === 0) {
        toast.success(`Desk booked successfully for ${daysDiff} day${daysDiff > 1 ? 's' : ''}!`);
        // Signal bookings page to refresh
        sessionStorage.setItem('bookingCreated', Date.now().toString());
        fetchFloorDesks();
      } else if (failedBookings.length < results.length) {
        toast.error(`${failedBookings.length} of ${results.length} bookings failed: ${failedBookings[0].error}`);
        sessionStorage.setItem('bookingCreated', Date.now().toString());
        fetchFloorDesks();
      } else {
        toast.error(failedBookings[0].error || 'Failed to book desk');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to book desk');
    } finally {
      setBookingDeskId(null);
    }
  };

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) || null;
  const bookedCount = floorDesks.filter((desk) => desk.isBooked).length;
  const availableCount = floorDesks.length - bookedCount;

  const formatDay = (value: string) => {
    if (!value) return '';
    return format(new Date(`${value}T00:00:00`), 'MMM d');
  };

  const dateSummary = startDate
    ? startDate === endDate
      ? formatDay(startDate)
      : `${formatDay(startDate)} – ${formatDay(endDate)}`
    : 'Select dates';

  const floorSummary = selectedFloor
    ? `${selectedFloor.office.name} · ${selectedFloor.name}`
    : floors.length === 0
    ? 'No floors'
    : 'Select floor';

  const formatBookingTime = (value: string) => {
    const date = new Date(value);
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  if (status === 'loading') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Find a desk"
          description="See live availability on the floor plan and book in seconds"
        />

        {/* Booking setup — compact summary pill that expands into a popover */}
        <div className="lg:sticky lg:top-20 z-30">
          <Popover
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            trigger={
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="btn btn-secondary !justify-between w-full sm:w-auto bg-white/95 backdrop-blur"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">
                    {dateSummary} · {startTime}–{endTime} · {floorSummary}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
                    filtersOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            }
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-950">Booking setup</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="btn btn-ghost !p-1.5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="startDate" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label htmlFor="startTime" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="floor" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Floor
              </label>
              <select
                id="floor"
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                className="input"
              >
                {floors.length === 0 && <option value="">No floors found</option>}
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.office.name} • {floor.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Desk IDs format: Floor-Zone-Number (example: 1-ENG-001). Select a date range to book multiple consecutive days.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFiltersOpen(false)}
                className="btn btn-primary !px-4 text-sm"
              >
                Done
              </button>
            </div>
          </Popover>
        </div>

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-950 tracking-tight">Floor Plan</h2>
              <p className="text-sm text-gray-500">
                {selectedFloor
                  ? `${selectedFloor.office.name} • ${selectedFloor.name}`
                  : 'Select a floor to view desks'}
              </p>
            </div>
            <button onClick={fetchFloorDesks} className="btn btn-secondary" disabled={!selectedFloorId || loadingFloorPlan}>
              <RefreshCw className={`w-4 h-4 ${loadingFloorPlan ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {selectedFloor && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <StatCard label="Total desks" value={floorDesks.length} icon={Armchair} tone="neutral" />
              <StatCard label="Available" value={availableCount} icon={CheckCircle2} tone="accent" animate />
              <StatCard label="Booked" value={bookedCount} icon={XCircle} tone="danger" animate />
            </div>
          )}

          {loadingFloorPlan ? (
            showFloorSkeleton ? (
              <div role="status" aria-busy="true" aria-label="Loading floor plan">
                <Skeleton className="h-[420px] w-full rounded-xl" />
              </div>
            ) : (
              <div className="h-[420px]" aria-hidden="true" />
            )
          ) : floorDesks.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No desks found for this floor.
            </div>
          ) : selectedFloor?.mapUrl ? (
            // Use floor plan viewer when map is available
            <FloorPlanViewer
              mapUrl={selectedFloor.mapUrl}
              desks={floorDesks}
              onBookDesk={handleBookDesk}
              bookingDeskId={bookingDeskId}
              bookingSummary={{ startDate, endDate, startTime, endTime }}
            />
          ) : (
            // Fallback to card grid when no map is available
            <div>
              <div className="mb-4 bg-gray-50 ring-1 ring-inset ring-gray-200 rounded-xl p-4 text-sm text-gray-600 flex items-center gap-3">
                <Info className="w-4 h-4 text-gray-400 shrink-0" />
                No floor plan available. Showing desk list. Contact an admin to upload a floor plan image.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {floorDesks.map((desk) => (
                  <div key={desk.id} className="card card-hover flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-gray-950">{desk.deskNumber}</p>
                        <p className="text-sm text-gray-500">{desk.zone?.name || 'Unzoned'}</p>
                      </div>
                      <span className={`badge ${desk.isBooked ? 'badge-danger' : 'badge-success'}`}>
                        {desk.isBooked ? 'Booked' : 'Available'}
                      </span>
                    </div>

                    {/* Reserved height so cards without features still align with ones that have them */}
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[1.75rem]">
                      {Array.isArray(desk.features) &&
                        desk.features.slice(0, 3).map((feature) => (
                          <span key={feature.deskFeature.id} className="badge badge-primary">
                            {feature.deskFeature.name}
                          </span>
                        ))}
                    </div>

                    <div className="mt-auto">
                      {desk.activeBooking ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {desk.activeBooking.user.name}
                          </p>
                          <p className="text-gray-600 text-xs mt-1">
                            Team: {desk.activeBooking.user.teamName || 'No team'}
                          </p>
                          <p className="text-gray-600 text-xs flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {formatBookingTime(desk.activeBooking.startTime)} - {formatBookingTime(desk.activeBooking.endTime)}
                          </p>
                          {desk.bookedByMyTeam && (
                            <span className="inline-block mt-2 badge badge-primary">Booked by your team</span>
                          )}
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary w-full"
                          onClick={() => handleBookDesk(desk.id)}
                          disabled={bookingDeskId === desk.id}
                        >
                          {bookingDeskId === desk.id ? 'Booking...' : 'Book Desk'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


      </div>
    </Layout>
  );
}
