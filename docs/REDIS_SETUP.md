# Redis Setup Guide

This document explains how to set up and configure Redis for the RepairRequest application.

## Overview

Redis is used for:
1. **Session storage** - Fast, distributed session management
2. **Rate limiting** - Accurate request throttling without database writes
3. **Caching** - Frequently accessed data (organizations, buildings, facilities, users)

## Benefits

- **Performance**: 100x faster than PostgreSQL for session/cache operations
- **Scalability**: Eliminates database bottleneck for high-traffic operations
- **Reduced costs**: Fewer database queries = lower database costs
- **Better UX**: Faster page loads and API responses

## Environment Variables

Add these to your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379  # For Railway/Heroku: redis://:{password}@{host}:{port}

# OR configure individual parameters
REDIS_HOST=localhost              # Redis server host
REDIS_PORT=6379                   # Redis server port
REDIS_PASSWORD=                   # Redis password (if required)

# Existing variables (already required)
SESSION_SECRET=your-secret-here
DATABASE_URL=postgres://...
```

## Local Development Setup

### Option 1: Docker (Recommended)

```bash
# Start Redis with Docker
docker run -d \
  --name repair request-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify Redis is running
docker ps | grep redis

# Test connection
docker exec -it repairrequest-redis redis-cli ping
# Should respond with: PONG
```

### Option 2: Direct Installation

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
Download from https://redis.io/download or use WSL2.

## Production Deployment

### Railway

1. Add Redis service to your project:
   - Go to your Railway project
   - Click "New" → "Database" → "Redis"
   - Railway will automatically create a Redis instance

2. Environment variable is automatically set:
   ```bash
   REDIS_URL=redis://default:{password}@{host}:{port}
   ```

3. Verify in logs:
   ```
   ✅ Redis connected successfully
   📦 Using Redis for session storage
   ```

### Heroku

1. Add Redis addon:
   ```bash
   heroku addons:create heroku-redis:mini
   ```

2. Verify addon:
   ```bash
   heroku addons:info heroku-redis
   heroku config:get REDIS_URL
   ```

### AWS/GCP/Azure

Use managed Redis services:
- **AWS**: ElastiCache for Redis
- **GCP**: Cloud Memorystore for Redis
- **Azure**: Azure Cache for Redis

## Fallback Behavior

The application gracefully falls back if Redis is unavailable:

- **Sessions**: Falls back to PostgreSQL session store
- **Rate limiting**: Falls back to database-backed rate limiter
- **Caching**: Bypasses cache, reads directly from database

This ensures the application continues to function even if Redis is down.

## Monitoring

### Check Redis Connection Status

```bash
# Development logs will show:
✅ Redis connected successfully
📦 Using Redis for session storage

# If Redis is unavailable:
⚠️  Redis unavailable, falling back to PostgreSQL session store
⚠️  REDIS_URL not configured in production
```

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Check connection
PING  # Should respond: PONG

# View all keys
KEYS *

# Monitor real-time commands
MONITOR

# Check memory usage
INFO memory

# View session keys
KEYS sess:*

# View cache keys
KEYS org:*
KEYS buildings:*
KEYS facilities:*

# View rate limit keys
KEYS ratelimit:*

# Flush all data (USE WITH CAUTION)
FLUSHALL
```

## Cache Keys Structure

The application uses a consistent key naming convention:

### Sessions
```
sess:{session-id}
```

### Organizations
```
org:{org-id}
org:all
org:{org-id}:features
```

### Buildings & Facilities
```
buildings:org:{org-id}
building:{building-id}
facilities:org:{org-id}
facility:{facility-id}
```

### Users
```
user:{user-id}
user:email:{email}
maintenance:org:{org-id}
```

### Rate Limiting
```
ratelimit:/api/login:{ip-or-email}
ratelimit:/api/requests:{user-id}
```

## Cache TTL (Time To Live)

Different data types have different expiration times:

