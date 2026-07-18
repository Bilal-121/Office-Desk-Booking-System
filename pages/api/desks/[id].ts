import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const { id } = req.query;
    const { startTime, endTime } = req.query;

    if (typeof id !== 'string') {
      return sendError(res, 'Invalid desk ID', 400);
    }

    const desk = await prisma.desk.findUnique({
      where: { id },
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
            deskFeature: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!desk) {
      return sendError(res, 'Desk not found', 404);
    }

    // Check availability if time range provided
    let isAvailable = true;
    if (startTime && endTime) {
      const start = new Date(startTime as string);
      const end = new Date(endTime as string);

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          deskId: id,
          status: 'CONFIRMED',
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      isAvailable = !conflictingBooking;
    }

    return sendSuccess(res, {
      ...desk,
      isAvailable,
    });
  } catch (error) {
    console.error('Get desk error:', error);
    return sendError(res, 'Failed to get desk', 500);
  }
}

export default withAuth(handler);
