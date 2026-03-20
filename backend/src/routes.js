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

// Sensor routes
router.get('/sensors', getSensors);
router.get('/icau',    getICAUD);

// City routes (order matters: /ranking before /:city)
router.get('/cities',          getCities);
router.get('/cities/ranking',  getRanking);
router.get('/cities/:city',    getCityDetail);

export default router;
