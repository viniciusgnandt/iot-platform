// src/api/brazilSensors.js
// Specialized data collection for Brazilian and global cities via Open-Meteo
// Open-Meteo is free, no API key required, provides temp/humidity/wind

import axios from 'axios';
import { createSensor } from '../models/sensor.js';
import { logger } from '../utils/logger.js';

// ─── City lists ──────────────────────────────────────────────────────────────

const BRAZIL_CITIES = [
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, country: 'BR' },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, country: 'BR' },
  { name: 'Belo Horizonte', lat: -19.9191, lon: -43.9386, country: 'BR' },
  { name: 'Brasília', lat: -15.7942, lon: -47.8822, country: 'BR' },
  { name: 'Salvador', lat: -12.9714, lon: -38.5014, country: 'BR' },
  { name: 'Fortaleza', lat: -3.7319, lon: -38.5267, country: 'BR' },
  { name: 'Recife', lat: -8.0726, lon: -34.8759, country: 'BR' },
  { name: 'Manaus', lat: -3.1190, lon: -60.0217, country: 'BR' },
  { name: 'Curitiba', lat: -25.4284, lon: -49.2733, country: 'BR' },
  { name: 'Porto Alegre', lat: -30.0346, lon: -51.2177, country: 'BR' },
  { name: 'Goiânia', lat: -15.8267, lon: -48.9385, country: 'BR' },
  { name: 'Campinas', lat: -22.9068, lon: -47.0707, country: 'BR' },
  { name: 'Guarulhos', lat: -23.4613, lon: -46.4734, country: 'BR' },
  { name: 'Teresina', lat: -5.0892, lon: -42.8084, country: 'BR' },
  { name: 'João Pessoa', lat: -7.1219, lon: -34.8450, country: 'BR' },
  { name: 'Natal', lat: -5.7942, lon: -35.2110, country: 'BR' },
  { name: 'Belém', lat: -1.4554, lon: -48.5034, country: 'BR' },
  { name: 'Maceió', lat: -9.6498, lon: -35.7348, country: 'BR' },
];

const EUROPE_CITIES = [
  { name: 'Berlin', lat: 52.52, lon: 13.405, country: 'DE' },
  { name: 'London', lat: 51.507, lon: -0.127, country: 'GB' },
  { name: 'Paris', lat: 48.856, lon: 2.352, country: 'FR' },
  { name: 'Madrid', lat: 40.416, lon: -3.703, country: 'ES' },
  { name: 'Rome', lat: 41.902, lon: 12.496, country: 'IT' },
  { name: 'Amsterdam', lat: 52.374, lon: 4.899, country: 'NL' },
  { name: 'Vienna', lat: 48.208, lon: 16.372, country: 'AT' },
  { name: 'Warsaw', lat: 52.229, lon: 21.012, country: 'PL' },
  { name: 'Prague', lat: 50.075, lon: 14.437, country: 'CZ' },
  { name: 'Budapest', lat: 47.497, lon: 19.040, country: 'HU' },
  { name: 'Munich', lat: 48.135, lon: 11.582, country: 'DE' },
  { name: 'Hamburg', lat: 53.551, lon: 9.993, country: 'DE' },
  { name: 'Stuttgart', lat: 48.775, lon: 9.182, country: 'DE' },
  { name: 'Cologne', lat: 50.937, lon: 6.960, country: 'DE' },
  { name: 'Brussels', lat: 50.850, lon: 4.351, country: 'BE' },
  { name: 'Zurich', lat: 47.376, lon: 8.541, country: 'CH' },
  { name: 'Copenhagen', lat: 55.676, lon: 12.568, country: 'DK' },
  { name: 'Stockholm', lat: 59.329, lon: 18.068, country: 'SE' },
  { name: 'Oslo', lat: 59.913, lon: 10.752, country: 'NO' },
  { name: 'Helsinki', lat: 60.169, lon: 24.938, country: 'FI' },
  { name: 'Lisbon', lat: 38.722, lon: -9.139, country: 'PT' },
  { name: 'Barcelona', lat: 41.389, lon: 2.159, country: 'ES' },
  { name: 'Milan', lat: 45.464, lon: 9.190, country: 'IT' },
  { name: 'Athens', lat: 37.984, lon: 23.728, country: 'GR' },
  { name: 'Dublin', lat: 53.349, lon: -6.260, country: 'IE' },
  { name: 'Bucharest', lat: 44.426, lon: 26.102, country: 'RO' },
  { name: 'Sofia', lat: 42.697, lon: 23.322, country: 'BG' },
  { name: 'Zagreb', lat: 45.815, lon: 15.982, country: 'HR' },
  { name: 'Belgrade', lat: 44.787, lon: 20.457, country: 'RS' },
  { name: 'Kraków', lat: 50.065, lon: 19.945, country: 'PL' },
];

