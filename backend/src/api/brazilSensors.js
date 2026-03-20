// src/api/brazilSensors.js
// Specialized data collection for Brazilian sensors
// Searches multiple sources with Brazil-specific bounds and filters

import axios from 'axios';
import { config } from '../config/index.js';
import { createSensor } from '../models/sensor.js';
import { logger } from '../utils/logger.js';

// Bounding box do Brasil (aproximado)
// [lonMin, latMin, lonMax, latMax]
const BRAZIL_BBOX = [-75, -33.5, -34, 5];

/**
 * Busca sensores do OpenSenseMap dentro do Brasil
 */
export async function fetchBrasilOpenSenseMap() {
  try {
    logger.info('🇧🇷 Buscando sensores OpenSenseMap no Brasil...');

    const params = {
      exposure: 'outdoor',
      phenomenon: 'PM2.5',
      bbox: BRAZIL_BBOX.join(','),
      format: 'json',
      limit: 500, // Aumentado para cobrir todo Brasil
    };

    const response = await axios.get('https://api.opensensemap.org/boxes', {
      params,
      timeout: 20000,
      headers: { 'Accept': 'application/json' },
    });

    const boxes = response.data;
    if (!Array.isArray(boxes)) {
      logger.warn('OpenSenseMap Brasil: formato inesperado');
      return [];
    }

    logger.info(`✅ OpenSenseMap Brasil: ${boxes.length} sensores encontrados`);

    return boxes.map(box => {
      const sensorList = box.sensors || [];
      const [lon, lat] = box.currentLocation?.coordinates || [0, 0];

      const lastMeasured = sensorList
        .map(s => s.lastMeasurement?.createdAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];

      return createSensor({
        id:          `osm_br_${box._id}`,
        source:      'opensensemap',
        name:        box.name,
        lat,
        lon,
        city:        box.currentLocation?.city || null,
        country:     'Brazil',
        temperature: extractMeasurement(sensorList, ['temperature', 'temperatur', 'temp']),
        humidity:    extractMeasurement(sensorList, ['humidity', 'rel. luftfeuchte', 'luftfeuchtigkeit']),
        pm25:        extractMeasurement(sensorList, ['pm2.5', 'pm 2.5', 'feinstaub pm2.5', 'pm25']),
        pm10:        extractMeasurement(sensorList, ['pm10', 'feinstaub pm10']),
        windSpeed:   extractMeasurement(sensorList, ['wind speed', 'windgeschwindigkeit', 'wind']),
        lastSeen:    lastMeasured || null,
        deviceType:  'senseBox',
        sensorCount: sensorList.length,
        exposure:    box.exposure || null,
      });
    });
  } catch (err) {
    logger.error('OpenSenseMap Brasil fetch failed:', err.message);
    return [];
  }
}

/**
 * Busca sensores do Sensor.Community dentro do Brasil
 * Nota: Sensor.Community tem concentração na Europa, mas há alguns no Brasil
 */
