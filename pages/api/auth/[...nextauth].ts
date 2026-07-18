import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';

const nextAuthHandler = NextAuth(authOptions);

// Only the actual credential-check callback is a brute-force target worth
// rate limiting. session/csrf/providers/signout are polled frequently by
// next-auth's own SessionProvider (on every mount, focus, and navigation) —
// throttling those too caused legitimate users to get 429s on /api/auth/session
// right after logging in, which next-auth reports as "unauthenticated" and
// bounces them straight back to the login page.
const rateLimitedCredentialsCheck = withRateLimit(nextAuthHandler, 20);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const isCredentialsCallback =
    req.method === 'POST' && req.url?.includes('/callback/credentials');

  if (isCredentialsCallback) {
    return rateLimitedCredentialsCheck(req, res);
  }

  return nextAuthHandler(req, res);
}
