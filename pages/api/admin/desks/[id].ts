import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return sendError(res, 'Invalid desk ID', 400);
  }

  if (req.method === 'DELETE') {
    try {
      // Soft delete by marking as inactive
      const desk = await prisma.desk.update({
        where: { id },
        data: { isActive: false },
      });

      return sendSuccess(res, desk, 'Desk deactivated successfully');
    } catch (error) {
      console.error('Delete desk error:', error);
      return sendError(res, 'Failed to deactivate desk', 500);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withRateLimit(withAdminAuth(handler));