export async function fetchBrasilSensorCommunity() {
  try {
    logger.info('🇧🇷 Buscando sensores Sensor.Community no Brasil...');

    // Busca por país (Brasil = BR no Nominatim)
    const [pmResponse, tempResponse] = await Promise.allSettled([
      axios.get('https://data.sensor.community/airrohr/v1/filter/type=SDS011', { timeout: 20000 }),
      axios.get('https://data.sensor.community/airrohr/v1/filter/type=DHT22', { timeout: 20000 }),
    ]);

    const pmData   = pmResponse.status === 'fulfilled' ? pmResponse.value.data : [];
    const tempData = tempResponse.status === 'fulfilled' ? tempResponse.value.data : [];

    // Filtra apenas Brasil por bounding box
    const sensorsInBrazil = [];
    const seen = new Set();

    for (const entry of (Array.isArray(pmData) ? pmData : [])) {
      const loc = entry.location;
      if (!loc?.latitude || !loc?.longitude) continue;

      const lat = parseFloat(loc.latitude);
      const lon = parseFloat(loc.longitude);

      // Verifica se está dentro da bbox do Brasil
      if (lat < BRAZIL_BBOX[1] || lat > BRAZIL_BBOX[3] ||
          lon < BRAZIL_BBOX[0] || lon > BRAZIL_BBOX[2]) continue;

      const sensorId = `sc_br_${entry.sensor?.id || entry.id}`;
      if (seen.has(sensorId)) continue;
      seen.add(sensorId);

      sensorsInBrazil.push(entry);
    }

    logger.info(`✅ Sensor.Community Brasil: ${sensorsInBrazil.length} sensores encontrados`);

    // Mapeia os sensores para o modelo normalizado
    return sensorsInBrazil.map(entry => {
      const loc = entry.location;
      const lat = parseFloat(loc.latitude);
      const lon = parseFloat(loc.longitude);

      // Busca dados de temperatura próximos
      let tempData = [];
      if (Array.isArray(tempData)) {
        const locKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
        for (const temp of tempData) {
          if (Math.abs(parseFloat(temp.location.latitude) - lat) < 0.05 &&
              Math.abs(parseFloat(temp.location.longitude) - lon) < 0.05) {
            tempData = temp.sensordatavalues || [];
            break;
          }
        }
      }

      const allValues = [...(entry.sensordatavalues || []), ...tempData];

      return createSensor({
        id:          `sc_br_${entry.sensor?.id || entry.id}`,
        source:      'sensor_community',
        name:        `SC-BR-${entry.sensor?.id || entry.id}`,
        lat,
        lon,
        city:        loc.city || null,
        country:     'Brazil',
        temperature: extractValue(allValues, ['temperature', 'temp']),
        humidity:    extractValue(allValues, ['humidity']),
        pm25:        extractValue(allValues, ['P2', 'pm25', 'PM2.5']),
        pm10:        extractValue(allValues, ['P1', 'pm10', 'PM10']),
        windSpeed:   null,
        lastSeen:    entry.timestamp || new Date().toISOString(),
        deviceType:  entry.sensor?.sensor_type?.name || 'SDS011',
        sensorCount: 2,
        exposure:    'outdoor',
      });
    });
  } catch (err) {
    logger.error('Sensor.Community Brasil fetch failed:', err.message);
    return [];
  }
}

/**
 * Busca dados de qualidade do ar de BreezoMeter API (se disponível)
 * Nota: Requer API key, usa como fallback opcional
 */
