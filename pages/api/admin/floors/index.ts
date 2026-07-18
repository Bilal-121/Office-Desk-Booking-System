import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { floorSchema } from '@/lib/validations';
import { addStoredFloor, getStoredFloors, getStoredOffices } from '@/lib/admin-entities-storage';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const floors = await prisma.floor.findMany({
        include: {
          office: {
            select: {
              id: true,
              name: true,
            },
          },
          zones: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ office: { name: 'asc' } }, { floorNumber: 'asc' }],
      });

      return sendSuccess(res, floors);
    } catch (error) {
      console.error('Get floors error:', error);

      const offices = getStoredOffices();
      const officeById = new Map(offices.map((office) => [office.id, office]));
      const floors = getStoredFloors().map((floor) => ({
        ...floor,
        office: {
          id: floor.officeId,
          name: officeById.get(floor.officeId)?.name || 'Unknown Office',
        },
        zones: [],
      }));

      return sendSuccess(res, floors);
    }
  }

  if (req.method === 'POST') {
    try {
      const validated = floorSchema.parse(req.body);

      const floor = await prisma.floor.create({
        data: validated,
        include: {
          office: {
            select: {
              name: true,
            },
          },
        },
      });

      return sendSuccess(res, floor, 'Floor created successfully', 201);
    } catch (error: any) {
      console.error('Create floor error:', error);

      if (error.errors) {
        const errorMessage = error.errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return sendError(res, errorMessage, 400);
      }

      if (error.code === 'P2002') {
        return sendError(res, 'Floor number already exists for this office', 409);
      }

      try {
        const parsed = floorSchema.safeParse(req.body);
        if (!parsed.success) {
          return sendError(res, 'Invalid floor data', 400);
        }

        const floor = addStoredFloor(parsed.data);
        const office = getStoredOffices().find((item) => item.id === floor.officeId);
        return sendSuccess(
          res,
          {
            ...floor,
            office: {
              name: office?.name || 'Unknown Office',
            },
          },
          'Floor created successfully (offline mode)',
          201
        );
      } catch (offlineError) {
        console.error('Offline create floor error:', offlineError);
      }

      return sendError(res, 'Failed to create floor', 500);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withRateLimit(withAdminAuth(handler));
