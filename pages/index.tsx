import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FloorPlanViewer from '@/components/FloorPlanViewer';
import toast from 'react-hot-toast';
import { Search, MapPin, Users } from 'lucide-react';

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

export default function Home() {
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find a Desk</h1>
          <p className="mt-2 text-gray-600">
            Get personalized desk recommendations based on your preferences and teammates
          </p>
        </div>

        {/* Search Form */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
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
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
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
            <div>
              <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">
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

          </div>
          <p className="mt-3 text-xs text-gray-500">
            Desk IDs format: Floor-Zone-Number (example: 1-ENG-001). Select a date range to book multiple consecutive days.
          </p>
        </div>

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Floor Plan</h2>
              <p className="text-sm text-gray-600">
                {selectedFloor
                  ? `${selectedFloor.office.name} • ${selectedFloor.name}`
                  : 'Select a floor to view desks'}
              </p>
            </div>
            <button onClick={fetchFloorDesks} className="btn btn-secondary" disabled={!selectedFloorId || loadingFloorPlan}>
              Refresh Floor View
            </button>
          </div>

          {selectedFloor && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-gray-300">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Desks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{floorDesks.length}</p>
              </div>
              <div className="bg-success-50 rounded-xl p-4 border-l-4 border-success-500">
                <p className="text-xs font-medium text-success-700 uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-success-700 mt-1">{availableCount}</p>
              </div>
              <div className="bg-danger-50 rounded-xl p-4 border-l-4 border-danger-500">
                <p className="text-xs font-medium text-danger-700 uppercase tracking-wide">Booked</p>
                <p className="text-2xl font-bold text-danger-700 mt-1">{bookedCount}</p>
              </div>
            </div>
          )}

          {loadingFloorPlan ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
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
            />
          ) : (
            // Fallback to card grid when no map is available
            <div>
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                No floor plan available. Showing desk list. Contact an admin to upload a floor plan image.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {floorDesks.map((desk) => (
                  <div key={desk.id} className="card card-hover !p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{desk.deskNumber}</p>
                        <p className="text-xs text-gray-500">{desk.zone?.name || 'Unzoned'}</p>
                      </div>
                      <span className={`badge ${desk.isBooked ? 'badge-danger' : 'badge-success'}`}>
                        {desk.isBooked ? 'Booked' : 'Available'}
                      </span>
                    </div>

                    {Array.isArray(desk.features) && desk.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {desk.features.slice(0, 3).map((feature) => (
                          <span key={feature.deskFeature.id} className="badge badge-primary">
                            {feature.deskFeature.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {desk.activeBooking ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm mb-3">
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
                ))}
              </div>
            </div>
          )}
        </div>


      </div>
    </Layout>
  );
}
