import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { deskSchema } from '@/lib/validations';
import { addDesk, removeDesk, getNextDeskNumber, getDesksForFloor } from '@/lib/desks-storage';
import { getStoredFloors } from '@/lib/admin-entities-storage';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { floorId } = req.query;

    try {
      const where: any = { isActive: true };
      if (floorId && typeof floorId === 'string') {
        where.floorId = floorId;
      }

      const desks = await prisma.desk.findMany({
        where,
        include: {
          floor: {
            select: {
              id: true,
              name: true,
              floorNumber: true,
            },
          },
          zone: {
            select: {
              id: true,
              name: true,
            },
          },
          features: {
            include: {
              deskFeature: true,
            },
          },
        },
        orderBy: { deskNumber: 'asc' },
      });

      return sendSuccess(res, desks);
    } catch (error) {
      console.error('Get desks error:', error);

      const storedFloors = getStoredFloors();
      const targetFloors = floorId && typeof floorId === 'string'
        ? storedFloors.filter((item) => item.id === floorId)
        : storedFloors;

      const offlineDesks = targetFloors.flatMap((floor) =>
        getDesksForFloor(floor.id).map((desk) => ({
          id: desk.id,
          deskNumber: desk.deskNumber,
          isActive: desk.isActive,
          floor: {
            id: floor.id,
            name: floor.name,
            floorNumber: floor.floorNumber,
          },
          zone: null,
          features: [],
        }))
      );

      return sendSuccess(res, offlineDesks);
    }
  }

  if (req.method === 'POST') {
    try {
      const validated = deskSchema.parse(req.body);

      // Create desk
      const desk = await prisma.desk.create({
        data: {
          floorId: validated.floorId,
          zoneId: validated.zoneId,
          deskNumber: validated.deskNumber,
          isActive: validated.isActive,
        },
      });

      // Add location if provided
      if (validated.location) {
        await prisma.$executeRaw`
          UPDATE desks 
          SET location = ST_SetSRID(ST_MakePoint(${validated.location.longitude}, ${validated.location.latitude}), 4326)
          WHERE id = ${desk.id}
        `;
      }

      // Add features if provided
      if (validated.features && validated.features.length > 0) {
        await prisma.deskFeatureMap.createMany({
          data: validated.features.map((featureId) => ({
            deskId: desk.id,
            deskFeatureId: featureId,
          })),
        });
      }

      const createdDesk = await prisma.desk.findUnique({
        where: { id: desk.id },
        include: {
          floor: {
            select: {
              name: true,
            },
          },
          zone: {
            select: {
              name: true,
            },
          },
          features: {
            include: {
              deskFeature: true,
            },
          },
        },
      });

      return sendSuccess(res, createdDesk, 'Desk created successfully', 201);
    } catch (error: any) {
      console.error('Create desk error:', error);

      // Real validation/conflict errors should be reported as-is, not silently
      // routed to offline storage (which would mask the actual problem).
      if (error.errors) {
        const errorMessage = error.errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return sendError(res, errorMessage, 400);
      }

      if (error.code === 'P2002') {
        return sendError(res, 'Desk number already exists on this floor', 409);
      }

      // Offline fallback for genuine DB-connectivity failures
      if (req.body.floorId && typeof req.body.floorId === 'string') {
        try {
          const floorId = req.body.floorId;
          const deskNumber = req.body.deskNumber || getNextDeskNumber(floorId);
          const newDesk = addDesk(floorId, deskNumber);

          return sendSuccess(
            res,
            {
              id: newDesk.id,
              deskNumber: newDesk.deskNumber,
              positionX: null,
              positionY: null,
              isActive: newDesk.isActive,
            },
            'Desk created successfully (offline mode)',
            201
          );
        } catch (offlineError) {
          console.error('Offline desk creation failed:', offlineError);
        }
      }

      return sendError(res, 'Failed to create desk', 500);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { deskId } = req.body;

      if (!deskId || typeof deskId !== 'string') {
        return sendError(res, 'Desk ID is required', 400);
      }

      // Try database first
      await prisma.desk.update({
        where: { id: deskId },
        data: { isActive: false },
      });

      return sendSuccess(res, null, 'Desk removed successfully');
    } catch (error) {
      console.error('Database desk deletion failed:', error);
      
      // Fallback to offline storage
      const { deskId } = req.body;
      if (deskId && typeof deskId === 'string') {
        const removed = removeDesk(deskId);
        
        if (removed) {
          return sendSuccess(res, null, 'Desk removed successfully (offline mode)');
        }
      }

      return sendError(res, 'Failed to remove desk', 500);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withRateLimit(withAdminAuth(handler));
