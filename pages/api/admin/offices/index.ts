import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { officeSchema } from '@/lib/validations';
import { addStoredOffice, getStoredFloors, getStoredOffices } from '@/lib/admin-entities-storage';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const offices = await prisma.office.findMany({
        include: {
          floors: {
            select: {
              id: true,
              name: true,
              floorNumber: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return sendSuccess(res, offices);
    } catch (error) {
      console.error('Get offices error:', error);

      const storedOffices = getStoredOffices();
      const storedFloors = getStoredFloors();
      const officesWithFloors = storedOffices.map((office) => ({
        ...office,
        floors: storedFloors
          .filter((floor) => floor.officeId === office.id)
          .map((floor) => ({
            id: floor.id,
            name: floor.name,
            floorNumber: floor.floorNumber,
          })),
      }));

      return sendSuccess(res, officesWithFloors);
    }
  }

  if (req.method === 'POST') {
    try {
      const validated = officeSchema.parse(req.body);

      const office = await prisma.office.create({
        data: validated,
      });

      return sendSuccess(res, office, 'Office created successfully', 201);
    } catch (error: any) {
      console.error('Create office error:', error);

      if (error.errors) {
        const errorMessage = error.errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return sendError(res, errorMessage, 400);
      }

      try {
        const parsed = officeSchema.safeParse(req.body);
        if (!parsed.success) {
          return sendError(res, 'Invalid office data', 400);
        }

        const office = addStoredOffice(parsed.data);
        return sendSuccess(res, office, 'Office created successfully (offline mode)', 201);
      } catch (offlineError) {
        console.error('Offline create office error:', offlineError);
      }

      return sendError(res, 'Failed to create office', 500);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withRateLimit(withAdminAuth(handler));
