import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';
import { loadFloorPlans } from '@/lib/floor-plans-storage';

// Mock floors for development/fallback
const mockFloors = [
  {
    id: 'floor-1',
    name: 'Ground Floor',
    floorNumber: 0,
    officeId: 'office-1',
    isActive: true,
    mapUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    office: {
      id: 'office-1',
      name: 'Main Office',
    },
    _count: {
      desks: 12,
    },
  },
  {
    id: 'floor-2',
    name: 'First Floor',
    floorNumber: 1,
    officeId: 'office-1',
    isActive: true,
    mapUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    office: {
      id: 'office-1',
      name: 'Main Office',
    },
    _count: {
      desks: 15,
    },
  },
];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const floors = await prisma.floor.findMany({
      where: { isActive: true },
      include: {
        office: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            desks: true,
          },
        },
      },
      orderBy: [{ office: { name: 'asc' } }, { floorNumber: 'asc' }],
    });

    return sendSuccess(res, floors);
  } catch (error) {
    console.warn('⚠️ Failed to get floors from database, using mock data...');
    
    // Load any floor plans from offline storage
    const floorPlans = loadFloorPlans();
    
    // Inject mapUrl from offline storage into mock floors
    const floorsWithMaps = mockFloors.map((floor) => ({
      ...floor,
      mapUrl: floorPlans.get(floor.id) || null,
    }));
    
    return sendSuccess(res, floorsWithMaps);
  }
}

export default withAuth(handler);

