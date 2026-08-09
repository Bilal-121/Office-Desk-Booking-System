import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';

/**
 * Keeps the Supabase free-tier project out of auto-pause by performing a
 * real database round-trip on a schedule (see vercel.json `crons`).
 * Supabase pauses projects after 7 days with no activity; Vercel Hobby
 * cron jobs run at most once a day, so a daily hit is a wide safety margin.
 *
 * When CRON_SECRET is set, Vercel automatically sends it as
 * `Authorization: Bearer <CRON_SECRET>` on cron-triggered requests, so we
 * verify it here to stop this endpoint being triggered by anyone else.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return sendError(res, 'Unauthorized', 401);
    }
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, {
      status: 'pinged',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Keep-alive ping failed:', error);
    return sendError(res, 'Database ping failed', 500);
  }
}
