import Redis from 'ioredis';

/**
 * Redis Client Configuration
 *
 * Supports multiple deployment environments:
 * - Production: Uses REDIS_URL connection string
 * - Development: Connects to localhost:6379
 * - Fallback: Gracefully handles Redis unavailability
 */

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Check if Redis is configured
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  REDIS_URL not configured in production. Caching and session features will be degraded.');
      return null;
    }

    // Create Redis client
    if (redisUrl) {
      // Production: Use connection string
      console.log('🔗 Connecting to Redis via REDIS_URL...');
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
      });
    } else {
      // Development: Use localhost
      console.log('🔗 Connecting to Redis at localhost:6379...');
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
      });
    }

    // Event handlers
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    redisClient.on('close', () => {
      console.log('🔌 Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    // Attempt to connect
    redisClient.connect().catch((err) => {
      console.error('❌ Failed to connect to Redis:', err);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    return null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  // Organization caching
  organization: (id: number) => `org:${id}`,
  organizationFeatures: (id: number) => `org:${id}:features`,
  organizationAll: () => `org:all`,

  // Building caching
  buildings: (orgId: number) => `buildings:org:${orgId}`,
  building: (id: number) => `building:${id}`,

  // Facility caching
  facilities: (orgId: number) => `facilities:org:${orgId}`,
  facility: (id: number) => `facility:${id}`,

  // User caching
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  maintenanceStaff: (orgId: number) => `maintenance:org:${orgId}`,

  // Rate limiting (migrated from database)
  rateLimit: (key: string) => `ratelimit:${key}`,
};

/**
 * Cache TTLs (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,              // 1 minute
  MEDIUM: 300,            // 5 minutes
  LONG: 3600,             // 1 hour
  DAY: 86400,             // 24 hours
  WEEK: 604800,           // 7 days

  // Specific use cases
  ORGANIZATION: 3600,     // 1 hour
  BUILDINGS: 1800,        // 30 minutes
  FACILITIES: 1800,       // 30 minutes
  USER: 600,              // 10 minutes
  SESSION: 86400,         // 24 hours
};

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis || !isRedisAvailable()) return null;

    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis || !isRedisAvailable()) return false;

    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete cached value
   */
  async del(key: string | string[]): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis || !isRedisAvailable()) return false;

    try {
      await redis.del(Array.isArray(key) ? key : [key]);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis || !isRedisAvailable()) return false;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  },

  /**
   * Get or set cached value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache (fire and forget)
    this.set(key, value, ttl).catch((err) => {
      console.error(`Cache set error in getOrSet for key ${key}:`, err);
    });

    return value;
  },
};

// Initialize Redis on module load
getRedisClient();

export default redisClient;
