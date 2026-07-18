import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { bookingSchema } from '@/lib/validations';
import {
  createMockBooking,
  getMockBookingsForUser,
  getOverlappingMockBookingForDesk,
} from '@/lib/mock-bookings';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user;

  if (!user?.id) {
    return sendError(res, 'Unauthorized: Invalid user session, please sign in again', 401);
  }

  if (req.method === 'GET') {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          userId: user.id,
          status: 'CONFIRMED',
        },
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
        orderBy: {
          startTime: 'desc',
        },
      });

      return sendSuccess(res, bookings);
    } catch (error) {
      console.warn('⚠️ Failed to get bookings from database, returning mock bookings...');
      // Always filter by user ID, regardless of role - admins use /api/admin/bookings for all bookings
      const mockBookings = getMockBookingsForUser(user.id);
      // Convert mock bookings to BookingWithDetails format
      const formattedMockBookings = mockBookings.map((booking: any) => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes || null,
        createdAt: booking.createdAt,
        desk: booking.desk,
      }));
      return sendSuccess(res, formattedMockBookings);
    }
  }

  if (req.method === 'POST') {
    try {
      const validated = bookingSchema.parse(req.body);
      const startTime = new Date(validated.startTime);
      const endTime = new Date(validated.endTime);

      if (startTime <= new Date()) {
        return sendError(res, 'Start time must be in the future', 400);
      }

      try {
        // Check if desk exists and is active
        const desk = await prisma.desk.findUnique({
          where: { id: validated.deskId },
        });

        if (!desk || !desk.isActive) {
          return sendError(res, 'Desk not found or inactive', 404);
        }

        // Check for existing bookings (overlaps)
        const existingBooking = await prisma.booking.findFirst({
          where: {
            deskId: validated.deskId,
            status: 'CONFIRMED',
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        });

        if (existingBooking) {
          return sendError(res, 'Desk is already booked for this time period', 409);
        }

        // Create booking
        const booking = await prisma.booking.create({
          data: {
            userId: user.id,
            deskId: validated.deskId,
            startTime,
            endTime,
            status: 'CONFIRMED',
            notes: validated.notes,
          },
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

        return sendSuccess(res, booking, 'Booking created successfully', 201);
      } catch (dbError: any) {
        console.warn('⚠️ Database unavailable, creating mock booking...');

        const existingMockBooking = getOverlappingMockBookingForDesk(
          validated.deskId,
          startTime,
          endTime
        );

        if (existingMockBooking) {
          return sendError(res, 'Desk is already booked for this time period', 409);
        }

        const createdMockBooking = createMockBooking({
          user,
          deskId: validated.deskId,
          startTime,
          endTime,
          notes: validated.notes,
        });
        
        return sendSuccess(res, createdMockBooking, 'Booking created successfully (offline mode)', 201);
      }
    } catch (error: any) {
      console.error('Create booking error:', error);

      if (error.errors) {
        const errorMessage = error.errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return sendError(res, errorMessage, 400);
      }

      if (error.message?.includes('already booked')) {
        return sendError(res, error.message, 409);
      }

      if (error.code === 'P2003') {
        return sendError(res, 'Invalid user or desk reference for booking', 400);
      }

      if (error.code === 'P2002') {
        return sendError(res, 'Duplicate booking detected', 409);
      }

      return sendError(res, 'Failed to create booking', 500);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withRateLimit(withAuth(handler));
