import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { sendError } from '../api-response';
import { Role } from '@/types';
import { prisma } from '@/lib/prisma';

export function withAuth(handler: NextApiHandler, requiredRole?: Role) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const sessionUser = session.user as any;
    const email = sessionUser?.email;

    if (!email) {
      return sendError(res, 'Unauthorized: Invalid session', 401);
    }

    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          teamId: true,
        },
      });
    } catch (error) {
      console.error('Database unavailable while authorizing request:', error);
      return sendError(res, 'Service temporarily unavailable', 503);
    }

    if (!dbUser) {
      return sendError(res, 'Unauthorized: User not found', 401);
    }

    // Check role if required
    if (requiredRole && dbUser.role !== requiredRole) {
      return sendError(res, 'Forbidden: Insufficient permissions', 403);
    }

    (req as any).user = dbUser;

    return handler(req, res);
  };
}

export function withAdminAuth(handler: NextApiHandler) {
  return withAuth(handler, 'ADMIN');
}
