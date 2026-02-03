import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { rateLimitRecords } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { RATE_LIMITS, ERROR_CODES } from '../constants';
import { getRedisClient, isRedisAvailable, CacheKeys } from '../redis';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Redis-based rate limiter (preferred)
 *
 * Uses Redis sliding window algorithm for accurate rate limiting
 * with minimal memory footprint and no database writes.
 */
async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; reset: Date }> {
  const redis = getRedisClient();
  if (!redis || !isRedisAvailable()) {
    // Redis unavailable, allow request (fail open)
    return { allowed: true, remaining: maxRequests, reset: new Date() };
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = CacheKeys.rateLimit(key);

  try {
    // Sliding window algorithm using sorted sets
    const multi = redis.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(redisKey, 0, windowStart);

    // Count current entries in the window
    multi.zcard(redisKey);

    // Add current request with timestamp as score and member
    const requestId = `${now}:${Math.random()}`;
    multi.zadd(redisKey, now, requestId);

    // Set expiry on the key (cleanup)
    multi.expire(redisKey, Math.ceil(windowMs / 1000) + 60);

    const results = await multi.exec();

    // results[1] is the count before adding the current request
    const currentCount = results?.[1]?.[1] as number || 0;
    const remaining = Math.max(0, maxRequests - currentCount - 1);
    const reset = new Date(now + windowMs);

    return {
      allowed: currentCount < maxRequests,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fail open - allow the request if Redis has issues
    return { allowed: true, remaining: maxRequests, reset: new Date() };
  }
}

/**
 * Database-based rate limiter (fallback)
 *
 * Less efficient but works when Redis is unavailable.
 * Writes to database on every request.
 */
async function checkRateLimitDatabase(
  key: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; reset: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Get current request count in the window
    const [record] = await db
      .select({
        count: sql<number>`COALESCE(SUM(${rateLimitRecords.requestCount}), 0)`,
      })
      .from(rateLimitRecords)
      .where(
        sql`${rateLimitRecords.key} = ${key}
            AND ${rateLimitRecords.endpoint} = ${endpoint}
            AND ${rateLimitRecords.windowStart} >= ${windowStart}`
      );

    const currentCount = Number(record?.count || 0);
    const remaining = Math.max(0, maxRequests - currentCount - 1);
    const reset = new Date(now.getTime() + windowMs);

    const allowed = currentCount < maxRequests;

    // Record this request if allowed
    if (allowed) {
      await db.insert(rateLimitRecords).values({
        key,
        endpoint,
        requestCount: 1,
        windowStart: now,
        windowEnd: new Date(now.getTime() + windowMs),
      });
    }

    return { allowed, remaining, reset };
  } catch (error) {
    console.error('Database rate limit error:', error);
    // Fail open - allow the request if database has issues
    return { allowed: true, remaining: maxRequests, reset: new Date() };
  }
}

/**
 * Create a rate limiter middleware with the given configuration
 *
 * Automatically uses Redis if available, falls back to database.
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

      // Use Redis if available, otherwise fall back to database
      const useRedis = isRedisAvailable();
      const result = useRedis
        ? await checkRateLimitRedis(`${endpoint}:${key}`, maxRequests, windowMs)
        : await checkRateLimitDatabase(key, endpoint, maxRequests, windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset.toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMITED,
            message,
            retryAfter: Math.ceil(windowMs / 1000),
          },
        });
      }

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
 * Clean up old rate limit records from database (only needed for fallback mode)
 *
 * Redis automatically handles cleanup via TTL.
 * This is only for database-backed rate limits.
 */
export async function cleanupRateLimitRecords(): Promise<number> {
  // Skip cleanup if Redis is handling rate limits
  if (isRedisAvailable()) {
    return 0;
  }

  try {
    const result = await db
      .delete(rateLimitRecords)
      .where(sql`${rateLimitRecords.windowEnd} < NOW()`)
      .returning();
    return result.length;
  } catch (error) {
    console.error('Error cleaning up rate limit records:', error);
    return 0;
  }
}
