// src/config/index.js
// Central configuration - reads from environment variables with sensible defaults

import 'dotenv/config';

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  cache: {
    ttlSensors: parseInt(process.env.CACHE_TTL_SENSORS || '300', 10),
    ttlCities: parseInt(process.env.CACHE_TTL_CITIES || '600', 10),
    ttlRanking: parseInt(process.env.CACHE_TTL_RANKING || '600', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  apis: {
    openSenseMap: {
      baseUrl: process.env.OPENSENSEMAP_BASE_URL || 'https://api.opensensemap.org',
    },
    sensorCommunity: {
      baseUrl: process.env.SENSOR_COMMUNITY_BASE_URL || 'https://data.sensor.community/airrohr/v1/filter',
    },
    openWeather: {
      apiKey: process.env.OPENWEATHER_API_KEY || '',
      baseUrl: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
    },
  },

  sensors: {
    maxPerSource: parseInt(process.env.MAX_SENSORS_PER_SOURCE || '200', 10),
    maxAgeHours: parseInt(process.env.SENSOR_MAX_AGE_HOURS || '2', 10),
  },

  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/iot_platform',
    mongoEnabled: process.env.MONGO_ENABLED === 'true',
    mongoTimeout: 5000,
  },
};
