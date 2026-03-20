// src/controllers/cityController.js

import { getAllCities, getCitiesRanking, getCityByName } from '../services/cityService.js';
import { logger } from '../utils/logger.js';

/**
 * GET /cities
 * Returns all cities with environmental data
 */
export async function getCities(req, res) {
  try {
    const { country, minSensors = 1 } = req.query;
    let cities = await getAllCities();

    if (country) {
      cities = cities.filter(c =>
        c.country?.toLowerCase() === country.toLowerCase()
      );
    }

    if (minSensors) {
      cities = cities.filter(c => c.sensorCount >= parseInt(minSensors, 10));
    }

    res.json({
      success: true,
      count: cities.length,
      data: cities,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('getCities error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch cities' });
  }
}

/**
 * GET /cities/ranking
 * Returns top cities ranked by ICAU-D score
 * Query params: limit (default 50)
 */
export async function getRanking(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const ranking = await getCitiesRanking(limit);

    // Cache ainda aquecendo — retorna 202 para o frontend tentar novamente
    if (ranking.length === 0) {
      return res.status(202).json({
        success: true,
        count: 0,
        data: [],
        loading: true,
        message: 'Dados sendo carregados. Tente novamente em alguns instantes.',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      count: ranking.length,
      data: ranking,
      loading: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('getRanking error:', err.message);
    res.status(202).json({
      success: true,
      count: 0,
      data: [],
      loading: true,
      message: 'Dados temporariamente indisponíveis. Tente novamente em breve.',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /cities/:city
 * Returns detailed data for a specific city
 */
export async function getCityDetail(req, res) {
  try {
    const { city } = req.params;
    const data = await getCityByName(decodeURIComponent(city));

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `City '${city}' not found`,
      });
    }

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('getCityDetail error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch city data' });
  }
}
