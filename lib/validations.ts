import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  teamId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const bookingSchema = z.object({
  deskId: z.string().min(1, 'Desk ID is required'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  notes: z.string().optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const recommendationSchema = z.object({
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  floorId: z.string().optional(),
  preferSameFloorAsTeam: z.boolean().optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const deskSchema = z.object({
  floorId: z.string().min(1, 'Floor ID is required'),
  zoneId: z.string().optional(),
  deskNumber: z.string().min(1, 'Desk number is required'),
  isActive: z.boolean().default(true),
  location: z.object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  }).optional(),
  features: z.array(z.string()).optional(),
});

export const officeSchema = z.object({
  name: z.string().min(1, 'Office name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true),
});

export const floorSchema = z.object({
  officeId: z.string().min(1, 'Office ID is required'),
  name: z.string().min(1, 'Floor name is required'),
  floorNumber: z.number().int().min(0),
  mapUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const zoneSchema = z.object({
  floorId: z.string().min(1, 'Floor ID is required'),
  name: z.string().min(1, 'Zone name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const userPreferencesSchema = z.object({
  needsMonitor: z.boolean().default(false),
  needsStandingDesk: z.boolean().default(false),
  prefersQuietArea: z.boolean().default(false),
  needsWindow: z.boolean().default(false),
  needsPowerOutlet: z.boolean().default(true),
});
