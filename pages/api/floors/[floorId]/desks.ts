import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';
import { getActiveMockBookingsInRange } from '@/lib/mock-bookings';
import { getDeskPositionMap } from '@/lib/desk-positions-storage';
import { getDesksForFloor, hasCustomDesks } from '@/lib/desks-storage';

// Generate mock desks dynamically based on floor
function generateMockDesksForFloor(floorId: string) {
  const zones = ['North Wing', 'South Wing', 'East Wing'];
  const desks = [];
  let deskCounter = 1;

  for (let zone = 0; zone < zones.length; zone++) {
    for (let i = 0; i < 4; i++) {
      desks.push({
        id: `desk-${floorId}-${deskCounter}`,
        floorId: floorId,
        zoneId: `zone-${zone}`,
        deskNumber: deskCounter,
        x: 10 + (i * 40),
        y: 10 + (zone * 60),
        isActive: true,
        floor: { id: floorId, name: `Floor ${floorId}`, floorNumber: parseInt(floorId.split('-')[1] || '1') || 1 },
        zone: { id: `zone-${zone}`, name: zones[zone] },
        features: [],
        isBooked: false,
        activeBooking: null,
        bookedByMyTeam: false,
      });
      deskCounter++;
    }
  }

  return desks;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = (req as any).user;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const { floorId } = req.query;

    if (typeof floorId !== 'string') {
      return sendError(res, 'Invalid floor ID', 400);
    }

    const startTime = typeof req.query.startTime === 'string' ? new Date(req.query.startTime) : null;
    const endTime = typeof req.query.endTime === 'string' ? new Date(req.query.endTime) : null;
    const shouldFilterByTime =
      !!startTime && !!endTime && !Number.isNaN(startTime.getTime()) && !Number.isNaN(endTime.getTime());

    const desks = await prisma.desk.findMany({
      where: {
        floorId,
        isActive: true,
      },
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
        bookings: {
          where: {
            status: 'CONFIRMED',
            ...(shouldFilterByTime
              ? {
                  AND: [
                    { startTime: { lt: endTime as Date } },
                    { endTime: { gt: startTime as Date } },
                  ],
                }
              : {}),
          },
          orderBy: {
            startTime: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                teamId: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        deskNumber: 'asc',
      },
    });

    const desksWithStatus = desks.map((desk: any) => {
      const activeBooking = desk.bookings[0] || null;
      return {
        ...desk,
        isBooked: !!activeBooking,
        activeBooking: activeBooking
          ? {
              id: activeBooking.id,
              startTime: activeBooking.startTime,
              endTime: activeBooking.endTime,
              user: {
                id: activeBooking.user.id,
                name: activeBooking.user.name,
                email: activeBooking.user.email,
                teamId: activeBooking.user.teamId,
                teamName: activeBooking.user.team?.name || null,
              },
            }
          : null,
        bookedByMyTeam: !!activeBooking && !!user?.teamId && activeBooking.user.teamId === user.teamId,
      };
    });

    return sendSuccess(res, desksWithStatus);
  } catch (error) {
    console.warn('⚠️ Failed to get desks from database, using mock data...');
    
    const floorId = req.query.floorId as string;
    const storedPositions = getDeskPositionMap();
    const startTime = typeof req.query.startTime === 'string' ? new Date(req.query.startTime) : null;
    const endTime = typeof req.query.endTime === 'string' ? new Date(req.query.endTime) : null;
    const activeMockBookings = getActiveMockBookingsInRange(startTime, endTime);

    // Check if custom desks exist for this floor
    let mockDesks;
    if (hasCustomDesks(floorId)) {
      // Use custom desks from storage
      const customDesks = getDesksForFloor(floorId);
      mockDesks = customDesks.map((desk) => ({
        id: desk.id,
        floorId: floorId,
        zoneId: 'zone-0',
        deskNumber: desk.deskNumber,
        x: null,
        y: null,
        isActive: desk.isActive,
        floor: { id: floorId, name: `Floor ${floorId}`, floorNumber: parseInt(floorId.split('-')[1] || '1') || 1 },
        zone: { id: 'zone-0', name: 'Main Area' },
        features: [],
        isBooked: false,
        activeBooking: null,
        bookedByMyTeam: false,
      }));
      console.log(`✅ Using custom desks for floor ${floorId}: ${mockDesks.length} desks`);
    } else {
      // Generate mock desks for the requested floor
      mockDesks = generateMockDesksForFloor(floorId);
      console.log(`✅ Using generated mock desks for floor ${floorId}: ${mockDesks.length} desks`);
    }

    const mockWithStatus = mockDesks.map((desk) => {
      const storedPosition = storedPositions.get(desk.id);
      const activeBooking = activeMockBookings.find((booking) => booking.deskId === desk.id) || null;
      return {
        ...desk,
        ...(storedPosition
          ? { x: storedPosition.positionX, y: storedPosition.positionY, positionX: storedPosition.positionX, positionY: storedPosition.positionY }
          : { positionX: desk.x, positionY: desk.y }),
        isBooked: !!activeBooking,
        activeBooking: activeBooking
          ? {
              id: activeBooking.id,
              startTime: activeBooking.startTime,
              endTime: activeBooking.endTime,
              user: {
                id: activeBooking.user.id,
                name: activeBooking.user.name,
                email: activeBooking.user.email,
                teamId: activeBooking.user.teamId,
                teamName: activeBooking.user.teamName,
              },
            }
          : null,
        bookedByMyTeam:
          !!activeBooking &&
          !!user?.teamId &&
          activeBooking.user.teamId === user.teamId,
      };
    });

    return sendSuccess(res, mockWithStatus);
  }
}

export default withAuth(handler);
