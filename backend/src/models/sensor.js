// src/models/sensor.js
// Sensor data model - normalized schema shared across all data sources

/**
 * Create a normalized sensor object
 * All external API responses are mapped to this schema
 *
 * @param {object} raw
 * @returns {object} Normalized sensor
 */
export function createSensor({
  id,
  source,        // 'opensensemap' | 'sensor_community' | 'openweather'
  name,
  lat,
  lon,
  city,
  country,
  temperature,   // °C
  humidity,      // %
  pm25,          // µg/m³
  pm10,          // µg/m³
  windSpeed,     // m/s
  lastSeen,      // ISO string
  icaud = null,  // calculated later
  deviceType = null,  // ex: 'senseBox', 'SDS011+DHT22', 'Weather Station'
  sensorCount = null, // número de sensores físicos
  exposure = null,    // 'indoor' | 'outdoor' | null
}) {
  return {
    id: String(id),
    source,
    name: name || `Sensor ${id}`,
    location: {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      city: city || null,
      country: country || null,
    },
    measurements: {
      temperature: toFloat(temperature),
      humidity:    toFloat(humidity),
      pm25:        toFloat(pm25),
      pm10:        toFloat(pm10),
      windSpeed:   toFloat(windSpeed),
    },
    lastSeen: lastSeen || new Date().toISOString(),
    icaud,
    deviceType,
    sensorCount,
    exposure,
  };
}

/**
 * Parse a float safely - returns null for invalid values
 */
function toFloat(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/**
 * Check if a sensor has been active within the given hours
 */
export function isActive(sensor, maxAgeHours = 2) {
  if (!sensor.lastSeen) return false;
  const ageMs = Date.now() - new Date(sensor.lastSeen).getTime();
  return ageMs <= maxAgeHours * 60 * 60 * 1000;
}

/**
 * Check if sensor has at least one valid measurement
 */
export function hasValidMeasurements(sensor) {
  const m = sensor.measurements;
  return (
    m.temperature !== null ||
    m.humidity    !== null ||
    m.pm25        !== null ||
    m.pm10        !== null
  );
}

/**
 * Check if sensor has ALL 4 ICAU-D components
 * Temperature, Humidity, Air Quality (PM2.5 or PM10), Wind Speed
 */
export function hasAllICAUDComponents(sensor) {
  const m = sensor.measurements;
  const hasTemp = m.temperature !== null;
  const hasHumidity = m.humidity !== null;
  const hasAirQuality = m.pm25 !== null || m.pm10 !== null;
  const hasWind = m.windSpeed !== null;

  return hasTemp && hasHumidity && hasAirQuality && hasWind;
}
