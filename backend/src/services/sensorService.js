// src/services/sensorService.js
// Orchestrates sensor fetching from all sources, filtering, and ICAU-D calculation

import { fetchOpenSenseMapSensors }    from '../api/openSenseMap.js';
import { fetchSensorCommunitySensors } from '../api/sensorCommunity.js';
import { fetchOpenWeatherSensors }     from '../api/openWeather.js';
import { fetchAllBrasilSensors }       from '../api/brazilSensors.js';
import { calculateICAUD }              from '../models/icaud.js';
import { isActive, hasValidMeasurements, hasAllICAUDComponents } from '../models/sensor.js';
import { cache }                       from '../utils/cache.js';
import { config }                      from '../config/index.js';
import { logger }                      from '../utils/logger.js';

const CACHE_KEY_SENSORS = 'sensors:all';

function enrichWithICAUD(sensor) {
  const { temperature, humidity, pm25, windSpeed } = sensor.measurements;
  try {
    const icaud = calculateICAUD({ temperature, humidity, pm25, windSpeed });
    return { ...sensor, icaud };
  } catch {
    return { ...sensor, icaud: { score: null, classification: null, components: {}, weights: {}, availableComponents: [] } };
  }
}

/**
 * Função pura que faz o fetch real de todas as fontes.
 * Usada tanto na primeira carga quanto nas revalidações em background.
 */
export async function fetchAllSensors() {
  logger.info('Buscando sensores de todas as fontes...');

  const [osmSensors, scSensors, owSensors, brasilSensors] = await Promise.allSettled([
    fetchOpenSenseMapSensors(),
    fetchSensorCommunitySensors(),
    fetchOpenWeatherSensors(),
    fetchAllBrasilSensors(),
  ]);

  const all = [
    ...(osmSensors.status === 'fulfilled' ? osmSensors.value : []),
    ...(scSensors.status  === 'fulfilled' ? scSensors.value  : []),
    ...(owSensors.status  === 'fulfilled' ? owSensors.value  : []),
    ...(brasilSensors.status === 'fulfilled' ? brasilSensors.value : []),
  ];

  logger.info(`Total bruto: ${all.length} sensores`);

  // Filtra apenas sensores ativos com TODOS os 4 componentes do ICAU-D
  const filtered = all.filter(s =>
    isActive(s, config.sensors.maxAgeHours) &&
    hasAllICAUDComponents(s) &&
    !isNaN(s.location.lat) &&
    !isNaN(s.location.lon)
  );

  const incompleteSensors = all.filter(s =>
    isActive(s, config.sensors.maxAgeHours) &&
    !hasAllICAUDComponents(s)
  ).length;

  logger.info(`Sensores ativos com todos componentes ICAU-D: ${filtered.length}`);
  logger.info(`Sensores excluídos (componentes incompletos): ${incompleteSensors}`);

  const enriched = filtered.map(enrichWithICAUD);

  // Invalida o cache de cidades sempre que os sensores forem atualizados
  await cache.del('cities:aggregated');
  await cache.del('cities:ranking:50');

  return enriched;
}

/**
 * Retorna todos os sensores ativos com ICAU-D.
 * Usa stale-while-revalidate: nunca bloqueia, sempre retorna algo.
 */
export async function getAllSensors() {
  return cache.getOrSet(CACHE_KEY_SENSORS, fetchAllSensors, config.cache.ttlSensors);
}

export async function getSensorsNear(lat, lon, radiusKm = 50) {
  const { haversineDistance } = await import('../utils/geo.js');
  const all = await getAllSensors();
  return all.filter(s =>
    haversineDistance(lat, lon, s.location.lat, s.location.lon) <= radiusKm
  );
}

export async function getICAUDForLocation(lat, lon) {
  const nearby = await getSensorsNear(lat, lon, 25);

  if (nearby.length === 0) {
    return { score: null, sensors: 0, message: 'Nenhum sensor encontrado num raio de 25km' };
  }

  const avgMeasurements = averageMeasurements(nearby);
  const icaud = calculateICAUD(avgMeasurements);

  return { ...icaud, sensors: nearby.length, radius: 25, measurements: avgMeasurements };
}

function averageMeasurements(sensors) {
  const fields = ['temperature', 'humidity', 'pm25', 'pm10', 'windSpeed'];
  const result = {};
  for (const field of fields) {
    const values = sensors
      .map(s => s.measurements[field])
      .filter(v => v !== null && !isNaN(v));
    result[field] = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  }
  return result;
}