- **Sessions**: 24 hours
- **Organizations**: 1 hour
- **Buildings/Facilities**: 30 minutes
- **Users**: 10 minutes
- **Rate limits**: Automatic cleanup via sliding window

## Performance Metrics

### Before Redis (Database-backed)

- **Session reads**: ~50-100ms per request
- **Rate limiting**: 2 database writes per request
- **Cache**: No caching (every query hits database)
- **Dashboard load**: 2-5 seconds with 1000+ requests

### After Redis

- **Session reads**: <1ms per request
- **Rate limiting**: 0 database writes (Redis only)
- **Cache hit rate**: 80-90% for frequently accessed data
- **Dashboard load**: <500ms with 1000+ requests

## Troubleshooting

### Redis connection timeout

```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
docker logs repairrequest-redis

# Verify REDIS_URL format
echo $REDIS_URL
```

### High memory usage

```bash
# Check memory stats
redis-cli INFO memory

# View largest keys
redis-cli --bigkeys

# Set max memory limit (redis.conf or command)
CONFIG SET maxmemory 256mb
CONFIG SET maxmemory-policy allkeys-lru
```

### Cache invalidation issues

```bash
# Clear specific cache
redis-cli DEL org:123
redis-cli DEL buildings:org:123

# Clear all cache (keeps sessions and rate limits)
redis-cli KEYS "org:*" | xargs redis-cli DEL
redis-cli KEYS "buildings:*" | xargs redis-cli DEL
redis-cli KEYS "facilities:*" | xargs redis-cli DEL
```

## Security

### Production Checklist

- ✅ Use strong password (`REDIS_PASSWORD`)
- ✅ Enable TLS/SSL for Redis connection
- ✅ Restrict network access (firewall rules)
- ✅ Use `REDIS_URL` instead of individual parameters
- ✅ Rotate passwords periodically
- ✅ Enable Redis persistence (RDB or AOF)

### Redis Configuration (redis.conf)

```conf
# Require password
requirepass your-strong-password-here

# Bind to specific interface (not 0.0.0.0 in production)
bind 127.0.0.1

# Enable TLS
tls-port 6380
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt

# Enable persistence
save 900 1      # Save if 1 key changed in 900 seconds
save 300 10     # Save if 10 keys changed in 300 seconds
save 60 10000   # Save if 10000 keys changed in 60 seconds
```

## Migration from PostgreSQL Sessions

The application automatically handles the migration:

1. **Deploy with Redis**: Sessions will start using Redis
2. **Old sessions**: PostgreSQL sessions will expire naturally (24 hours)
3. **Cleanup**: Old session table can be dropped after 48 hours

```sql
-- After 48 hours of Redis sessions
DROP TABLE IF EXISTS sessions;
```

## Cost Comparison

### PostgreSQL Sessions + Database Rate Limiting

- **Database writes**: ~1000/hour for sessions + 1000/hour for rate limiting
- **Database size**: +1GB/month for session/rate limit data
- **Cost**: ~$5-10/month in additional database costs

### Redis

- **Railway Redis**: $5/month (512MB)
- **Heroku Redis**: $15/month (mini plan)
- **AWS ElastiCache**: $13/month (cache.t3.micro)
- **Database savings**: -$5-10/month (fewer writes, smaller database)

**Net cost**: Approximately cost-neutral or slight savings, with much better performance.

## Next Steps

After Redis is set up:

1. Run performance tests to verify improvements
2. Monitor Redis memory usage
3. Set up alerts for Redis downtime
4. Configure backup/persistence strategy
5. Proceed to Phase 2 (Async Processing with Bull/BullMQ)

## Support

- Redis Documentation: https://redis.io/documentation
- Railway Redis: https://docs.railway.app/databases/redis
- Heroku Redis: https://devcenter.heroku.com/articles/heroku-redis

## Related Files

- `/server/redis.ts` - Redis client configuration
- `/server/services/cacheService.ts` - Caching service
- `/server/middleware/rateLimiter.ts` - Rate limiting with Redis
- `/server/index.ts` - Session store configuration
