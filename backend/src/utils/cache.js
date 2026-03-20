// src/utils/cache.js
// Cache em memória com suporte a stale-while-revalidate:
// - dados nunca são apagados enquanto o processo está rodando
// - TTL controla quando os dados ficam "stale" (obsoletos), não quando somem
// - requests que chegam com dados stale retornam os dados antigos imediatamente
//   e disparam uma revalidação em background

import { logger } from './logger.js';

class CacheEntry {
  constructor(value, ttl) {
    this.value     = value;
    this.expiresAt = Date.now() + ttl * 1000;
    this.stale     = false;
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }
}

class CacheManager {
  constructor() {
    // Mapa principal: chave → CacheEntry (nunca apaga automaticamente)
    this.store = new Map();

    // Conjunto de chaves com revalidação em andamento (evita double-fetch)
    this.revalidating = new Set();

    // Funções de revalidação registradas por chave
    this.revalidators = new Map();

    this.hits   = 0;
    this.misses = 0;
    this.staleHits = 0;
  }

  /**
   * Retorna o valor do cache.
   * - Se fresco: retorna imediatamente (hit)
   * - Se stale: retorna o valor antigo E dispara revalidação em background
   * - Se ausente: retorna undefined (miss)
   */
  get(key) {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (!entry.isExpired()) {
      this.hits++;
      return entry.value;
    }

    // Stale: retorna valor antigo e revalida em background
    this.staleHits++;
    logger.debug(`Cache stale para "${key}" — retornando valor antigo, revalidando em background`);
    this._revalidate(key);
    return entry.value;
  }

  /**
   * Armazena um valor no cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - segundos até ficar stale
   */
  set(key, value, ttl = 300) {
    this.store.set(key, new CacheEntry(value, ttl));
  }

  /**
   * Registra uma função de revalidação para uma chave.
   * Quando os dados ficam stale, essa função é chamada em background.
   * @param {string} key
   * @param {Function} fn - async function que retorna o novo valor
   * @param {number} ttl
   */
  registerRevalidator(key, fn, ttl) {
    this.revalidators.set(key, { fn, ttl });
  }

  /**
   * Padrão get-or-set com revalidador registrado automaticamente.
   *
   * COMPORTAMENTO para requests HTTP (nunca bloqueia):
   * - Cache fresco  → retorna imediatamente
   * - Cache stale   → retorna valor antigo + revalida em background
   * - Cache vazio   → inicia busca em background e retorna [] imediatamente
   */
  async getOrSet(key, fn, ttl = 300) {
    this.registerRevalidator(key, fn, ttl);

    const cached = this.get(key);
    if (cached !== undefined) return cached;

    // Primeira vez: não bloqueia — inicia em background e retorna vazio
    logger.info(`Cache miss para "${key}" — iniciando carga em background`);
    this._revalidate(key);
    return [];
  }

  /**
   * Igual ao getOrSet mas AGUARDA a carga terminar.
   * Usado APENAS no warm-up do servidor — nunca em handlers HTTP.
   */
  async load(key, fn, ttl = 300) {
    this.registerRevalidator(key, fn, ttl);

    const cached = this.get(key);
    if (cached !== undefined) return cached;

    // Se já está revalidando (disparado por outro caminho), aguarda ele terminar
    if (this.revalidating.has(key)) {
      return this._waitForRevalidation(key);
    }

    // Executa e aguarda diretamente
    logger.info(`Cache load() para "${key}" — aguardando carga...`);
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Aguarda uma revalidação em andamento terminar (polling leve).
   */
  _waitForRevalidation(key, maxWaitMs = 180_000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (!this.revalidating.has(key)) {
          return resolve(this.get(key) ?? []);
        }
        if (Date.now() - start > maxWaitMs) {
          logger.warn(`Timeout aguardando revalidação de "${key}"`);
          return resolve(this.get(key) ?? []);
        }
        setTimeout(check, 500);
      };
      check();
    });
  }

  /** Dispara revalidação em background (sem bloquear o caller) */
  _revalidate(key) {
    if (this.revalidating.has(key)) return; // já em andamento
    const revalidator = this.revalidators.get(key);
    if (!revalidator) return;

    this.revalidating.add(key);
    logger.debug(`Revalidando "${key}" em background...`);

    revalidator.fn()
      .then(value => {
        this.set(key, value, revalidator.ttl);
        logger.debug(`Revalidação de "${key}" concluída`);
      })
      .catch(err => {
        logger.warn(`Revalidação de "${key}" falhou: ${err.message} — mantendo valor antigo`);
      })
      .finally(() => {
        this.revalidating.delete(key);
      });
  }

  del(key)  { this.store.delete(key); }
  flush()   { this.store.clear(); }

  stats() {
    const total = this.hits + this.misses + this.staleHits;
    return {
      keys:       this.store.size,
      hits:       this.hits,
      staleHits:  this.staleHits,
      misses:     this.misses,
      revalidating: [...this.revalidating],
      hitRate: total > 0
        ? (((this.hits + this.staleHits) / total) * 100).toFixed(1) + '%'
        : '0%',
    };
  }
}

export const cache = new CacheManager();
