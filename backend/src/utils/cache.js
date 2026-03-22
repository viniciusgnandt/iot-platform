// src/utils/cache.js
// Cache centralizado — MongoDB com fallback em memória quando MongoDB indisponível

import { logger } from './logger.js';

let mongoCache = null;

// Fallback em memória quando MongoDB não está disponível
const memStore = new Map(); // key → { value, expiresAt }

export function setMongoCache(cacheInstance) {
  mongoCache = cacheInstance;
  logger.info('✅ Cache MongoDB inicializado');
}

class CacheManager {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.staleHits = 0;
  }

  async get(key) {
    // Tenta MongoDB primeiro
    if (mongoCache) {
      try {
        const value = await mongoCache.mongoCacheGet(key);
        if (value !== null && value !== undefined) {
          this.hits++;
          return value;
        }
        this.misses++;
        return undefined;
      } catch (err) {
        logger.warn(`Cache MongoDB GET erro: ${err.message} — usando memória`);
      }
    }

    // Fallback: memória local
    const entry = memStore.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        this.hits++;
        return entry.value;
      }
      memStore.delete(key); // expirado
    }
    this.misses++;
    return undefined;
  }

  async set(key, value, ttlSeconds = 300) {
    // Tenta MongoDB primeiro
    if (mongoCache) {
      try {
        await mongoCache.mongoCacheSet(key, value, ttlSeconds);
        return;
      } catch (err) {
        logger.warn(`Cache MongoDB SET erro: ${err.message} — salvando em memória`);
      }
    }

    // Fallback: memória local
    memStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key) {
    if (mongoCache) {
      try { await mongoCache.mongoCacheDel(key); } catch {}
    }
    memStore.delete(key);
  }

  async delPattern(pattern) {
    if (mongoCache) {
      try { await mongoCache.mongoCacheDelPattern(pattern); } catch {}
    }
    const regex = new RegExp(pattern);
    for (const k of memStore.keys()) {
      if (regex.test(k)) memStore.delete(k);
    }
  }

  async flush() {
    if (mongoCache) {
      try { await mongoCache.flush(); } catch {}
    }
    memStore.clear();
    logger.info('Cache flushed');
  }

  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    const cached = await this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const fresh = await fetchFn();
      if (fresh !== null && fresh !== undefined) {
        await this.set(key, fresh, ttlSeconds);
      }
      return fresh;
    } catch (err) {
      logger.warn(`getOrSet erro ao buscar ${key}: ${err.message}`);
      return null;
    }
  }

  getStats() {
    const total = this.hits + this.misses + this.staleHits;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(1) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      staleHits: this.staleHits,
      hitRate: `${hitRate}%`,
      total,
      source: mongoCache ? 'MongoDB' : 'Memória (fallback)',
    };
  }

  resetStats() {
    this.hits = 0;
    this.misses = 0;
    this.staleHits = 0;
  }
}

export const cache = new CacheManager();
export default cache;
