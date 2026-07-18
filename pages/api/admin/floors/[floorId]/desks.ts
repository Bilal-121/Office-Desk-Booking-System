import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getDeskPositionMap } from '@/lib/desk-positions-storage';
import { getDesksForFloor, hasCustomDesks } from '@/lib/desks-storage';
import { withAdminAuth } from '@/lib/middleware/auth';

// Generate mock desks dynamically based on floor
function generateMockDesksForFloor(floorId: string) {
  const zones = ['North Wing', 'South Wing', 'East Wing'];
  const desks = [];
  let deskCounter = 1;

  for (let zone = 0; zone < zones.length; zone++) {
    for (let i = 0; i < 4; i++) {
      desks.push({
        id: `desk-${floorId}-${deskCounter}`,
        deskNumber: `Desk-${deskCounter}`,
        positionX: 10 + (i * 40),
        positionY: 10 + (zone * 60),
        isActive: true,
      });
      deskCounter++;
    }
  }

  return desks;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { floorId } = req.query;

    if (typeof floorId !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid floor ID' });
    }

    const desks = await prisma.desk.findMany({
      where: { floorId },
      select: {
        id: true,
        deskNumber: true,
        positionX: true,
        positionY: true,
        isActive: true,
      },
      orderBy: {
        deskNumber: 'asc',
      },
    });

    return res.status(200).json({ success: true, data: desks });
  } catch (error) {
    console.error('Fetch floor desks error:', error);
    
    // Fallback to mock desks when database is unavailable
    const { floorId } = req.query;
    if (typeof floorId !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid floor ID' });
    }

    try {
      const storedPositions = getDeskPositionMap();
      
      // Check if custom desks exist for this floor
      let desksData;
      if (hasCustomDesks(floorId)) {
        // Use custom desks from storage
        const customDesks = getDesksForFloor(floorId);
        desksData = customDesks.map((desk) => {
          const storedPosition = storedPositions.get(desk.id);
          return {
            id: desk.id,
            deskNumber: desk.deskNumber,
            positionX: storedPosition?.positionX ?? null,
            positionY: storedPosition?.positionY ?? null,
            isActive: desk.isActive,
          };
        });
        console.log(`✅ Using custom desks for floor ${floorId}: ${desksData.length} desks`);
      } else {
        // Use generated mock desks
        const mockDesks = generateMockDesksForFloor(floorId).map((desk) => {
          const storedPosition = storedPositions.get(desk.id);
          if (!storedPosition) {
            return desk;
          }

          return {
            ...desk,
            positionX: storedPosition.positionX,
            positionY: storedPosition.positionY,
          };
        });
        desksData = mockDesks;
        console.log(`✅ Using mock desks for floor ${floorId}: ${desksData.length} desks generated`);
      }
      
      return res.status(200).json({ success: true, data: desksData });
    } catch (mockError) {
      console.error('Mock desk generation error:', mockError);
      return res.status(500).json({ success: false, error: 'Failed to fetch desks' });
    }
  }
}

export default withAdminAuth(handler);
