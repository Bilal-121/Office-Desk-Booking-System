import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { Calendar, Filter, X, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

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
      router.push('/');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                Booking Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                View and manage all desk bookings across the organization
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Admin
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({bookings.length})
              </button>
              <button
                onClick={() => setFilterStatus('CONFIRMED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === 'CONFIRMED'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Confirmed ({bookings.filter((b) => b.status === 'CONFIRMED').length})
              </button>
              <button
                onClick={() => setFilterStatus('CANCELLED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === 'CANCELLED'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelled ({bookings.filter((b) => b.status === 'CANCELLED').length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {booking.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                            <div className="text-sm text-gray-500">{booking.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.desk.deskNumber}</div>
                        <div className="text-sm text-gray-500">
                          {booking.desk.floor.name}
                          {booking.desk.zone && ` • ${booking.desk.zone.name}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(booking.startTime, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {booking.notes || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
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
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus === 'ALL'
                    ? 'No bookings found in the system.'
                    : `No ${filterStatus.toLowerCase()} bookings found.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
