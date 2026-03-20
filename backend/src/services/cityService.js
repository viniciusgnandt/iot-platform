// src/services/cityService.js
// Aggregates sensor data by city, computes city-level ICAU-D, generates ranking

import { getAllSensors }   from './sensorService.js';
import { calculateICAUD }  from '../models/icaud.js';
import { reverseGeocode }  from '../utils/geo.js';
import { cache }           from '../utils/cache.js';
import { config }          from '../config/index.js';
import { logger }          from '../utils/logger.js';

const CACHE_KEY_CITIES  = 'cities:aggregated';
const CACHE_KEY_RANKING = 'cities:ranking';

// Tempo máximo (ms) para toda a etapa de geocodificação reversa
// Depois disso, sensores sem cidade usam fallback aproximado (mas os com cidade continuam)
const GEOCODE_TIMEOUT_MS = 60_000; // Aumentado de 30s para 60s para melhor cobertura

/**
 * Verifica se um nome de cidade é válido (não é uma coordenada)
 */
function isValidCityName(name) {
  if (!name || typeof name !== 'string' || name.trim().length < 2) return false;
  if (/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?$/.test(name.trim())) return false;
  return true;
}

/**
 * Agrupa sensores por cidade.
 *
 * Estratégia em 2 passos para minimizar chamadas ao Nominatim:
 * 1. Sensores que já têm cidade válida nos metadados → agrupados diretamente.
 * 2. Sensores sem cidade → deduplicados por grade de 0.02° (~2km) antes de
 *    enfileirar para geocodificação reversa (respeita 1 req/s do Nominatim).
 *    Um timeout global de 30s protege contra travamento.
 */
async function groupSensorsByCity(sensors) {
  const cityMap     = new Map();
  const needGeocode = [];

  // ── Passo 1: separar os que já têm cidade ──────────────────────────────────
  for (const sensor of sensors) {
    const cityName = isValidCityName(sensor.location.city)
      ? sensor.location.city.trim()
      : null;

    if (cityName) {
      addToCity(cityMap, cityName, sensor.location.country, sensor);
    } else {
      needGeocode.push(sensor);
    }
  }

  logger.info(`Geocodificação necessária: ${needGeocode.length} sensores sem cidade`);

  // Se não há sensores sem cidade, pula o geocoding
  if (needGeocode.length === 0) return cityMap;

  // ── Passo 2: geocodificação com timeout global ─────────────────────────────
  const gridCache = new Map();

  const geocodeAll = async () => {
    for (const sensor of needGeocode) {
      // Chave de grade 0.02° (~2 km)
      const gridKey = `${(sensor.location.lat / 0.02).toFixed(0)},${(sensor.location.lon / 0.02).toFixed(0)}`;

      let cityName;
      if (gridCache.has(gridKey)) {
        cityName = gridCache.get(gridKey);
      } else {
        try {
          cityName = await reverseGeocode(sensor.location.lat, sensor.location.lon);
        } catch {
          cityName = null;
        }
        gridCache.set(gridKey, cityName);
      }

      if (isValidCityName(cityName)) {
        addToCity(cityMap, cityName, sensor.location.country, sensor);
      }
    }
  };

  // Corre com timeout: se demorar demais, continua com as cidades já resolvidas
  try {
    await Promise.race([
      geocodeAll(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Geocode timeout')), GEOCODE_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    logger.warn(`Geocodificação encerrada (${err.message}). Cidades já resolvidas serão usadas.`);
  }

  return cityMap;
}

/** Utilitário: adiciona sensor ao mapa de cidades */
function addToCity(cityMap, name, country, sensor) {
  if (!cityMap.has(name)) {
    cityMap.set(name, {
      name,
      country: country || 'Unknown',
      lat:     sensor.location.lat,
      lon:     sensor.location.lon,
      sensors: [],
    });
  }
  cityMap.get(name).sensors.push(sensor);
}

/**
 * Calcula estatísticas agregadas de uma cidade
 */
function computeCityStats(cityData) {
  const { name, country, lat, lon, sensors } = cityData;

  const fields = ['temperature', 'humidity', 'pm25', 'pm10', 'windSpeed'];
  const measurements = {};
  const counts = {};

  for (const field of fields) {
    const values = sensors
      .map(s => s.measurements?.[field])
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    measurements[field] = values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null;
    counts[field] = values.length;
  }

  // Calcula ICAU-D — nunca lança exceção, retorna score: null se dados insuficientes
  let icaud;
  try {
    icaud = calculateICAUD({
      temperature: measurements.temperature,
      humidity:    measurements.humidity,
      pm25:        measurements.pm25,
      windSpeed:   measurements.windSpeed,
    });
  } catch (err) {
    logger.warn(`Falha no cálculo ICAU-D para ${name}: ${err.message}`);
    icaud = { score: null, classification: null, components: {}, weights: {}, availableComponents: [] };
  }

  return {
    id:          name.toLowerCase().replace(/\s+/g, '_'),
    name,
    country,
    location:    { lat, lon },
    sensorCount: sensors.length,
    measurements,
    measurementCounts: counts,
    icaud,
    updatedAt:   new Date().toISOString(),
  };
}

/**
 * Função pura que agrega sensores em cidades.
 * Chamada diretamente na primeira vez e pelo revalidador em background.
 */
export async function fetchAllCities() {
  logger.info('Agregando sensores por cidade...');

  let sensors = [];
  try {
    sensors = await getAllSensors();
  } catch (err) {
    logger.error('Falha ao buscar sensores:', err.message);
    return [];
  }

  if (sensors.length === 0) {
    logger.warn('Nenhum sensor disponível para agregação');
    return [];
  }

  let cityMap;
  try {
    cityMap = await groupSensorsByCity(sensors);
  } catch (err) {
    logger.error('Falha ao agrupar por cidade:', err.message);
    return [];
  }

  const cities = Array.from(cityMap.values())
    .filter(c => c.sensors.length >= 1)
    .map(c => {
      try { return computeCityStats(c); }
      catch (err) {
        logger.warn(`Erro ao computar stats para ${c.name}: ${err.message}`);
        return null;
      }
    })
    .filter(Boolean);

  logger.info(`Agregadas ${cities.length} cidades`);
  return cities;
}

/**
 * Retorna todas as cidades com dados ambientais agregados.
 * Usa stale-while-revalidate: nunca bloqueia, sempre retorna algo.
 */
export async function getAllCities() {
  return cache.getOrSet(CACHE_KEY_CITIES, fetchAllCities, config.cache.ttlCities);
}

/**
 * Retorna cidades ordenadas por ICAU-D (maior primeiro)
 */
export async function getCitiesRanking(limit = 50) {
  const cacheKey = `${CACHE_KEY_RANKING}:${limit}`;
  return cache.getOrSet(cacheKey, () => buildRanking(limit), config.cache.ttlRanking);
}

export async function buildRanking(limit) {
  const cities = await getAllCities();
  return cities
    .filter(c => c.icaud && c.icaud.score !== null && c.icaud.score !== undefined)
    .sort((a, b) => (b.icaud.score || 0) - (a.icaud.score || 0))
    .slice(0, limit)
    .map((city, index) => ({ ...city, rank: index + 1 }));
}

/**
 * Retorna dados detalhados de uma cidade pelo nome
 */
export async function getCityByName(cityName) {
  const cities = await getAllCities();
  const normalized = cityName.toLowerCase().trim();
  return cities.find(c =>
    c.name.toLowerCase() === normalized ||
    c.id === normalized
  ) || null;
}

