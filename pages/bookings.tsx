import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import BookingCard from '@/components/BookingCard';
import toast from 'react-hot-toast';
import { BookingWithDetails } from '@/types';
import { Calendar } from 'lucide-react';

export default function Bookings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings');
      const result = await response.json();

      if (result.success) {
        setBookings(result.data || []);
      } else {
        console.error('Failed to fetch bookings:', result.error);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookings();
    }
  }, [status, fetchBookings]);

  // Listen for new bookings created from other pages
  useEffect(() => {
    const handleStorageChange = () => {
      const bookingCreated = sessionStorage.getItem('bookingCreated');
      if (bookingCreated) {
        sessionStorage.removeItem('bookingCreated');
        console.log('Booking signal received, refreshing...');
        fetchBookings();
      }
    };

    // Check on mount
    handleStorageChange();

    // Check periodically when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleStorageChange();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [fetchBookings]);

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        toast.error(result.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.endTime) >= new Date() && b.status === 'CONFIRMED'
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.endTime) < new Date() && b.status !== 'CANCELLED'
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">View and manage your desk bookings</p>
        </div>

        {/* Upcoming Bookings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Upcoming Bookings ({upcomingBookings.length})
          </h2>
          {upcomingBookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No upcoming bookings
              </h3>
              <p className="text-gray-600 mb-4">
                Book a desk to see it here
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn btn-primary"
              >
                Find a Desk
              </button>
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Past Bookings ({pastBookings.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
