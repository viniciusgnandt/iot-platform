// src/api/openWeather.js
// OpenWeather API fallback adapter
// Used when no real sensor data is available for a location
// Requires OPENWEATHER_API_KEY env variable

import axios from 'axios';
import { config } from '../config/index.js';
import { createSensor } from '../models/sensor.js';
import { logger } from '../utils/logger.js';

const { apiKey, baseUrl } = config.apis.openWeather;

// Major world cities for fallback data
const MAJOR_CITIES = [
  { name: 'Berlin',     lat: 52.52,  lon: 13.405 },
  { name: 'London',     lat: 51.507, lon: -0.127 },
  { name: 'Paris',      lat: 48.856, lon: 2.352  },
  { name: 'Madrid',     lat: 40.416, lon: -3.703 },
  { name: 'Rome',       lat: 41.902, lon: 12.496 },
  { name: 'Amsterdam',  lat: 52.374, lon: 4.899  },
  { name: 'Vienna',     lat: 48.208, lon: 16.372 },
  { name: 'Warsaw',     lat: 52.229, lon: 21.012 },
  { name: 'Prague',     lat: 50.075, lon: 14.437 },
  { name: 'Budapest',   lat: 47.497, lon: 19.040 },
];

/**
 * Fetch weather data for a single city
 */
async function fetchCityWeather(city) {
  if (!apiKey) return null;

  try {
    const { data } = await axios.get(`${baseUrl}/weather`, {
      params: { lat: city.lat, lon: city.lon, appid: apiKey, units: 'metric' },
      timeout: 8000,
    });

    return createSensor({
      id:          `ow_${city.name.toLowerCase().replace(/\s/g, '_')}`,
      source:      'openweather',
      name:        `${city.name} Weather Station`,
      lat:         city.lat,
      lon:         city.lon,
      city:        city.name,
      country:     data.sys?.country || null,
      temperature: data.main?.temp,
      humidity:    data.main?.humidity,
      pm25:        null, // OpenWeather free tier doesn't include PM
      pm10:        null,
      windSpeed:   data.wind?.speed,
      lastSeen:    new Date().toISOString(),
      deviceType:  'Weather Station',
      sensorCount: 1,
      exposure:    'outdoor',
    });
  } catch (err) {
    logger.debug(`OpenWeather fetch failed for ${city.name}:`, err.message);
    return null;
  }
}

/**
 * Fetch weather data for all major cities (with rate limiting)
 */
export async function fetchOpenWeatherSensors() {
  if (!apiKey) {
    logger.warn('OpenWeather API key not configured, skipping fallback');
    return [];
  }

  logger.info('Fetching OpenWeather fallback data...');

  // Fetch in batches of 5 to avoid rate limiting
  const results = [];
  for (let i = 0; i < MAJOR_CITIES.length; i += 5) {
    const batch = MAJOR_CITIES.slice(i, i + 5);
    const batchResults = await Promise.allSettled(batch.map(fetchCityWeather));
    results.push(...batchResults
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value));

    // Small delay between batches
    if (i + 5 < MAJOR_CITIES.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  logger.info(`OpenWeather: fetched ${results.length} city stations`);
  return results;
}
