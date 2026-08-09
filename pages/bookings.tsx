import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import BookingCard from '@/components/BookingCard';
import BookingHistoryRow from '@/components/BookingHistoryRow';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { BookingWithDetails } from '@/types';
import { Calendar } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import CollapsibleSection from '@/components/ui/CollapsibleSection';

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
        <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading your bookings">
          <PageHeader title="My bookings" description="View and manage your desk bookings" />

          <div>
            <Skeleton className="h-6 w-32 rounded mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card border-l-4 border-l-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24 rounded" />
                      <Skeleton className="h-3.5 w-32 rounded" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="h-6 w-24 rounded mb-4" />
            <div className="card !p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          </div>
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

  // Group past bookings by month, most recent first, for a scannable
  // collapsed-by-default history instead of one ever-growing grid.
  const sortedPastBookings = [...pastBookings].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const monthGroups: { key: string; label: string; bookings: BookingWithDetails[] }[] = [];
  sortedPastBookings.forEach((booking) => {
    const date = new Date(booking.startTime);
    const key = format(date, 'yyyy-MM');
    let group = monthGroups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: format(date, 'MMMM yyyy'), bookings: [] };
      monthGroups.push(group);
    }
    group.bookings.push(booking);
  });

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title="My bookings" description="View and manage your desk bookings" />

        {/* Upcoming Bookings */}
        <div>
          <h2 className="text-xl font-bold text-gray-950 tracking-tight mb-4 flex items-center gap-2.5">
            Upcoming
            <span className="badge badge-neutral">{upcomingBookings.length}</span>
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
            <div className="card">
              <EmptyState
                icon={Calendar}
                title="No upcoming bookings"
                description="Book a desk to see it here"
                action={
                  <button onClick={() => router.push('/desks')} className="btn btn-primary">
                    Find a desk
                  </button>
                }
              />
            </div>
          )}
        </div>

        {/* Past Bookings — collapsible, grouped by month */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-950 tracking-tight mb-4 flex items-center gap-2.5">
              Past
              <span className="badge badge-neutral">{pastBookings.length}</span>
            </h2>
            <div className="card !p-0 divide-y divide-gray-100 overflow-hidden">
              {monthGroups.map((group, index) => (
                <CollapsibleSection
                  key={group.key}
                  title={group.label}
                  count={group.bookings.length}
                  defaultOpen={index === 0}
                >
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {group.bookings.map((booking) => (
                      <BookingHistoryRow key={booking.id} booking={booking} />
                    ))}
                  </div>
                </CollapsibleSection>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
