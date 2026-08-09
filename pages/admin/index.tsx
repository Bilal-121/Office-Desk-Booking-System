import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { Building, Layers, Box, BarChart3, Users, Calendar, Search, X, ChevronDown } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import SkeletonTable from '@/components/ui/SkeletonTable';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import Popover from '@/components/ui/Popover';
import EmptyState from '@/components/ui/EmptyState';

interface Office {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface Floor {
  id: string;
  officeId: string;
  name: string;
  floorNumber: number;
  office: {
    id: string;
    name: string;
  };
}

interface Desk {
  id: string;
  deskNumber: string;
  isActive: boolean;
  floor: {
    id: string;
    name: string;
    floorNumber: number;
  };
  zone: {
    id: string;
    name: string;
  } | null;
}

export default function Admin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    offices: 0,
    floors: 0,
    desks: 0,
    activeBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState<Office[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);

  const [creatingOffice, setCreatingOffice] = useState(false);
  const [creatingFloor, setCreatingFloor] = useState(false);
  const [creatingDesk, setCreatingDesk] = useState(false);

  const [officeForm, setOfficeForm] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    timezone: 'UTC',
  });

  const [floorForm, setFloorForm] = useState({
    officeId: '',
    name: '',
    floorNumber: 1,
  });

  const [deskForm, setDeskForm] = useState({
    floorId: '',
    deskNumber: '',
  });

  // "Add Office" needs external control so the Offices stat card can expand
  // it; the other two forms manage their own open state.
  const [officeFormOpen, setOfficeFormOpen] = useState(false);
  const officeFormRef = useRef<HTMLDivElement>(null);
  const deskInventoryRef = useRef<HTMLDivElement>(null);

  const [deskSearch, setDeskSearch] = useState('');
  const [deskFloorFilter, setDeskFloorFilter] = useState('');
  const [deskFilterOpen, setDeskFilterOpen] = useState(false);

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
      fetchStats();
    }
  }, [status, session]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch stats from various endpoints
      const [officesRes, floorsRes, desksRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/offices'),
        fetch('/api/admin/floors'),
        fetch('/api/admin/desks'),
        fetch('/api/admin/bookings'),
      ]);

      const [offices, floors, desks, bookings] = await Promise.all([
        officesRes.json(),
        floorsRes.json(),
        desksRes.json(),
        bookingsRes.json(),
      ]);

      const officeData = offices.success ? offices.data : [];
      const floorData = floors.success ? floors.data : [];
      const deskData = desks.success ? desks.data : [];
      const bookingData = bookings.success ? bookings.data : [];
      const now = new Date();
      const activeBookingsCount = bookingData.filter(
        (booking: any) => booking.status === 'CONFIRMED' && new Date(booking.endTime) > now
      ).length;

      setOffices(officeData);
      setFloors(floorData);
      setDesks(deskData);
      setFloorForm((current) => ({
        ...current,
        officeId: current.officeId || officeData[0]?.id || '',
      }));
        // Broadcast to home page and floor management page
        window.localStorage.setItem('floorsUpdated', JSON.stringify({ timestamp: Date.now() }));
      setDeskForm((current) => ({
        ...current,
        floorId: current.floorId || floorData[0]?.id || '',
      }));

      setStats({
        offices: officeData.length,
        floors: floorData.length,
        desks: deskData.length,
        activeBookings: activeBookingsCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading admin dashboard">
          <PageHeader title="Admin dashboard" description="Manage offices, floors, zones, and desks" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card !p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="mt-3 h-8 w-20 rounded" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-40 rounded-xl" />
            ))}
          </div>

          <div>
            <Skeleton className="h-5 w-36 rounded mb-4" />
            <div className="card !p-0 divide-y divide-gray-100 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="h-5 w-32 rounded mb-4" />
            <SkeletonTable rows={4} label="Loading desk inventory" />
          </div>
        </div>
      </Layout>
    );
  }

  if ((session?.user as any)?.role !== 'ADMIN') {
    return null;
  }

  const handleCreateOffice = async () => {
    if (!officeForm.name || !officeForm.address || !officeForm.city || !officeForm.country) {
      toast.error('Please fill all office fields');
      return;
    }

    setCreatingOffice(true);
    try {
      const response = await fetch('/api/admin/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officeForm),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to create office');
        return;
      }

      toast.success('Office created successfully');
      setOfficeForm({
        name: '',
        address: '',
        city: '',
        country: '',
        timezone: 'UTC',
      });
      fetchStats();
    } catch (error) {
      console.error('Create office error:', error);
      toast.error('Failed to create office');
    } finally {
      setCreatingOffice(false);
    }
  };

  const handleCreateFloor = async () => {
    if (!floorForm.officeId || !floorForm.name) {
      toast.error('Please select office and floor name');
      return;
    }

    setCreatingFloor(true);
    try {
      const response = await fetch('/api/admin/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: floorForm.officeId,
          name: floorForm.name,
          floorNumber: Number(floorForm.floorNumber),
          isActive: true,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to create floor');
        return;
      }

      toast.success('Floor created successfully');
      setFloorForm((current) => ({
        ...current,
        name: '',
        floorNumber: current.floorNumber + 1,
      }));
      // Broadcast to home page and floor management page
      window.localStorage.setItem('floorsUpdated', JSON.stringify({ timestamp: Date.now() }));
      fetchStats();
    } catch (error) {
      console.error('Create floor error:', error);
      toast.error('Failed to create floor');
    } finally {
      setCreatingFloor(false);
    }
  };

  const handleCreateDesk = async () => {
    if (!deskForm.floorId || !deskForm.deskNumber) {
      toast.error('Please select floor and desk number');
      return;
    }

    setCreatingDesk(true);
    try {
      const response = await fetch('/api/admin/desks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorId: deskForm.floorId,
          deskNumber: deskForm.deskNumber,
          isActive: true,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to create desk');
        return;
      }

      toast.success('Desk created successfully');
      setDeskForm((current) => ({ ...current, deskNumber: '' }));
      fetchStats();
    } catch (error) {
      console.error('Create desk error:', error);
      toast.error('Failed to create desk');
    } finally {
      setCreatingDesk(false);
    }
  };

  const handleDeactivateDesk = async (deskId: string) => {
    if (!confirm('Deactivate this desk?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/desks/${deskId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to deactivate desk');
        return;
      }

      toast.success('Desk deactivated');
      fetchStats();
    } catch (error) {
      console.error('Deactivate desk error:', error);
      toast.error('Failed to deactivate desk');
    }
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleOfficesStatClick = () => {
    setOfficeFormOpen(true);
    scrollToRef(officeFormRef);
  };

  const handleDesksStatClick = () => {
    scrollToRef(deskInventoryRef);
  };

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Accounts, roles, and permissions',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Manage Bookings',
      description: 'All desk bookings across the org',
      icon: Calendar,
      href: '/admin/bookings',
    },
    {
      title: 'Manage Floor Plans',
      description: 'Upload maps and position desks',
      icon: Layers,
      href: '/admin/floor-plans',
    },
  ];

  const filteredDesks = desks.filter((desk) => {
    const matchesSearch =
      deskSearch.trim() === '' || desk.deskNumber.toLowerCase().includes(deskSearch.trim().toLowerCase());
    const matchesFloor = !deskFloorFilter || desk.floor.id === deskFloorFilter;
    return matchesSearch && matchesFloor;
  });

  const deskFiltersActive = deskSearch.trim() !== '' || deskFloorFilter !== '';
  const deskFloorSummary = deskFloorFilter
    ? floors.find((f) => f.id === deskFloorFilter)?.name || 'Filtered'
    : 'All floors';

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Admin dashboard"
          description="Manage offices, floors, zones, and desks"
        />

        {/* Stats Grid — each stat leads somewhere */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Offices"
            value={stats.offices}
            icon={Building}
            tone="neutral"
            animate
            onClick={handleOfficesStatClick}
          />
          <StatCard
            label="Floors"
            value={stats.floors}
            icon={Layers}
            tone="neutral"
            animate
            onClick={() => router.push('/admin/floor-plans')}
          />
          <StatCard
            label="Desks"
            value={stats.desks}
            icon={Box}
            tone="neutral"
            animate
            onClick={handleDesksStatClick}
          />
          <StatCard
            label="Active Bookings"
            value={stats.activeBookings}
            icon={BarChart3}
            tone="accent"
            animate
            onClick={() => router.push('/admin/bookings')}
          />
        </div>

        {/* Quick Actions — compact, since real content follows below */}
        <div className="card !p-4">
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="btn btn-secondary"
                  aria-label={`${action.title} — ${action.description}`}
                >
                  <Icon className="w-4 h-4" />
                  {action.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Management Actions — collapsed by default, one section per entity */}
        <div className="card !p-0 divide-y divide-gray-100 overflow-hidden">
          <div className="px-4 py-4">
            <h2 className="text-xl font-bold text-gray-950 tracking-tight">Management Actions</h2>
          </div>
          <CollapsibleSection title="Add Office" open={officeFormOpen} onOpenChange={setOfficeFormOpen}>
              <div ref={officeFormRef} className="px-4 pb-4 pt-1 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Office name
                  </label>
                  <input
                    className="input"
                    placeholder="Office name"
                    value={officeForm.name}
                    onChange={(e) => setOfficeForm((current) => ({ ...current, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Address
                  </label>
                  <input
                    className="input"
                    placeholder="Address"
                    value={officeForm.address}
                    onChange={(e) => setOfficeForm((current) => ({ ...current, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      City
                    </label>
                    <input
                      className="input"
                      placeholder="City"
                      value={officeForm.city}
                      onChange={(e) => setOfficeForm((current) => ({ ...current, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Country
                    </label>
                    <input
                      className="input"
                      placeholder="Country"
                      value={officeForm.country}
                      onChange={(e) => setOfficeForm((current) => ({ ...current, country: e.target.value }))}
                    />
                  </div>
                </div>
                <button aria-label="Create office" className="btn btn-primary w-full" onClick={handleCreateOffice} disabled={creatingOffice}>
                  {creatingOffice ? 'Creating...' : 'Create Office'}
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Add Floor">
              <div className="px-4 pb-4 pt-1 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Office
                  </label>
                  <select
                    className="input"
                    value={floorForm.officeId}
                    onChange={(e) => setFloorForm((current) => ({ ...current, officeId: e.target.value }))}
                  >
                    {offices.length === 0 && <option value="">No offices available</option>}
                    {offices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Floor name
                  </label>
                  <input
                    className="input"
                    placeholder="Floor name"
                    value={floorForm.name}
                    onChange={(e) => setFloorForm((current) => ({ ...current, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Floor number
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Floor number"
                    value={floorForm.floorNumber}
                    onChange={(e) => setFloorForm((current) => ({ ...current, floorNumber: Number(e.target.value) }))}
                  />
                </div>
                <button aria-label="Create floor" className="btn btn-primary w-full" onClick={handleCreateFloor} disabled={creatingFloor}>
                  {creatingFloor ? 'Creating...' : 'Create Floor'}
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Add Desk">
              <div className="px-4 pb-4 pt-1 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Floor
                  </label>
                  <select
                    className="input"
                    value={deskForm.floorId}
                    onChange={(e) => setDeskForm((current) => ({ ...current, floorId: e.target.value }))}
                  >
                    {floors.length === 0 && <option value="">No floors available</option>}
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.office.name} • {floor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Desk number
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. 1-ENG-011"
                    value={deskForm.deskNumber}
                    onChange={(e) => setDeskForm((current) => ({ ...current, deskNumber: e.target.value }))}
                  />
                </div>
                <button aria-label="Create desk" className="btn btn-primary w-full" onClick={handleCreateDesk} disabled={creatingDesk}>
                  {creatingDesk ? 'Creating...' : 'Create Desk'}
                </button>
              </div>
            </CollapsibleSection>
        </div>

        <div ref={deskInventoryRef} className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-950 tracking-tight">Desk Inventory</h2>
            {desks.length > 0 && (
              <Popover
                open={deskFilterOpen}
                onClose={() => setDeskFilterOpen(false)}
                align="right"
                trigger={
                  <button
                    onClick={() => setDeskFilterOpen((v) => !v)}
                    className="btn btn-secondary !justify-between w-full sm:w-auto"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {deskSearch ? `"${deskSearch}"` : 'Search desks'} · {deskFloorSummary}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
                        deskFilterOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                }
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-950">Filter desks</h3>
                  <button
                    onClick={() => setDeskFilterOpen(false)}
                    className="btn btn-ghost !p-1.5"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Desk number
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 1-ENG-011"
                    value={deskSearch}
                    onChange={(e) => setDeskSearch(e.target.value)}
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Floor
                  </label>
                  <select
                    className="input"
                    value={deskFloorFilter}
                    onChange={(e) => setDeskFloorFilter(e.target.value)}
                  >
                    <option value="">All floors</option>
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.office.name} • {floor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {deskFiltersActive && (
                    <button
                      onClick={() => {
                        setDeskSearch('');
                        setDeskFloorFilter('');
                      }}
                      className="btn btn-ghost !px-4 text-sm"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setDeskFilterOpen(false)}
                    className="btn btn-primary !px-4 text-sm"
                  >
                    Done
                  </button>
                </div>
              </Popover>
            )}
          </div>
          {desks.length === 0 ? (
            <EmptyState
              icon={Box}
              title="No desks yet"
              description="Add desks under Management Actions to start building your inventory."
            />
          ) : filteredDesks.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No desks match your filters"
              action={
                <button
                  onClick={() => {
                    setDeskSearch('');
                    setDeskFloorFilter('');
                  }}
                  className="btn btn-secondary"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredDesks.map((desk) => (
                <div key={desk.id} className="rounded-xl bg-white ring-1 ring-gray-900/5 shadow-soft p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{desk.deskNumber}</p>
                    <p className="text-sm text-gray-500">
                      {desk.floor.name} {desk.zone ? `• ${desk.zone.name}` : ''}
                    </p>
                  </div>
                  <button aria-label={`Deactivate desk ${desk.deskNumber}`} className="btn btn-ghost-danger" onClick={() => handleDeactivateDesk(desk.id)}>
                    Deactivate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
