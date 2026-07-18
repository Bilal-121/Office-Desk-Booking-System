import fs from 'fs';
import path from 'path';

export interface MockSessionUser {
  id: string;
  name: string;
  email: string;
  teamId?: string | null;
  role?: string;
}

export interface MockBooking {
  id: string;
  userId: string;
  deskId: string;
  startTime: Date;
  endTime: Date;
  status: 'CONFIRMED' | 'CANCELLED';
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    teamId: string | null;
    teamName: string | null;
  };
  desk: {
    id: string;
    deskNumber: string;
    floor: {
      name: string;
      floorNumber: number;
    };
    zone: {
      name: string;
    } | null;
  };
}

// Mock desk inventory for fallback mode
const mockDeskInventory: Record<string, { id: string; deskNumber: string; floor: { name: string; floorNumber: number }; zone: { name: string } | null }> = {};

function getMockDeskInfo(deskId: string) {
  if (!mockDeskInventory[deskId]) {
    // Generate mock desk info from deskId
    mockDeskInventory[deskId] = {
      id: deskId,
      deskNumber: `Desk-${deskId.substring(0, 8)}`,
      floor: {
        name: 'Floor 1',
        floorNumber: 1,
      },
      zone: {
        name: 'Zone A',
      },
    };
  }
  return mockDeskInventory[deskId];
}

// File-based persistence for mock bookings
const MOCK_BOOKINGS_FILE = path.join(process.cwd(), '.mock-bookings.json');

function loadMockBookings(): MockBooking[] {
  try {
    if (fs.existsSync(MOCK_BOOKINGS_FILE)) {
      const data = fs.readFileSync(MOCK_BOOKINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((booking: any) => ({
        ...booking,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Failed to load mock bookings from file:', error);
  }
  return [];
}

function saveMockBookings(bookings: MockBooking[]): void {
  try {
    fs.writeFileSync(MOCK_BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save mock bookings to file:', error);
  }
}

const mockBookings: MockBooking[] = loadMockBookings();

export function createMockBooking(input: {
  user: MockSessionUser;
  deskId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}): MockBooking {
  const booking: MockBooking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.user.id,
    deskId: input.deskId,
    startTime: input.startTime,
    endTime: input.endTime,
    status: 'CONFIRMED',
    notes: input.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: input.user.id,
      name: input.user.name,
      email: input.user.email,
      teamId: input.user.teamId || null,
      teamName: input.user.teamId ? 'Your Team' : null,
    },
    desk: getMockDeskInfo(input.deskId),
  };

  mockBookings.push(booking);
  saveMockBookings(mockBookings); // Persist to file
  console.log(`✅ Mock booking created and saved: ${booking.id}`);
  return booking;
}

export function getMockBookingsForUser(userId: string, role?: string): MockBooking[] {
  if (role === 'ADMIN') {
    return [...mockBookings];
  }

  return mockBookings.filter((booking) => booking.userId === userId);
}

export function getOverlappingMockBookingForDesk(
  deskId: string,
  startTime: Date,
  endTime: Date
): MockBooking | null {
  return (
    mockBookings.find(
      (booking) =>
        booking.deskId === deskId &&
        booking.status === 'CONFIRMED' &&
        booking.startTime < endTime &&
        booking.endTime > startTime
    ) || null
  );
}

export function getActiveMockBookingsInRange(startTime?: Date | null, endTime?: Date | null): MockBooking[] {
  return mockBookings.filter((booking) => {
    if (booking.status !== 'CONFIRMED') {
      return false;
    }

    if (!startTime || !endTime) {
      return true;
    }

    return booking.startTime < endTime && booking.endTime > startTime;
  });
}

export function cancelMockBooking(bookingId: string, userId: string, role?: string): MockBooking | null {
  const booking = mockBookings.find((item) => item.id === bookingId);

  if (!booking) {
    console.log(`❌ Booking not found: ${bookingId}`);
    console.log(`📋 Available bookings: ${mockBookings.map(b => b.id).join(', ')}`);
    return null;
  }

  if (role !== 'ADMIN' && booking.userId !== userId) {
    console.log(`❌ Unauthorized cancel attempt: user ${userId} tried to cancel booking ${bookingId} owned by ${booking.userId}`);
    return null;
  }

  booking.status = 'CANCELLED';
  booking.updatedAt = new Date();
  saveMockBookings(mockBookings); // Persist to file
  console.log(`✅ Mock booking cancelled and saved: ${bookingId}`);
  return booking;
}
