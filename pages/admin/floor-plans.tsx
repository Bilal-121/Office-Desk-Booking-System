import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FloorPlanEditor from '@/components/FloorPlanEditor';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

interface Floor {
  id: string;
  name: string;
  floorNumber: number;
  mapUrl: string | null;
  office: {
    id: string;
    name: string;
  };
  _count: {
    desks: number;
  };
}

interface Desk {
  id: string;
  deskNumber: string;
  positionX: number | null;
  positionY: number | null;
}

export default function FloorPlanManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [floorDesks, setFloorDesks] = useState<Desk[]>([]);
  const [loading, setLoading] = useState(true);

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
      fetchFloors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'floorsUpdated' || !event.newValue) {
        return;
      }

      try {
        toast.success('New floor available');
        fetchFloors();
      } catch {
        fetchFloors();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [status]);


  useEffect(() => {
    if (selectedFloorId) {
      fetchFloorDesks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloorId]);

  const fetchFloors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/floors');
      const result = await response.json();

      if (result.success) {
        const floorList = result.data || [];
        setFloors(floorList);
        if (floorList.length > 0 && !selectedFloorId) {
          setSelectedFloorId(floorList[0].id);
        }
      } else {
        toast.error(result.error || 'Failed to fetch floors');
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
      toast.error('Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  const fetchFloorDesks = async () => {
    if (!selectedFloorId) return;

    try {
      const response = await fetch(`/api/admin/floors/${selectedFloorId}/desks`);
      const result = await response.json();

      if (result.success) {
        setFloorDesks(result.data);
      } else {
        toast.error(result.error || 'Failed to fetch desks');
      }
    } catch (error) {
      console.error('Error fetching desks:', error);
      toast.error('Failed to fetch desks');
    }
  };

  const handleSave = () => {
    fetchFloorDesks();
    fetchFloors();
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

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Floor Plan Management</h1>
          <p className="mt-2 text-gray-600">
            Upload floor plan images and position desks for visual booking
          </p>
        </div>

        {/* Floor Selection */}
        <div className="card">
          <label htmlFor="floor-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Floor
          </label>
          <select
            id="floor-select"
            value={selectedFloorId}
            onChange={(e) => setSelectedFloorId(e.target.value)}
            className="input max-w-md"
          >
            {floors.length === 0 && <option value="">No floors found</option>}
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.office.name} • {floor.name} ({floor._count.desks} desks)
              </option>
            ))}
          </select>
        </div>

        {/* Floor Plan Editor */}
        {selectedFloor && (
          <FloorPlanEditor
            floorId={selectedFloor.id}
            currentMapUrl={selectedFloor.mapUrl}
            desks={floorDesks}
            onSave={handleSave}
            onDesksChange={fetchFloorDesks}
          />
        )}

        {!selectedFloor && floors.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-600">
              No floors found. Create a floor in the admin dashboard first.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="btn btn-primary mt-4"
            >
              Go to Admin Dashboard
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
