import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { Calendar, X, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonTable from '@/components/ui/SkeletonTable';
import { getInitials } from '@/lib/initials';

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: 'CONFIRMED' | 'CANCELLED';
  notes: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  desk: {
    id: string;
    deskNumber: string;
    floor: {
      name: string;
      floorNumber: number;
    };
    zone: {
      name: string;
    } | null;
  };
}

export default function AdminBookings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && (session.user as any).role !== 'ADMIN') {
      toast.error('Access denied: Admin only');
      router.push('/desks');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && (session.user as any).role === 'ADMIN') {
      fetchBookings();
    }
  }, [status, session]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/bookings');
      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects
        const bookingsWithDates = data.data.map((booking: any) => ({
          ...booking,
          startTime: new Date(booking.startTime),
          endTime: new Date(booking.endTime),
          createdAt: new Date(booking.createdAt),
        }));
        setBookings(bookingsWithDates);
      } else {
        toast.error(data.message || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filterStatus === 'ALL') return true;
    return booking.status === filterStatus;
  });

  if ((session?.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Booking management"
          description="View and manage all desk bookings across the organization"
          backHref="/admin"
          backLabel="Back to Admin"
        />

        {/* Filter */}
        <SegmentedControl
          options={[
            { value: 'ALL', label: 'All', count: bookings.length },
            {
              value: 'CONFIRMED',
              label: 'Confirmed',
              count: bookings.filter((b) => b.status === 'CONFIRMED').length,
            },
            {
              value: 'CANCELLED',
              label: 'Cancelled',
              count: bookings.filter((b) => b.status === 'CANCELLED').length,
            },
          ]}
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as 'ALL' | 'CONFIRMED' | 'CANCELLED')}
        />

        {loading ? (
          <SkeletonTable rows={6} label="Loading bookings" />
        ) : (
          <div className="card !p-0 overflow-hidden">
            {/* Mobile: stacked cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-950 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {getInitials(booking.user.name)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 truncate">{booking.user.name}</div>
                      <div className="text-sm text-gray-500 truncate">{booking.user.email}</div>
                    </div>
                    <span
                      className={`badge shrink-0 ${
                        booking.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {booking.status === 'CONFIRMED' ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="font-semibold text-gray-900">{booking.desk.deskNumber}</div>
                    <div className="text-gray-500">
                      {booking.desk.floor.name}
                      {booking.desk.zone && ` • ${booking.desk.zone.name}`}
                    </div>
                    <div className="text-gray-500 mt-1">
                      {format(booking.startTime, 'MMM dd, yyyy')} · {format(booking.startTime, 'HH:mm')} -{' '}
                      {format(booking.endTime, 'HH:mm')}
                    </div>
                  </div>
                  {booking.notes && (
                    <div className="mt-2 text-sm text-gray-500 italic">{booking.notes}</div>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="btn btn-ghost-danger w-full mt-3"
                    >
                      <X className="w-4 h-4" /> Cancel booking
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[180px]">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[140px]">
                      Desk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-950 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {getInitials(booking.user.name)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{booking.user.name}</div>
                            <div className="text-sm text-gray-500">{booking.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{booking.desk.deskNumber}</div>
                        <div className="text-sm text-gray-500">
                          {booking.desk.floor.name}
                          {booking.desk.zone && ` • ${booking.desk.zone.name}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(booking.startTime, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`badge ${
                            booking.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {booking.status === 'CONFIRMED' ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Confirmed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Cancelled
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {booking.notes || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="btn btn-ghost-danger btn-sm"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        ) : (
                          <span className="text-gray-400">Already cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBookings.length === 0 && (
              <EmptyState
                icon={Calendar}
                title="No bookings"
                description={
                  filterStatus === 'ALL'
                    ? 'No bookings found in the system.'
                    : `No ${filterStatus.toLowerCase()} bookings found.`
                }
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
