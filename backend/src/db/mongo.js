// src/db/mongo.js
// MongoDB connection and schemas for sensor data storage
// Graceful fallback if mongoose not installed

import { logger } from '../utils/logger.js';

let mongoose = null;
let isAvailable = false;

try {
  const mongooseModule = await import('mongoose');
  mongoose = mongooseModule.default;
  isAvailable = true;
} catch (err) {
  logger.warn('⚠️  Mongoose não instalado - MongoDB desabilitado');
  logger.warn('   Para ativar: npm install mongoose');
}

// Models (null se mongoose não disponível)
let SensorReading = null;
let CacheEntry = null;

if (isAvailable && mongoose) {
  const Schema = mongoose.Schema;
  const model = mongoose.model;

  // Schema para leitura histórica de sensores
  const sensorReadingSchema = new Schema(
    {
      sensorId: { type: String, required: true, index: true },
      source: { type: String, enum: ['opensensemap', 'sensor_community', 'openweather', 'breezometer'], required: true },
      name: String,
      location: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        city: String,
        country: String,
      },
      measurements: {
        temperature: Number,
        humidity: Number,
        pm25: Number,
        pm10: Number,
        windSpeed: Number,
      },
      icaud: {
        score: Number,
        classification: String,
      },
      deviceType: String,
      sensorCount: Number,
      exposure: { type: String, enum: ['indoor', 'outdoor', null] },
      recordedAt: { type: Date, default: Date.now, index: true },
    },
    { timestamps: true }
  );

  // TTL index — auto-delete readings older than 30 days
  sensorReadingSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

  // Schema para cache persistente
  const cacheEntrySchema = new Schema(
    {
      key: { type: String, required: true, unique: true, index: true },
      value: mongoose.Schema.Types.Mixed,
      expiresAt: { type: Date, index: true },
    },
    { timestamps: true }
  );

  // TTL index — auto-delete expired entries
  cacheEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // Criar models
  SensorReading = model('SensorReading', sensorReadingSchema);
  CacheEntry = model('CacheEntry', cacheEntrySchema);
}

/**
 * Connect to MongoDB
 */
export async function connectMongo(mongoUri) {
  if (!isAvailable) {
    logger.warn('MongoDB desabilitado - conexão pulada');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected successfully');
    return true;
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    return false;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectMongo() {
  if (!isAvailable) return;

  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (err) {
    logger.error('MongoDB disconnect error:', err.message);
  }
}

/**
 * Save a sensor reading snapshot
 */
export async function saveSensorReading(sensor) {
  if (!isAvailable || !SensorReading) return;

  try {
    const reading = new SensorReading({
      sensorId: sensor.id,
      source: sensor.source,
      name: sensor.name,
      location: sensor.location,
      measurements: sensor.measurements,
      icaud: sensor.icaud,
      deviceType: sensor.deviceType,
      sensorCount: sensor.sensorCount,
      exposure: sensor.exposure,
      recordedAt: new Date(sensor.lastSeen || Date.now()),
    });
    await reading.save();
  } catch (err) {
    logger.debug('SensorReading save error:', err.message);
  }
}

/**
 * Save multiple sensor readings in batch
 */
export async function saveSensorReadingsBatch(sensors) {
  if (!isAvailable || !SensorReading || sensors.length === 0) return;

  try {
    const readings = sensors.map(sensor => ({
      sensorId: sensor.id,
      source: sensor.source,
      name: sensor.name,
      location: sensor.location,
      measurements: sensor.measurements,
      icaud: sensor.icaud,
      deviceType: sensor.deviceType,
      sensorCount: sensor.sensorCount,
      exposure: sensor.exposure,
      recordedAt: new Date(sensor.lastSeen || Date.now()),
    }));
    await SensorReading.insertMany(readings, { ordered: false });
  } catch (err) {
    logger.debug('SensorReading batch save error:', err.message);
  }
}

/**
 * Get sensor readings history for a sensor
 */
export async function getSensorReadingsHistory(sensorId, hoursBack = 24) {
  if (!isAvailable || !SensorReading) return [];

  try {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return await SensorReading.find({
      sensorId,
      recordedAt: { $gte: since },
    }).sort({ recordedAt: -1 });
  } catch (err) {
    logger.debug('getSensorReadingsHistory error:', err.message);
    return [];
  }
}

/**
 * Get sensor readings history for a city (by location proximity)
 */
export async function getSensorReadingsNearLocation(lat, lon, radiusKm = 25, hoursBack = 24) {
  if (!isAvailable || !SensorReading) return [];

  try {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const radiusDegrees = radiusKm / 111; // 1 degree ~ 111km

    return await SensorReading.find({
      'location.lat': { $gte: lat - radiusDegrees, $lte: lat + radiusDegrees },
      'location.lon': { $gte: lon - radiusDegrees, $lte: lon + radiusDegrees },
      recordedAt: { $gte: since },
    }).sort({ recordedAt: -1 });
  } catch (err) {
    logger.debug('getSensorReadingsNearLocation error:', err.message);
    return [];
  }
}

/**
 * Cache entry operations (alternative to Redis)
 */
export async function mongoCacheGet(key) {
  if (!isAvailable || !CacheEntry) return null;

  try {
    const entry = await CacheEntry.findOne({
      key,
      expiresAt: { $gt: new Date() },
    });
    return entry ? entry.value : null;
  } catch (err) {
    logger.debug('mongoCacheGet error:', err.message);
    return null;
  }
}

export async function mongoCacheSet(key, value, ttlSecs = 3600) {
  if (!isAvailable || !CacheEntry) return;

  try {
    const expiresAt = new Date(Date.now() + ttlSecs * 1000);
    await CacheEntry.findOneAndUpdate(
      { key },
      { key, value, expiresAt },
      { upsert: true }
    );
  } catch (err) {
    logger.debug('mongoCacheSet error:', err.message);
  }
}

export async function mongoCacheDel(key) {
  if (!isAvailable || !CacheEntry) return;

  try {
    await CacheEntry.deleteOne({ key });
  } catch (err) {
    logger.debug('mongoCacheDel error:', err.message);
  }
}

export async function mongoCacheDelPattern(pattern) {
  if (!isAvailable || !CacheEntry) return;

  try {
    const regex = new RegExp(pattern);
    await CacheEntry.deleteMany({ key: { $regex: regex } });
  } catch (err) {
    logger.debug('mongoCacheDelPattern error:', err.message);
  }
}

export async function mongoCacheFlush() {
  if (!isAvailable || !CacheEntry) return;

  try {
    await CacheEntry.deleteMany({});
    logger.info('Cache flushed');
  } catch (err) {
    logger.debug('mongoCacheFlush error:', err.message);
  }
}

/**
 * Cache manager object (singleton pattern)
 * Wraps MongoDB cache operations for unified interface
 */
export const mongoCacheManager = {
  mongoCacheGet,
  mongoCacheSet,
  mongoCacheDel,
  mongoCacheDelPattern,
  flush: mongoCacheFlush,
};

/**
 * Cleanup old readings (periodicamente)
 */
export async function cleanupOldReadings(daysBack = 30) {
  if (!isAvailable || !SensorReading) return;

  try {
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const result = await SensorReading.deleteMany({ recordedAt: { $lt: cutoff } });
    logger.info(`Cleaned up ${result.deletedCount} old sensor readings`);
  } catch (err) {
    logger.error('cleanupOldReadings error:', err.message);
  }
}

export { SensorReading, CacheEntry };
