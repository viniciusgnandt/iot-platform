// src/utils/cache.js
// Cache centralizado em MongoDB (sem memória local)

import { logger } from './logger.js';

let mongoCache = null;

/**
 * Inicializa a instância do MongoDB para uso como cache
 */
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

  /**
   * Obtém valor do cache (MongoDB)
   */
  async get(key) {
    if (!mongoCache) {
      logger.warn('⚠️  MongoDB cache não inicializado');
      return undefined;
    }

    try {
      const value = await mongoCache.mongoCacheGet(key);
      if (value) {
        this.hits++;
      } else {
        this.misses++;
      }
      return value;
    } catch (err) {
      logger.warn(`Cache GET erro: ${err.message}`);
      return undefined;
    }
  }

  /**
   * Define valor no cache (MongoDB com TTL)
   */
  async set(key, value, ttlSeconds = 300) {
    if (!mongoCache) {
      logger.warn('⚠️  MongoDB cache não inicializado');
      return;
    }

    try {
      await mongoCache.mongoCacheSet(key, value, ttlSeconds);
    } catch (err) {
      logger.warn(`Cache SET erro: ${err.message}`);
    }
  }

  /**
   * Deleta chave do cache
   */
  async del(key) {
    if (!mongoCache) return;

    try {
      await mongoCache.mongoCacheDel(key);
    } catch (err) {
      logger.warn(`Cache DEL erro: ${err.message}`);
    }
  }

  /**
   * Delete pattern matching
   */
  async delPattern(pattern) {
    if (!mongoCache) return;

    try {
      await mongoCache.mongoCacheDelPattern(pattern);
    } catch (err) {
      logger.warn(`Cache DELPATTERN erro: ${err.message}`);
    }
  }

  /**
   * Limpa todo o cache
   */
  async flush() {
    if (!mongoCache) return;

    try {
      await mongoCache.flush();
      logger.info('Cache flushed');
    } catch (err) {
      logger.warn(`Cache FLUSH erro: ${err.message}`);
    }
  }

  /**
   * Get or Set com função de revalidação
   */
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    // Tenta obter do cache primeiro
    const cached = await this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - busca dados frescos
    try {
      const fresh = await fetchFn();
      await this.set(key, fresh, ttlSeconds);
      return fresh;
    } catch (err) {
      logger.warn(`getOrSet erro ao buscar ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Estatísticas do cache
   */
  getStats() {
    const total = this.hits + this.misses + this.staleHits;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(1) : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      staleHits: this.staleHits,
      hitRate: `${hitRate}%`,
      total,
      source: 'MongoDB',
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.hits = 0;
    this.misses = 0;
    this.staleHits = 0;
  }
}

// Exporta instância singleton
export const cache = new CacheManager();

export default cache;
