// src/utils/persistentCache.js
// Cache persistente em disco usando SQLite (better-sqlite3).
//
// Por que SQLite?
//  - Zero configuração, arquivo único, sem servidor externo
//  - Operações síncronas: leitura de cache nunca atrasa com awaits
//  - Sobrevive a reinicializações do servidor
//  - Suporta TTL, compressão e limpeza automática de entradas expiradas
//
// Estrutura do banco:
//   tabela cache_entries  → chave/valor genérico com TTL  (sensores, cidades, ranking)
//   tabela geocode_cache  → lat/lon → nome da cidade      (geocoding reverso)

import Database from 'better-sqlite3';
import path     from 'path';
import fs       from 'fs';
import { logger } from './logger.js';

// Localização do arquivo .db na raiz do projeto backend
const DB_PATH = path.resolve('./data/platform.db');

// Garante que o diretório existe
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ─── Inicialização do banco ────────────────────────────────────────────────────
const db = new Database(DB_PATH);

// WAL mode: leituras e escritas simultâneas sem bloqueio
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL'); // mais rápido, ainda seguro

// ── Limite de tamanho: 5 GB ───────────────────────────────────────────────────
// page_size deve ser definido ANTES de qualquer tabela ser criada.
// Em bancos já existentes o valor é ignorado (page_size é imutável após criação),
// mas max_page_count é sempre respeitado.
//
// 5 GB = 5 * 1024 * 1024 * 1024 bytes
// page_size padrão do SQLite = 4096 bytes (4 KB)
// max_page_count = 5_368_709_120 / 4096 = 1_310_720 páginas
const PAGE_SIZE_BYTES  = db.pragma('page_size', { simple: true }); // lê o atual
const MAX_DB_BYTES     = 5 * 1024 * 1024 * 1024; // 5 GB
const MAX_PAGES        = Math.floor(MAX_DB_BYTES / PAGE_SIZE_BYTES);

db.pragma(`max_page_count = ${MAX_PAGES}`);

logger.info(`💾 SQLite — limite: 5 GB (${MAX_PAGES.toLocaleString()} páginas × ${PAGE_SIZE_BYTES} bytes)`);

// Log do tamanho atual do banco
try {
  const { size } = fs.statSync(DB_PATH);
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  logger.info(`💾 Tamanho atual do banco: ${sizeMB} MB`);
} catch { /* banco ainda não existe */ }

db.exec(`
  -- Cache genérico de chave/valor com TTL
  CREATE TABLE IF NOT EXISTS cache_entries (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,        -- JSON serializado
    expires_at INTEGER NOT NULL,     -- timestamp Unix em ms
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Cache dedicado para geocodificação reversa
  -- lat/lon arredondados em 2 casas decimais (~1km de precisão)
  CREATE TABLE IF NOT EXISTS geocode_cache (
    grid_key   TEXT PRIMARY KEY,     -- "lat.toFixed(2),lon.toFixed(2)"
    city_name  TEXT,                 -- null se não encontrado
    created_at INTEGER NOT NULL
  );

  -- Índice para limpeza eficiente de entradas expiradas
  CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);
`);

logger.info(`💾 SQLite inicializado: ${DB_PATH}`);

// ─── Statements preparados (compilados uma vez, reutilizados) ─────────────────
const stmts = {
  cacheGet:    db.prepare('SELECT value, expires_at FROM cache_entries WHERE key = ?'),
  cacheSet:    db.prepare(`
    INSERT INTO cache_entries (key, value, expires_at, created_at, updated_at)
    VALUES (@key, @value, @expires_at, @now, @now)
    ON CONFLICT(key) DO UPDATE SET
      value      = excluded.value,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at
  `),
  cacheDel:    db.prepare('DELETE FROM cache_entries WHERE key = ?'),
  cacheClean:  db.prepare('DELETE FROM cache_entries WHERE expires_at < ?'),
  cacheKeys:   db.prepare('SELECT key, expires_at FROM cache_entries'),

  geocodeGet:  db.prepare('SELECT city_name FROM geocode_cache WHERE grid_key = ?'),
  geocodeSet:  db.prepare(`
    INSERT INTO geocode_cache (grid_key, city_name, created_at)
    VALUES (@grid_key, @city_name, @now)
    ON CONFLICT(grid_key) DO UPDATE SET city_name = excluded.city_name
  `),
  geocodeCount: db.prepare('SELECT COUNT(*) as n FROM geocode_cache'),
};

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Lê uma entrada do cache genérico.
 * Retorna o valor parsed ou undefined se ausente/expirado.
 */
