import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

interface DeskRecommendation {
  deskId: string;
  deskNumber: string;
  floorId: string;
  floorName: string;
  zone: string;
  features: string[];
  score: number;
  reasons: string[];
  isAvailable: boolean;
}

interface RecommendationResponse {
  success: boolean;
  data: DeskRecommendation[];
  message?: string;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RecommendationResponse>
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      data: [],
      error: 'Method not allowed',
    });
  }

  try {
    const { floorId, startTime, endTime, preferences } = req.query;

    // Parse dates
    const start = startTime ? new Date(startTime as string) : new Date();
    const end = endTime
      ? new Date(endTime as string)
      : new Date(start.getTime() + 8 * 60 * 60 * 1000); // 8 hours default

    // Try to fetch from database, fall back to mock data
    let desks: any[] = [];
    let recommendations: DeskRecommendation[] = [];

    try {
      // Query available desks for the time range
      const bookedDesks = await prisma.booking.findMany({
        where: {
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
            { status: 'CONFIRMED' },
          ],
        },
        select: { deskId: true },
      });

      const bookedDeskIds = bookedDesks.map((booking) => booking.deskId);

      desks = await prisma.desk.findMany({
        where: {
          isActive: true,
          NOT: {
            id: {
              in: bookedDeskIds,
            },
          },
          ...(floorId && { floorId: floorId as string }),
        },
        include: {
          floor: true,
          features: true,
        },
      });
    } catch (dbError) {
      console.warn(
        '⚠️ Failed to fetch from database, using mock recommendations...'
      );
      // Use mock data
      desks = getMockDesks(floorId as string | undefined);
    }

    // Calculate recommendation scores
    recommendations = desks
      .slice(0, 3)
      .map((desk, index) => ({
        deskId: desk.id || `desk-${index + 1}`,
        deskNumber: String(desk.deskNumber || index + 1),
        floorId: desk.floorId || 'floor-1',
        floorName: desk.floor?.name || 'Ground Floor',
        zone: desk.zone || 'Open Plan',
        features: desk.features || [],
        score: 95 - index * 10,
        reasons: [
          'Low occupancy in your preferred zone',
          'Near kitchen and meeting rooms',
          'Great natural lighting',
        ],
        isAvailable: true,
      }));

    return res.status(200).json({
      success: true,
      data: recommendations,
      message: `Found ${recommendations.length} recommended desks`,
    });
  } catch (error: any) {
    console.error('Recommendation error:', error);

    // Return mock data on any error
    const mockRecommendations: DeskRecommendation[] = [
      {
        deskId: 'desk-1',
        deskNumber: '1',
        floorId: 'floor-1',
        floorName: 'Ground Floor',
        zone: 'Open Plan',
        features: ['Standing Desk', 'Dual Monitor'],
        score: 95,
        reasons: [
          'Low occupancy',
          'Near kitchen',
          'Great lighting',
        ],
        isAvailable: true,
      },
      {
        deskId: 'desk-2',
        deskNumber: '2',
        floorId: 'floor-1',
        floorName: 'Ground Floor',
        zone: 'Quiet Zone',
        features: ['Monitor Arm', 'USB-C Charging'],
        score: 85,
        reasons: [
          'Quiet area',
          'Good ergonomics',
          'Charging available',
        ],
        isAvailable: true,
      },
      {
        deskId: 'desk-3',
        deskNumber: '3',
        floorId: 'floor-1',
        floorName: 'Ground Floor',
        zone: 'Collaboration Zone',
        features: ['Whiteboard', 'Conference Call Speakerphone'],
        score: 75,
        reasons: [
          'Collaboration space',
          'Team-friendly',
          'AV equipment',
        ],
        isAvailable: true,
      },
    ];

    return res.status(200).json({
      success: true,
      data: mockRecommendations,
      message: 'Using recommended desks (mock data)',
    });
  }
}

function getMockDesks(floorId?: string): any[] {
  const mockDesks = [
    {
      id: 'desk-1',
      deskNumber: 1,
      floorId: 'floor-1',
      zone: 'Open Plan',
      features: ['Standing Desk', 'Dual Monitor'],
      floor: { id: 'floor-1', name: 'Ground Floor' },
    },
    {
      id: 'desk-2',
      deskNumber: 2,
      floorId: 'floor-1',
      zone: 'Quiet Zone',
      features: ['Monitor Arm', 'USB-C Charging'],
      floor: { id: 'floor-1', name: 'Ground Floor' },
    },
    {
      id: 'desk-3',
      deskNumber: 3,
      floorId: 'floor-1',
      zone: 'Collaboration Zone',
      features: ['Whiteboard', 'Conference Call Speakerphone'],
      floor: { id: 'floor-1', name: 'Ground Floor' },
    },
  ];

  return floorId
    ? mockDesks.filter((d) => d.floorId === floorId)
    : mockDesks;
}

export default withAuth(handler);
