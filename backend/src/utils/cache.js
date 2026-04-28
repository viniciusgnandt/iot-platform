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
    // Tenta MongoDB primeiro — se ele estiver indisponível ou com timeout,
    // o catch faz a queda para memStore (importante: NÃO retornar undefined
    // dentro do try, ou a memória nunca será consultada quando o Mongo falhar).
    if (mongoCache) {
      try {
        const value = await mongoCache.mongoCacheGet(key);
        if (value !== null && value !== undefined) {
          this.hits++;
          return value;
        }
        // miss no Mongo — ainda assim tenta memStore (pode ter sido escrito
        // localmente após uma falha de SET no Mongo)
      } catch (err) {
        logger.warn(`Cache MongoDB GET erro: ${err.message} — usando memória`);
      }
    }

    // Fallback / 2ª camada: memória local
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
    // Sempre grava em memória (defesa em profundidade — se o Mongo cair entre
    // SET e GET subsequente, a aplicação ainda devolve dados consistentes)
    memStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Tenta também o MongoDB — falhas são silenciosamente toleradas
    if (mongoCache) {
      try {
        await mongoCache.mongoCacheSet(key, value, ttlSeconds);
      } catch (err) {
        logger.warn(`Cache MongoDB SET erro: ${err.message} — mantido apenas em memória`);
      }
    }
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
