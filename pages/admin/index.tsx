import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { Building, Layers, Box, BarChart3, Users, Calendar } from 'lucide-react';

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
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

  const statCards = [
    {
      title: 'Offices',
      value: stats.offices,
      icon: Building,
      color: 'bg-blue-500',
    },
    {
      title: 'Floors',
      value: stats.floors,
      icon: Layers,
      color: 'bg-green-500',
    },
    {
      title: 'Desks',
      value: stats.desks,
      icon: Box,
      color: 'bg-purple-500',
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage offices, floors, zones, and desks
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Manage Users
            </button>
            <button
              onClick={() => router.push('/admin/bookings')}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Manage Bookings
            </button>
            <button
              onClick={() => router.push('/admin/floor-plans')}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <Layers className="w-5 h-5" />
              Manage Floor Plans
            </button>
          </div>
        </div>

        {/* Management Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Management Actions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Add Office</h3>
              <input
                className="input"
                placeholder="Office name"
                aria-label="Office name"
                value={officeForm.name}
                onChange={(e) => setOfficeForm((current) => ({ ...current, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Address"
                aria-label="Office address"
                value={officeForm.address}
                onChange={(e) => setOfficeForm((current) => ({ ...current, address: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="City"
                  aria-label="Office city"
                  value={officeForm.city}
                  onChange={(e) => setOfficeForm((current) => ({ ...current, city: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Country"
                  aria-label="Office country"
                  value={officeForm.country}
                  onChange={(e) => setOfficeForm((current) => ({ ...current, country: e.target.value }))}
                />
              </div>
              <button aria-label="Create office" className="btn btn-primary w-full" onClick={handleCreateOffice} disabled={creatingOffice}>
                {creatingOffice ? 'Creating...' : 'Create Office'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Add Floor</h3>
              <select
                className="input"
                aria-label="Select office for floor"
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
              <input
                className="input"
                placeholder="Floor name"
                aria-label="Floor name"
                value={floorForm.name}
                onChange={(e) => setFloorForm((current) => ({ ...current, name: e.target.value }))}
              />
              <input
                type="number"
                className="input"
                placeholder="Floor number"
                aria-label="Floor number"
                value={floorForm.floorNumber}
                onChange={(e) => setFloorForm((current) => ({ ...current, floorNumber: Number(e.target.value) }))}
              />
              <button aria-label="Create floor" className="btn btn-primary w-full" onClick={handleCreateFloor} disabled={creatingFloor}>
                {creatingFloor ? 'Creating...' : 'Create Floor'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Add Desk</h3>
              <select
                className="input"
                aria-label="Select floor for desk"
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
              <input
                className="input"
                placeholder="Desk number (e.g. 1-ENG-011)"
                aria-label="Desk number"
                value={deskForm.deskNumber}
                onChange={(e) => setDeskForm((current) => ({ ...current, deskNumber: e.target.value }))}
              />
              <button aria-label="Create desk" className="btn btn-primary w-full" onClick={handleCreateDesk} disabled={creatingDesk}>
                {creatingDesk ? 'Creating...' : 'Create Desk'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Desk Inventory</h2>
          {desks.length === 0 ? (
            <p className="text-gray-600">No desks found.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {desks.map((desk) => (
                <div key={desk.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{desk.deskNumber}</p>
                    <p className="text-sm text-gray-600">
                      {desk.floor.name} {desk.zone ? `• ${desk.zone.name}` : ''}
                    </p>
                  </div>
                  <button aria-label={`Deactivate desk ${desk.deskNumber}`} className="btn btn-danger" onClick={() => handleDeactivateDesk(desk.id)}>
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
