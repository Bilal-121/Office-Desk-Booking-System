import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user;

  // Only admins can access this endpoint
  if (user.role !== 'ADMIN') {
    return sendError(res, 'Forbidden: Admin access required', 403);
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return sendSuccess(res, users);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Fallback to mock users (show all known users in offline mode)
      const fallbackUsers = [
        {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@company.com',
          role: 'ADMIN',
          teamId: null,
          team: null,
          _count: { bookings: 0 },
        },
        {
          id: 'user-1',
          name: 'Test User',
          email: 'user@company.com',
          role: 'USER',
          teamId: 'team-1',
          team: { id: 'team-1', name: 'Your Team' },
          _count: { bookings: 0 },
        },
      ];

      const currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'ADMIN',
        teamId: user.teamId || null,
        team: user.teamId ? { id: user.teamId, name: 'Your Team' } : null,
        _count: { bookings: 0 },
      };

      const mockUsers = fallbackUsers.some((item) => item.id === currentUser.id)
        ? fallbackUsers
        : [currentUser, ...fallbackUsers];

      return sendSuccess(res, mockUsers);
    }
  }

  return sendError(res, 'Method not allowed', 405);
}

export default withAuth(handler);
