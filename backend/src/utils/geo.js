// src/utils/geo.js
// Geographic utilities: reverse geocoding com fila serializada, cache em disco e backoff

import axios from 'axios';
import fs    from 'fs';
import path  from 'path';
import { logger } from './logger.js';

// ─── Cache persistente em disco ──────────────────────────────────────────────
// Salvo em data/ junto com o SQLite — fora do watch do nodemon
const CACHE_FILE = path.resolve('./data/geocode-cache.json');
fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true }); // garante que data/ existe

function loadDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch { /* ignora erros de leitura */ }
  return {};
}

function saveDiskCache(obj) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
  } catch { /* ignora erros de escrita */ }
}

// Cache em memória (espelho do disco)
const geocodeMemCache = loadDiskCache();
logger.info(`Geocode cache carregado: ${Object.keys(geocodeMemCache).length} entradas`);

// ─── Fila serializada — Nominatim exige máx. 1 req/segundo ───────────────────
const NOMINATIM_DELAY_MS = 1100; // 1.1s entre requests para margem de segurança
let lastRequestAt = 0;
let queueRunning  = false;
const requestQueue = [];

/**
 * Enfileira uma função async e garante que ela só execute
 * com ao menos NOMINATIM_DELAY_MS desde a última requisição.
 */
function enqueue(fn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    if (!queueRunning) processQueue();
  });
}

async function processQueue() {
  queueRunning = true;
  while (requestQueue.length > 0) {
    const now   = Date.now();
    const wait  = Math.max(0, lastRequestAt + NOMINATIM_DELAY_MS - now);
    if (wait > 0) await sleep(wait);

    const { fn, resolve, reject } = requestQueue.shift();
    lastRequestAt = Date.now();
    try {
      resolve(await fn());
    } catch (err) {
      reject(err);
    }
  }
  queueRunning = false;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Haversine ────────────────────────────────────────────────────────────────
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Reverse Geocode ──────────────────────────────────────────────────────────
/**
 * Converte lat/lon em nome de cidade usando Nominatim.
 * - Cache em memória + disco: coordenadas já resolvidas nunca re-consultam a API
 * - Fila serializada: respeita o limite de 1 req/s do Nominatim
 * - Backoff automático: em caso de 429 aguarda 5s e tenta mais uma vez
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string>} nome da cidade ou null
 */
export async function reverseGeocode(lat, lon) {
  // Chave com precisão de 2 casas decimais (~1km) para agrupar sensores próximos
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  // 1. Retorna do cache se já resolvido
  if (geocodeMemCache[key] !== undefined) {
    return geocodeMemCache[key];
  }

  // 2. Enfileira a requisição HTTP para respeitar o rate limit
  const result = await enqueue(() => fetchNominatim(lat, lon, key));
  return result;
}

async function fetchNominatim(lat, lon, cacheKey, retry = false) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent':   'IoT-Environmental-Platform/1.0 (github.com/ecosense)',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      timeout: 8000,
    });

    const addr = data.address || {};
    const city =
      addr.city        ||
      addr.town        ||
      addr.village     ||
      addr.municipality||
      addr.suburb      ||
      addr.county      ||
      null;

    // Salva no cache (null também é cacheado para evitar re-tentativas inúteis)
    geocodeMemCache[cacheKey] = city;
    saveDiskCache(geocodeMemCache);

    logger.debug(`Geocode OK: ${cacheKey} → ${city || '(sem cidade)'}`);
    return city;

  } catch (err) {
    const status = err.response?.status;

    // 429: aguarda 5s e tenta uma segunda vez
    if (status === 429 && !retry) {
      logger.warn(`Nominatim 429 para ${cacheKey}, aguardando 5s...`);
      await sleep(5000);
      return fetchNominatim(lat, lon, cacheKey, true);
    }

    // Timeout ou erro de rede: tenta fallback com aproximação regional
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || status >= 500) {
      logger.warn(`Nominatim timeout/erro para ${cacheKey}, tentando fallback...`);
      try {
        const fallbackCity = await fetchApproximateCity(lat, lon);
        if (fallbackCity) {
          geocodeMemCache[cacheKey] = fallbackCity;
          saveDiskCache(geocodeMemCache);
          logger.debug(`Geocode fallback OK: ${cacheKey} → ${fallbackCity}`);
          return fallbackCity;
        }
      } catch (fallbackErr) {
        logger.debug(`Fallback também falhou: ${fallbackErr.message}`);
      }
    }

    logger.debug(`Geocode falhou para ${cacheKey}: ${err.message}`);

    // Em caso de erro definitivo cacheia null para não tentar de novo nessa sessão
    geocodeMemCache[cacheKey] = null;
    return null;
  }
}

/**
 * Fallback: usa aproximação regional baseada em coordenadas
 * Agrupa sensores em grid 0.5° (~55km) e nomeia por região
 */
async function fetchApproximateCity(lat, lon) {
  try {
    // Grid 0.5 graus — agrupa sensores em regiões maiores
    const gridLat = Math.round(lat * 2) / 2;
    const gridLon = Math.round(lon * 2) / 2;

    // Nomenclatura regional por grid
    const regionName = `Região ${gridLat.toFixed(1)}°, ${gridLon.toFixed(1)}°`;
    return regionName;
  } catch {
    return null;
  }
}

export function parseCountry(address = {}) {
  return address.country_code?.toUpperCase() || address.country || 'Unknown';
}
