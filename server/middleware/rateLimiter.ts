import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { rateLimitRecords } from '@shared/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { RATE_LIMITS, ERROR_CODES } from '../constants';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Create a rate limiter middleware with the given configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests, please try again later',
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const endpoint = req.path;
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMs);

      // Get current request count in the window
      const [record] = await db
        .select({
          count: sql<number>`COALESCE(SUM(${rateLimitRecords.requestCount}), 0)`,
        })
        .from(rateLimitRecords)
        .where(
          and(
            eq(rateLimitRecords.key, key),
            eq(rateLimitRecords.endpoint, endpoint),
            gte(rateLimitRecords.windowStart, windowStart)
          )
        );

      const currentCount = Number(record?.count || 0);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount - 1));
      res.setHeader('X-RateLimit-Reset', new Date(now.getTime() + windowMs).toISOString());

      if (currentCount >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMITED,
            message,
            retryAfter: Math.ceil(windowMs / 1000),
          },
        });
      }

      // Record this request
      await db.insert(rateLimitRecords).values({
        key,
        endpoint,
        requestCount: 1,
        windowStart: now,
        windowEnd: new Date(now.getTime() + windowMs),
      });

      next();
    } catch (error) {
      // Don't block requests if rate limiting fails
      console.error('Rate limiting error:', error);
      next();
    }
  };
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(req: Request): string {
  return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
}

/**
 * Key generator using user ID (for authenticated endpoints)
 */
export function userKeyGenerator(req: any): string {
  return req.user?.id || defaultKeyGenerator(req);
}

/**
 * Key generator using email (for password reset)
 */
export function emailKeyGenerator(req: Request): string {
  return req.body?.email?.toLowerCase() || defaultKeyGenerator(req);
}

/**
 * Key generator combining organization and user
 */
export function orgUserKeyGenerator(req: any): string {
  const orgId = req.user?.organizationId || 'no-org';
  const userId = req.user?.id || 'anon';
  return `${orgId}:${userId}`;
}

// Pre-configured rate limiters
export const passwordResetLimiter = createRateLimiter({
  ...RATE_LIMITS.PASSWORD_RESET,
  keyGenerator: emailKeyGenerator,
  message: 'Too many password reset attempts. Please try again in an hour.',
});

export const loginLimiter = createRateLimiter({
  ...RATE_LIMITS.LOGIN,
  keyGenerator: emailKeyGenerator,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

export const apiGeneralLimiter = createRateLimiter({
  ...RATE_LIMITS.API_GENERAL,
  keyGenerator: orgUserKeyGenerator,
  message: 'API rate limit exceeded. Please try again later.',
});

export const requestCreateLimiter = createRateLimiter({
  ...RATE_LIMITS.REQUEST_CREATE,
  keyGenerator: userKeyGenerator,
  message: 'Daily request limit exceeded. Please try again tomorrow.',
});

/**
 * Clean up old rate limit records (run periodically)
 */
export async function cleanupRateLimitRecords(): Promise<number> {
  const result = await db
    .delete(rateLimitRecords)
    .where(sql`${rateLimitRecords.windowEnd} < NOW()`)
    .returning();
  return result.length;
}
