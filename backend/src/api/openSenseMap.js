// src/api/openSenseMap.js
// Adapter for the OpenSenseMap API (https://api.opensensemap.org)
// Fetches senseBoxes with environmental sensors

import axios from 'axios';
import { config } from '../config/index.js';
import { createSensor } from '../models/sensor.js';
import { logger } from '../utils/logger.js';

const BASE_URL = config.apis.openSenseMap.baseUrl;

// Phenomenon names used by OpenSenseMap to identify sensor types
const PHENOMENON_MAP = {
  temperature: ['temperature', 'temperatur', 'temp'],
  humidity:    ['humidity', 'rel. luftfeuchte', 'luftfeuchtigkeit', 'relative humidity'],
  pm25:        ['pm2.5', 'pm 2.5', 'feinstaub pm2.5', 'pm25'],
  pm10:        ['pm10', 'feinstaub pm10'],
  windSpeed:   ['wind speed', 'windgeschwindigkeit', 'wind'],
};

/**
 * Find a sensor value by phenomenon name (case-insensitive)
 */
function extractMeasurement(sensors, targetNames) {
  for (const sensor of sensors) {
    const title = (sensor.title || '').toLowerCase();
    if (targetNames.some(name => title.includes(name))) {
      const val = sensor.lastMeasurement?.value;
      return val !== undefined ? parseFloat(val) : null;
    }
  }
  return null;
}

/**
 * Fetch senseBoxes near a bounding box or globally
 * Uses the /boxes endpoint with exposure=outdoor filter
 */
export async function fetchOpenSenseMapSensors(options = {}) {
  const {
    bbox,          // [lonMin, latMin, lonMax, latMax]
    limit = config.sensors.maxPerSource,
  } = options;

  try {
    const params = {
      exposure: 'outdoor',
      phenomenon: 'PM2.5',
      format: 'json',
      limit,
    };

    if (bbox) {
      params.bbox = bbox.join(',');
    }

    logger.info('Fetching from OpenSenseMap...', { limit });

    const response = await axios.get(`${BASE_URL}/boxes`, {
      params,
      timeout: 15000,
      headers: { 'Accept': 'application/json' },
    });

    const boxes = response.data;

    if (!Array.isArray(boxes)) {
      logger.warn('OpenSenseMap returned unexpected format');
      return [];
    }

    logger.info(`OpenSenseMap: received ${boxes.length} boxes`);

    return boxes.map(box => {
      const sensorList = box.sensors || [];
      const [lon, lat] = box.currentLocation?.coordinates || [0, 0];

      // Extract last measurement timestamp
      const lastMeasured = sensorList
        .map(s => s.lastMeasurement?.createdAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];

      return createSensor({
        id:          `osm_${box._id}`,
        source:      'opensensemap',
        name:        box.name,
        lat,
        lon,
        city:        box.currentLocation?.city || null,
        country:     null,
        temperature: extractMeasurement(sensorList, PHENOMENON_MAP.temperature),
        humidity:    extractMeasurement(sensorList, PHENOMENON_MAP.humidity),
        pm25:        extractMeasurement(sensorList, PHENOMENON_MAP.pm25),
        pm10:        extractMeasurement(sensorList, PHENOMENON_MAP.pm10),
        windSpeed:   extractMeasurement(sensorList, PHENOMENON_MAP.windSpeed),
        lastSeen:    lastMeasured || null,
        deviceType:  'senseBox',
        sensorCount: sensorList.length,
        exposure:    box.exposure || null,
      });
    });
  } catch (err) {
    logger.error('OpenSenseMap fetch failed:', err.message);
    return [];
  }
}
