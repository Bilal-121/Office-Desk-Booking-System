import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware/auth';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, teams);
  } catch (error) {
    console.error('Get teams error:', error);
    return sendError(res, 'Failed to get teams', 500);
  }
}

export default withAuth(handler);
