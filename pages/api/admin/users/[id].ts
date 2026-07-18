import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user;
  const { id } = req.query;

  // Only admins can access this endpoint
  if (user.role !== 'ADMIN') {
    return sendError(res, 'Forbidden: Admin access required', 403);
  }

  if (typeof id !== 'string') {
    return sendError(res, 'Invalid user ID', 400);
  }

  if (req.method === 'PATCH') {
    try {
      const { role } = req.body;

      if (!role || !['USER', 'ADMIN'].includes(role)) {
        return sendError(res, 'Invalid role. Must be USER or ADMIN', 400);
      }

      // Prevent admin from removing their own admin role
      if (id === user.id && role !== 'ADMIN') {
        return sendError(res, 'Cannot remove your own admin privileges', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return sendSuccess(res, updatedUser, 'User role updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      return sendError(res, 'User not found or update failed (database offline)', 404);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withRateLimit(withAuth(handler));
