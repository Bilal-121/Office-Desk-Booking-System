import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { upsertDeskPositions } from '@/lib/desk-positions-storage';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { positions } = req.body as {
      positions: Array<{ deskId: string; positionX: number; positionY: number }>;
    };

    if (!Array.isArray(positions)) {
      return res.status(400).json({ success: false, error: 'Positions array required' });
    }

    try {
      // Update all desk positions in database
      const updatePromises = positions.map((pos) =>
        prisma.desk.update({
          where: { id: pos.deskId },
          data: {
            positionX: pos.positionX,
            positionY: pos.positionY,
          },
        })
      );

      await prisma.$transaction(updatePromises);

      return res.status(200).json({
        success: true,
        message: 'Positions saved successfully',
        data: { updatedCount: positions.length },
      });
    } catch (dbError) {
      console.warn('⚠️ Database unavailable, saving desk positions to offline storage...');
      upsertDeskPositions(positions);

      return res.status(200).json({
        success: true,
        message: 'Positions saved successfully (offline mode)',
        data: { updatedCount: positions.length, offline: true },
      });
    }
  } catch (error) {
    console.error('Save desk positions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save desk positions',
    });
  }
}

export default withRateLimit(withAdminAuth(handler));