export async function fetchBreezoMeterBrasil() {
  const apiKey = process.env.BREEZOMETER_API_KEY;
  if (!apiKey) {
    logger.debug('BreezoMeter não configurado, pulando...');
    return [];
  }

  try {
    logger.info('🇧🇷 Buscando dados BreezoMeter do Brasil...');

    // Principais cidades brasileiras para sampling
    const cities = [
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
      { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
      { name: 'Belo Horizonte', lat: -19.9191, lon: -43.9386 },
      { name: 'Brasília', lat: -15.7942, lon: -47.8822 },
      { name: 'Salvador', lat: -12.9714, lon: -38.5014 },
      { name: 'Fortaleza', lat: -3.7319, lon: -38.5267 },
      { name: 'Recife', lat: -8.0726, lon: -34.8759 },
      { name: 'Manaus', lat: -3.1190, lon: -60.0217 },
      { name: 'Curitiba', lat: -25.4284, lon: -49.2733 },
      { name: 'Porto Alegre', lat: -30.0346, lon: -51.2177 },
    ];

    const sensors = [];

    for (const city of cities) {
      try {
        const response = await axios.get('https://api.breezometer.com/air-quality/v2/current-conditions', {
          params: {
            lat: city.lat,
            lon: city.lon,
            apikey: apiKey,
            features: 'pollutants_concentrations',
          },
          timeout: 8000,
        });

        const data = response.data?.data;
        if (!data) continue;

        const pollutants = data.pollutants || {};
        const pm25 = pollutants.pm25?.concentration_mcg_per_m3 || null;

        sensors.push(createSensor({
          id:          `breezometer_${city.name.toLowerCase().replace(/\s/g, '_')}`,
          source:      'breezometer',
          name:        `${city.name} - BreezoMeter`,
          lat:         city.lat,
          lon:         city.lon,
          city:        city.name,
          country:     'Brazil',
          temperature: null,
          humidity:    null,
          pm25:        pm25,
          pm10:        pollutants.pm10?.concentration_mcg_per_m3 || null,
          windSpeed:   null,
          lastSeen:    new Date().toISOString(),
          deviceType:  'Air Quality Monitor',
          sensorCount: 1,
          exposure:    'outdoor',
        }));
      } catch (err) {
        logger.debug(`BreezoMeter falhou para ${city.name}: ${err.message}`);
      }
    }

    logger.info(`✅ BreezoMeter Brasil: ${sensors.length} sensores coletados`);
    return sensors;
  } catch (err) {
    logger.error('BreezoMeter Brasil fetch failed:', err.message);
    return [];
  }
}

/**
 * Busca dados de qualidade do ar da AQICN (World Air Quality Index)
 * Nota: Requer API key, fornece dados de qualidade do ar em tempo real
 */
export async function fetchAQICNBrasil() {
  const apiKey = process.env.AQICN_API_KEY;
  if (!apiKey) {
    logger.debug('AQICN não configurado, pulando...');
    return [];
  }

  try {
    logger.info('🇧🇷 Buscando dados AQICN do Brasil...');

    // Principais cidades brasileiras para coleta de qualidade do ar
    const cities = [
      'São Paulo,BR', 'Rio de Janeiro,BR', 'Belo Horizonte,BR',
      'Brasília,BR', 'Salvador,BR', 'Fortaleza,BR', 'Recife,BR',
      'Manaus,BR', 'Curitiba,BR', 'Porto Alegre,BR', 'Goiânia,BR',
      'Campinas,BR', 'Santos,BR', 'Guarulhos,BR', 'Osasco,BR',
      'Belém,BR', 'Teresina,BR', 'João Pessoa,BR', 'Natal,BR',
    ];

    const sensors = [];

    for (const city of cities) {
      try {
        const response = await axios.get(`https://api.waqi.info/feed/${city}/?token=${apiKey}`, {
          timeout: 8000,
        });

        const data = response.data?.data;
        if (!data || data.status === 'error') continue;

        const iaqIndex = data.iaqi;
        if (!iaqIndex) continue;

        const lat = data.city?.geo?.[0];
        const lon = data.city?.geo?.[1];
        if (!lat || !lon) continue;

        sensors.push(createSensor({
          id:          `aqicn_br_${city.replace(/[,\s]/g, '_').toLowerCase()}`,
          source:      'aqicn',
          name:        `${data.city?.name || city} - AQICN`,
          lat,
          lon,
          city:        data.city?.name || null,
          country:     'Brazil',
          temperature: iaqIndex.t ? parseFloat(iaqIndex.t.v) : null,
          humidity:    iaqIndex.h ? parseFloat(iaqIndex.h.v) : null,
          pm25:        iaqIndex.pm25 ? parseFloat(iaqIndex.pm25.v) : null,
          pm10:        iaqIndex.pm10 ? parseFloat(iaqIndex.pm10.v) : null,
          windSpeed:   iaqIndex.w ? parseFloat(iaqIndex.w.v) : null,
          lastSeen:    new Date().toISOString(),
          deviceType:  'Air Quality Monitor (AQICN)',
          sensorCount: Object.keys(iaqIndex).length,
          exposure:    'outdoor',
        }));
      } catch (err) {
        logger.debug(`AQICN falhou para ${city}: ${err.message}`);
      }
    }

    logger.info(`✅ AQICN Brasil: ${sensors.length} sensores coletados`);
    return sensors;
  } catch (err) {
    logger.error('AQICN Brasil fetch failed:', err.message);
    return [];
  }
}

/**
 * Busca dados meteorológicos de Open-Meteo (sem API key)
 * Nota: Fornece temperatura, umidade, velocidade do vento para cidades brasileiras
 */
export async function fetchOpenMeteoBrasil() {
  try {
    logger.info('🇧🇷 Buscando dados Open-Meteo do Brasil...');

    // Principais cidades brasileiras com coordenadas
    const cities = [
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
      { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
      { name: 'Belo Horizonte', lat: -19.9191, lon: -43.9386 },
      { name: 'Brasília', lat: -15.7942, lon: -47.8822 },
      { name: 'Salvador', lat: -12.9714, lon: -38.5014 },
      { name: 'Fortaleza', lat: -3.7319, lon: -38.5267 },
      { name: 'Recife', lat: -8.0726, lon: -34.8759 },
      { name: 'Manaus', lat: -3.1190, lon: -60.0217 },
      { name: 'Curitiba', lat: -25.4284, lon: -49.2733 },
      { name: 'Porto Alegre', lat: -30.0346, lon: -51.2177 },
      { name: 'Goiânia', lat: -15.8267, lon: -48.9385 },
      { name: 'Campinas', lat: -22.9068, lon: -47.0707 },
      { name: 'Guarulhos', lat: -23.4613, lon: -46.4734 },
      { name: 'Teresina', lat: -5.0892, lon: -42.8084 },
      { name: 'João Pessoa', lat: -7.1219, lon: -34.8450 },
      { name: 'Natal', lat: -5.7942, lon: -35.2110 },
      { name: 'Belém', lat: -1.4554, lon: -48.5034 },
      { name: 'Maceió', lat: -9.6498, lon: -35.7348 },
    ];

    const sensors = [];

    for (const city of cities) {
      try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: city.lat,
            longitude: city.lon,
            current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
            timezone: 'auto',
          },
          timeout: 8000,
        });

        const current = response.data?.current;
        if (!current) continue;

        sensors.push(createSensor({
          id:          `openmeteo_br_${city.name.toLowerCase().replace(/\s/g, '_')}`,
          source:      'open_meteo',
          name:        `${city.name} - Open-Meteo`,
          lat:         city.lat,
          lon:         city.lon,
          city:        city.name,
          country:     'Brazil',
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
      } catch (err) {
        logger.debug(`Open-Meteo falhou para ${city.name}: ${err.message}`);
      }
    }

    logger.info(`✅ Open-Meteo Brasil: ${sensors.length} sensores coletados`);
    return sensors;
  } catch (err) {
    logger.error('Open-Meteo Brasil fetch failed:', err.message);
    return [];
  }
}

/**
 * Busca todos os sensores do Brasil de todas as fontes
 */
export async function fetchAllBrasilSensors() {
  const [osmResults, scResults, breezoResults, aqicnResults, openMeteoResults] = await Promise.allSettled([
    fetchBrasilOpenSenseMap(),
    fetchBrasilSensorCommunity(),
    fetchBreezoMeterBrasil(),
    fetchAQICNBrasil(),
    fetchOpenMeteoBrasil(),
  ]);

  const allSensors = [];

  if (osmResults.status === 'fulfilled') allSensors.push(...osmResults.value);
  if (scResults.status === 'fulfilled') allSensors.push(...scResults.value);
  if (breezoResults.status === 'fulfilled') allSensors.push(...breezoResults.value);
  if (aqicnResults.status === 'fulfilled') allSensors.push(...aqicnResults.value);
  if (openMeteoResults.status === 'fulfilled') allSensors.push(...openMeteoResults.value);

  logger.info(`🇧🇷 Total sensores Brasil coletados: ${allSensors.length}`);
  return allSensors;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

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

function extractValue(sensordatavalues = [], keys) {
  for (const entry of sensordatavalues) {
    if (keys.some(k => entry.value_type === k)) {
      const val = parseFloat(entry.value);
      return isNaN(val) ? null : val;
    }
  }
  return null;
}