export function diskGet(key) {
  try {
    const row = stmts.cacheGet.get(key);
    if (!row) return undefined;
    if (Date.now() > row.expires_at) return undefined; // expirado mas ainda no disco
    return JSON.parse(row.value);
  } catch (err) {
    logger.warn(`diskGet("${key}") falhou: ${err.message}`);
    return undefined;
  }
}

/**
 * Retorna true se a entrada existe no disco (mesmo expirada).
 * Usado para warm-up: mesmo stale, é melhor que nada.
 */
export function diskGetStale(key) {
  try {
    const row = stmts.cacheGet.get(key);
    if (!row) return undefined;
    return JSON.parse(row.value); // retorna mesmo se expirado
  } catch {
    return undefined;
  }
}

/**
 * Salva uma entrada no cache genérico.
 * @param {string} key
 * @param {any}    value   - será serializado em JSON
 * @param {number} ttlSecs - tempo de vida em segundos
 */
export function diskSet(key, value, ttlSecs = 300) {
  try {
    const now = Date.now();
    stmts.cacheSet.run({
      key,
      value:      JSON.stringify(value),
      expires_at: now + ttlSecs * 1000,
      now,
    });
  } catch (err) {
    logger.warn(`diskSet("${key}") falhou: ${err.message}`);
  }
}

/**
 * Remove uma entrada do cache.
 */
export function diskDel(key) {
  try { stmts.cacheDel.run(key); } catch { /* silencia */ }
}

/**
 * Remove todas as entradas expiradas. Chamar periodicamente para liberar espaço.
 */
export function diskCleanExpired() {
  try {
    const result = stmts.cacheClean.run(Date.now());
    if (result.changes > 0) {
      logger.debug(`Cache disco: ${result.changes} entradas expiradas removidas`);
    }
  } catch (err) {
    logger.warn(`diskCleanExpired falhou: ${err.message}`);
  }
}

/**
 * Estatísticas do cache em disco.
 */
export function diskStats() {
  try {
    const entries  = stmts.cacheKeys.all();
    const now      = Date.now();
    const fresh    = entries.filter(e => e.expires_at > now).length;
    const stale    = entries.length - fresh;
    const geocodes = stmts.geocodeCount.get().n;

    // Tamanho real do arquivo .db
    let fileSizeBytes = 0;
    try { fileSizeBytes = fs.statSync(DB_PATH).size; } catch { /* ok */ }

    const fileSizeMB      = (fileSizeBytes / 1024 / 1024).toFixed(2);
    const limitGB         = 5;
    const usedPct         = ((fileSizeBytes / MAX_DB_BYTES) * 100).toFixed(1);
    const nearLimit       = fileSizeBytes > MAX_DB_BYTES * 0.8;

    if (nearLimit) {
      logger.warn(`⚠️  Cache em disco em ${usedPct}% do limite de ${limitGB} GB`);
    }

    return {
      entries:     entries.length,
      fresh,
      stale,
      geocodes,
      dbPath:      DB_PATH,
      sizeBytes:   fileSizeBytes,
      sizeMB:      `${fileSizeMB} MB`,
      limitGB:     `${limitGB} GB`,
      usedPercent: `${usedPct}%`,
      nearLimit,
    };
  } catch {
    return { entries: 0, fresh: 0, stale: 0, geocodes: 0, dbPath: DB_PATH };
  }
}

// ─── API de Geocoding ──────────────────────────────────────────────────────────

/**
 * Busca cidade no cache de geocoding pelo grid_key.
 * Retorna string (pode ser null se não encontrado) ou undefined se não existe.
 */
export function geocodeGet(gridKey) {
  try {
    const row = stmts.geocodeGet.get(gridKey);
    if (!row) return undefined;   // nunca visto
    return row.city_name;         // pode ser null (sem cidade)
  } catch {
    return undefined;
  }
}

/**
 * Salva resultado de geocoding. city_name pode ser null.
 */
export function geocodeSet(gridKey, cityName) {
  try {
    stmts.geocodeSet.run({ grid_key: gridKey, city_name: cityName ?? null, now: Date.now() });
  } catch (err) {
    logger.warn(`geocodeSet falhou: ${err.message}`);
  }
}

// ─── Limpeza automática periódica ─────────────────────────────────────────────
// Remove entradas expiradas a cada 30 minutos para manter o banco compacto
setInterval(diskCleanExpired, 30 * 60 * 1000).unref();

// Limpeza inicial na startup
diskCleanExpired();

const geoCount = stmts.geocodeCount.get().n;
logger.info(`💾 Cache de geocoding: ${geoCount} coordenadas em disco`);
