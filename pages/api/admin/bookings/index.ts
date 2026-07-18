import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';
import { getMockBookingsForUser } from '@/lib/mock-bookings';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user;

  // Only admins can access this endpoint
  if (user.role !== 'ADMIN') {
    return sendError(res, 'Forbidden: Admin access required', 403);
  }

  if (req.method === 'GET') {
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          desk: {
            include: {
              floor: {
                select: {
                  name: true,
                  floorNumber: true,
                },
              },
              zone: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
      });

      return sendSuccess(res, bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      
      // Fallback to mock bookings - admin sees all
      const mockBookings = getMockBookingsForUser(user.id, 'ADMIN');
      
      // Format mock bookings to match expected structure
      const formattedBookings = mockBookings.map((booking) => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes || null,
        createdAt: booking.createdAt,
        user: booking.user,
        desk: booking.desk,
      }));

      return sendSuccess(res, formattedBookings);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withAuth(handler);
