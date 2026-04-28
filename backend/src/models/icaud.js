// src/models/icaud.js
// Urban Environmental Comfort Index (ICAU-D) calculation engine

/**
 * Classification thresholds and labels
 */
// Faixas contínuas (sem gap entre 80 e 81 etc.) — score 80.5 cai em "Comfortable",
// 81.0 em "Very Comfortable". `min` inclusivo, `max` exclusivo (exceto o topo).
export const CLASSIFICATIONS = [
  { min: 80, max: 100.001, label: 'Very Comfortable', color: '#22c55e', emoji: '🌿' },
  { min: 60, max: 80,      label: 'Comfortable',      color: '#84cc16', emoji: '😊' },
  { min: 30, max: 60,      label: 'Uncomfortable',    color: '#f59e0b', emoji: '😐' },
  { min: 0,  max: 30,      label: 'Unhealthy',        color: '#ef4444', emoji: '⚠️' },
];

/**
 * Normalize temperature: ideal ~22°C
 * T_norm = max(0, 100 - |T - 22| * 4)
 */
export function normalizeTemperature(temp) {
  if (temp === null || temp === undefined || isNaN(temp)) return null;
  return Math.max(0, 100 - Math.abs(temp - 22) * 4);
}

/**
 * Normalize humidity: ideal ~50%
 * U_norm = max(0, 100 - |U - 50| * 2)
 */
export function normalizeHumidity(humidity) {
  if (humidity === null || humidity === undefined || isNaN(humidity)) return null;
  return Math.max(0, 100 - Math.abs(humidity - 50) * 2);
}

/**
 * Normalize air quality (PM2.5)
 * AQ_norm = max(0, 100 - PM2.5 * 2)
 */
export function normalizeAirQuality(pm25) {
  if (pm25 === null || pm25 === undefined || isNaN(pm25)) return null;
  return Math.max(0, 100 - pm25 * 2);
}

/**
 * Normalize wind speed: ideal ~2 m/s
 * V_norm = 100 - |V - 2| * 20
 */
export function normalizeWindSpeed(windSpeed) {
  if (windSpeed === null || windSpeed === undefined || isNaN(windSpeed)) return null;
  return Math.max(0, 100 - Math.abs(windSpeed - 2) * 20);
}

/**
 * Calculate ICAU-D index with automatic weight rebalancing for missing variables
 *
 * Base weights: T=0.4, U=0.3, AQ=0.2, V=0.1
 *
 * @param {object} params - { temperature, humidity, pm25, windSpeed }
 * @returns {object} - { score, classification, components, weights }
 */
export function calculateICAUD(params) {
  const { temperature, humidity, pm25, windSpeed } = params;

  // Normalize each available parameter
  const components = {
    temperature: normalizeTemperature(temperature),
    humidity:    normalizeHumidity(humidity),
    airQuality:  normalizeAirQuality(pm25),
    wind:        normalizeWindSpeed(windSpeed),
  };

  // Base weights
  const baseWeights = {
    temperature: 0.4,
    humidity:    0.3,
    airQuality:  0.2,
    wind:        0.1,
  };

  // Determine which components are available
  const available = Object.entries(components)
    .filter(([, v]) => v !== null)
    .map(([k]) => k);

  if (available.length === 0) {
    return {
      score: null,
      classification: null,
      components,
      weights: baseWeights,
      availableComponents: [],
    };
  }

  // Rebalance weights proportionally for missing components
  const totalBaseWeight = available.reduce((sum, k) => sum + baseWeights[k], 0);
  const weights = {};
  available.forEach(k => {
    weights[k] = baseWeights[k] / totalBaseWeight;
  });

  // Calculate weighted score
  const score = available.reduce((sum, k) => sum + components[k] * weights[k], 0);
  const rounded = Math.round(score * 10) / 10;

  return {
    score: rounded,
    classification: classify(rounded),
    components,
    weights,
    availableComponents: available,
  };
}

/**
 * Classify a score into comfort category
 * @param {number} score
 * @returns {object}
 */
export function classify(score) {
  if (score === null || score === undefined || isNaN(score)) return null;
  // Faixa: min inclusivo, max exclusivo (exceto a faixa topo)
  return CLASSIFICATIONS.find(c => score >= c.min && score < c.max) || null;
}
