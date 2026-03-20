// src/utils/geo.js
// Geographic utilities: reverse geocoding com fila serializada, cache no MongoDB

import axios from 'axios';
import { logger } from './logger.js';
import { geocodeCacheGet, geocodeCacheSet, geocodeCacheCount } from '../db/mongo.js';

// ─── Cache em memória (read-through do MongoDB) ────────────────────────────
const geocodeMemCache = {};

// Carrega contagem do MongoDB no boot (log informativo)
geocodeCacheCount().then(n => {
  logger.info(`Geocode cache no MongoDB: ${n} entradas`);
}).catch(() => {});

// ─── Fila serializada — Nominatim exige máx. 1 req/segundo ───────────────────
const NOMINATIM_DELAY_MS = 1100;
let lastRequestAt = 0;
let queueRunning  = false;
const requestQueue = [];

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
export async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  // 1. Cache em memória (mais rápido)
  if (geocodeMemCache[key] !== undefined) {
    return geocodeMemCache[key];
  }

  // 2. Cache no MongoDB
  const cached = await geocodeCacheGet(key);
  if (cached !== undefined) {
    geocodeMemCache[key] = cached;
    return cached;
  }

  // 3. Enfileira requisição ao Nominatim
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

    // Salva no MongoDB + memória
    geocodeMemCache[cacheKey] = city;
    await geocodeCacheSet(cacheKey, city);

    logger.debug(`Geocode OK: ${cacheKey} → ${city || '(sem cidade)'}`);
    return city;

  } catch (err) {
    const status = err.response?.status;

    if (status === 429 && !retry) {
      logger.warn(`Nominatim 429 para ${cacheKey}, aguardando 5s...`);
      await sleep(5000);
      return fetchNominatim(lat, lon, cacheKey, true);
    }

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout') || status >= 500) {
      logger.warn(`Nominatim timeout/erro para ${cacheKey}, tentando fallback...`);
      try {
        const fallbackCity = await fetchApproximateCity(lat, lon);
        if (fallbackCity) {
          geocodeMemCache[cacheKey] = fallbackCity;
          await geocodeCacheSet(cacheKey, fallbackCity);
          logger.debug(`Geocode fallback OK: ${cacheKey} → ${fallbackCity}`);
          return fallbackCity;
        }
      } catch (fallbackErr) {
        logger.debug(`Fallback também falhou: ${fallbackErr.message}`);
      }
    }

    logger.debug(`Geocode falhou para ${cacheKey}: ${err.message}`);
    geocodeMemCache[cacheKey] = null;
    return null;
  }
}

async function fetchApproximateCity(lat, lon) {
  try {
    const gridLat = Math.round(lat * 2) / 2;
    const gridLon = Math.round(lon * 2) / 2;
    return `Região ${gridLat.toFixed(1)}°, ${gridLon.toFixed(1)}°`;
  } catch {
    return null;
  }
}

export function parseCountry(address = {}) {
  return address.country_code?.toUpperCase() || address.country || 'Unknown';
}
