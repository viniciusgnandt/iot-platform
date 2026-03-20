// src/routes.js
// Central route definitions

import { Router } from 'express';
import { getSensors, getICAUD } from './controllers/sensorController.js';
import { getCities, getRanking, getCityDetail } from './controllers/cityController.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Debug: verificar estado do sistema
router.get('/debug', async (req, res) => {
  const { getAllSensors } = await import('./services/sensorService.js');
  const { getAllCities } = await import('./services/cityService.js');
  const { cache } = await import('./utils/cache.js');

  const sensors = await getAllSensors() || [];
  const cities = await getAllCities() || [];
  const cacheStats = cache.getStats();

  res.json({
    success: true,
    data: {
      sensors: {
        total: sensors.length,
        withScore: sensors.filter(s => s.icaud?.score !== null).length,
      },
      cities: {
        total: cities.length,
        withScore: cities.filter(c => c.icaud?.score !== null).length,
        sample: cities.slice(0, 3).map(c => ({
          name: c.name,
          sensors: c.sensorCount,
          score: c.icaud?.score,
        })),
      },
      cache: cacheStats,
    },
  });
});

// Sensor routes
router.get('/sensors', getSensors);
router.get('/icau',    getICAUD);

// City routes (order matters: /ranking before /:city)
router.get('/cities',          getCities);
router.get('/cities/ranking',  getRanking);
router.get('/cities/:city',    getCityDetail);

export default router;
