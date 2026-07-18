export type Role = 'USER' | 'ADMIN';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export const BOOKING_STATUS: Record<BookingStatus, BookingStatus> = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  teamId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface BookingRequest {
  deskId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface RecommendationRequest {
  startTime: string;
  endTime: string;
  floorId?: string;
  preferSameFloorAsTeam?: boolean;
}

export interface DeskRecommendation {
  deskId: string;
  deskNumber: string;
  floorName: string;
  zoneName: string | null;
  score: number;
  distance: number | null;
  similarity: number | null;
  features: string[];
  isAvailable: boolean;
}

export interface DeskWithDetails {
  id: string;
  deskNumber: string;
  floorId: string;
  zoneId: string | null;
  isActive: boolean;
  floor: {
    id: string;
    name: string;
    floorNumber: number;
  };
  zone: {
    id: string;
    name: string;
  } | null;
  features: Array<{
    deskFeature: {
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
    };
  }>;
}

export interface BookingWithDetails {
  id: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  notes: string | null;
  createdAt: Date;
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
