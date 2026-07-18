import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendSuccess, sendError } from '@/lib/api-response';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return sendError(res, 'Not authenticated', 401);
    }

    return sendSuccess(res, {
      id: (session.user as any).id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return sendError(res, 'Failed to get user', 500);
  }
}
