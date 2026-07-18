import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { sendError } from '../api-response';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes

export function withRateLimit(handler: NextApiHandler, max: number = RATE_LIMIT_MAX) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get client identifier (IP address)
    const identifier = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const key = `${identifier}:${req.url}`;

    // Clean up old entries
    if (rateLimitStore[key] && rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }

    // Initialize or increment
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS,
      };
    } else {
      rateLimitStore[key].count++;
    }

    // Check limit
    if (rateLimitStore[key].count > max) {
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(rateLimitStore[key].resetTime / 1000).toString()
      );
      return sendError(res, 'Too many requests, please try again later', 429);
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      (max - rateLimitStore[key].count).toString()
    );
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(rateLimitStore[key].resetTime / 1000).toString()
    );

    return handler(req, res);
  };
}