const ALL_CITIES = [...BRAZIL_CITIES, ...EUROPE_CITIES];

// ─── Open-Meteo fetcher ─────────────────────────────────────────────────────

/**
 * Fetch weather data from Open-Meteo for a list of cities.
 * Open-Meteo is free and does not require an API key.
 * Provides: temperature, humidity, wind speed (NOT PM2.5).
 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, params, timeout = 20000, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.get(url, { params, timeout });
    } catch (err) {
      const isRetryable = err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' ||
        err.message.includes('TLS') || err.message.includes('socket') ||
        err.message.includes('timeout') || err.message.includes('network');
      if (isRetryable && attempt < retries) {
        logger.warn(`Open-Meteo tentativa ${attempt} falhou (${err.code || err.message}), aguardando ${attempt * 2}s...`);
        await sleep(attempt * 2000);
        continue;
      }
      throw err;
    }
  }
}

async function fetchOpenMeteo(cities, tag = '') {
  const sensors = [];

  // Open-Meteo supports batch requests with comma-separated coordinates
  const lats = cities.map(c => c.lat).join(',');
  const lons = cities.map(c => c.lon).join(',');

  try {
    const response = await fetchWithRetry('https://api.open-meteo.com/v1/forecast', {
      latitude: lats,
      longitude: lons,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
      timezone: 'auto',
    }, 20000);

    // Open-Meteo returns array when multiple coords, single object for one
    const results = Array.isArray(response.data) ? response.data : [response.data];

    for (let i = 0; i < results.length && i < cities.length; i++) {
      const current = results[i]?.current;
      if (!current) continue;

      const city = cities[i];
      const country = city.country;

      sensors.push(createSensor({
        id:          `openmeteo_${city.name.toLowerCase().replace(/\s/g, '_')}`,
        source:      'open_meteo',
        name:        `${city.name} - Open-Meteo`,
        lat:         city.lat,
        lon:         city.lon,
        city:        city.name,
        country,
        temperature: current.temperature_2m,
        humidity:    current.relative_humidity_2m,
        pm25:        null,
        pm10:        null,
        windSpeed:   current.wind_speed_10m,
        lastSeen:    new Date().toISOString(),
        deviceType:  'Weather Station (Open-Meteo)',
        sensorCount: 3,
        exposure:    'outdoor',
      }));
    }
  } catch (err) {
    // Fallback: fetch one by one if batch fails
    logger.warn(`Open-Meteo batch failed${tag}, falling back to individual requests: ${err.message}`);
    for (const city of cities) {
      try {
        const response = await fetchWithRetry('https://api.open-meteo.com/v1/forecast', {
            latitude: city.lat,
            longitude: city.lon,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
            timezone: 'auto',
          }, 15000);
        const current = response.data?.current;
        if (!current) continue;

        const country = city.country;
        sensors.push(createSensor({
          id:          `openmeteo_${city.name.toLowerCase().replace(/\s/g, '_')}`,
          source:      'open_meteo',
          name:        `${city.name} - Open-Meteo`,
          lat:         city.lat,
          lon:         city.lon,
          city:        city.name,
          country,
          temperature: current.temperature_2m,
          humidity:    current.relative_humidity_2m,
          pm25:        null,
          pm10:        null,
          windSpeed:   current.wind_speed_10m,
          lastSeen:    new Date().toISOString(),
          deviceType:  'Weather Station (Open-Meteo)',
          sensorCount: 3,
          exposure:    'outdoor',
        }));
      } catch {
        // skip silently
      }
    }
  }

  return sensors;
}

// ─── Exported functions ─────────────────────────────────────────────────────

/**
 * Fetch all Open-Meteo sensors (Brazil + Europe)
 * This is the main export used by sensorService.js
 */
export async function fetchAllBrasilSensors() {
  logger.info('🌍 Open-Meteo: Buscando dados meteorológicos globais...');

  const sensors = await fetchOpenMeteo(ALL_CITIES);

  logger.info(`✅ Open-Meteo: ${sensors.length} cidades coletadas (${BRAZIL_CITIES.length} BR + ${EUROPE_CITIES.length} EU)`);
  return sensors;
}
