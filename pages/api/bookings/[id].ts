import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';
import { cancelMockBooking } from '@/lib/mock-bookings';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const user = (req as any).user;

  if (typeof id !== 'string') {
    return sendError(res, 'Invalid booking ID', 400);
  }

  if (req.method === 'DELETE') {
    try {
      // Get booking to check ownership
      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        return sendError(res, 'Booking not found', 404);
      }

      // Check if user owns this booking or is admin
      if (booking.userId !== user.id && user.role !== 'ADMIN') {
        return sendError(res, 'Forbidden: You can only cancel your own bookings', 403);
      }

      // Check if booking is already cancelled
      if (booking.status === 'CANCELLED') {
        return sendError(res, 'Booking is already cancelled', 400);
      }

      // Update booking status to cancelled
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
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
      });

      return sendSuccess(res, updatedBooking, 'Booking cancelled successfully');
    } catch (error) {
      console.warn('⚠️ Failed to cancel booking in database, trying offline mode...');
      const cancelled = cancelMockBooking(id, user.id, user.role);

      if (!cancelled) {
        return sendError(res, 'Booking not found or cannot be cancelled', 404);
      }

      // Convert mock booking to BookingWithDetails format
      const formattedBooking = {
        id: cancelled.id,
        startTime: cancelled.startTime,
        endTime: cancelled.endTime,
        status: cancelled.status,
        notes: cancelled.notes || null,
        createdAt: cancelled.createdAt,
        desk: cancelled.desk,
      };

      return sendSuccess(res, formattedBooking, 'Booking cancelled successfully');
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withAuth(handler);
