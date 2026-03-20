// src/utils/redisCache.js
// Redis-based distributed cache with stale-while-revalidate pattern
// Fallback to no-op if ioredis not installed

import { logger } from './logger.js';

let Redis = null;
try {
  const redisModule = await import('ioredis');
  Redis = redisModule.default;
} catch (err) {
  logger.warn('⚠️  ioredis não instalado - Redis desabilitado');
}

let redis = null;

/**
 * Initialize Redis client
 */
export function initRedis(redisUrl) {
  if (!redisUrl) {
    logger.warn('Redis URL not configured, falling back to in-memory cache');
    return null;
  }

  if (!Redis) {
    logger.warn('⚠️  ioredis não disponível - Redis desabilitado');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: false,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error:', err.message);
    });

    return redis;
  } catch (err) {
    logger.error('Redis initialization failed:', err.message);
    return null;
  }
}

/**
 * Disconnect Redis
 */
export async function disconnectRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis disconnected');
  }
}

/**
 * Get value from Redis
 */
export async function get(key) {
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (err) {
    logger.debug('Redis get error:', err.message);
    return null;
  }
}

/**
 * Set value in Redis with TTL
 */
export async function set(key, value, ttlSecs = 300) {
  if (!redis) return;

  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttlSecs, serialized);
  } catch (err) {
    logger.debug('Redis set error:', err.message);
  }
}

/**
 * Delete key from Redis
 */
export async function del(key) {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (err) {
    logger.debug('Redis del error:', err.message);
  }
}

/**
 * Delete multiple keys from Redis (pattern)
 */
export async function delPattern(pattern) {
  if (!redis) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      return await redis.del(...keys);
    }
    return 0;
  } catch (err) {
    logger.debug('Redis delPattern error:', err.message);
    return 0;
  }
}

/**
 * Flush all Redis cache
 */
export async function flush() {
  if (!redis) return;

  try {
    await redis.flushdb();
    logger.info('Redis cache flushed');
  } catch (err) {
    logger.debug('Redis flush error:', err.message);
  }
}

/**
 * Get cache statistics
 */
export async function stats() {
  if (!redis) return { enabled: false };

  try {
    const info = await redis.info('memory');
    const dbSize = await redis.dbsize();

    // Parse memory info
    const lines = info.split('\r\n');
    const memoryData = {};
    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        memoryData[key] = value;
      }
    }

    return {
      enabled: true,
      keys: dbSize,
      usedMemory: memoryData.used_memory || 'N/A',
      usedMemoryHuman: memoryData.used_memory_human || 'N/A',
      maxMemory: memoryData.maxmemory || 'unlimited',
      evictedKeys: memoryData.evicted_keys || 0,
    };
  } catch (err) {
    logger.debug('Redis stats error:', err.message);
    return { enabled: false, error: err.message };
  }
}

/**
 * Get or set pattern (atomic operation)
 * Returns cached value if hit, otherwise returns placeholder and triggers revalidation
 */
export async function getOrSet(key, fetchFn, ttlSecs = 300) {
  if (!redis) {
    // Fallback: no Redis, fetch directly
    try {
      const value = await fetchFn();
      return value;
    } catch (err) {
      logger.debug('getOrSet fetch error:', err.message);
      return null;
    }
  }

  try {
    // Try to get from cache
    const cached = await get(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch and store
    const value = await fetchFn();
    if (value !== null) {
      await set(key, value, ttlSecs);
    }
    return value;
  } catch (err) {
    logger.debug('getOrSet error:', err.message);
    return null;
  }
}

/**
 * Check if Redis is available
 */
export function isAvailable() {
  return redis !== null;
}

/**
 * Get Redis client instance (for advanced operations)
 */
export function getClient() {
  return redis;
}
