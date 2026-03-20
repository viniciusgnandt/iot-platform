// src/middleware/index.js
// Express middleware configuration

import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { cache } from '../utils/cache.js';

/**
 * CORS middleware
 */
export const corsMiddleware = cors({
  origin: config.server.corsOrigin,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  optionsSuccessStatus: 200,
});

/**
 * Rate limiting middleware
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

/**
 * Compression middleware
 */
export const compressionMiddleware = compression({
  threshold: 1024, // Only compress responses > 1KB
});

/**
 * Request logging middleware
 */
export const requestLogger = morgan(
  config.server.env === 'production' ? 'combined' : 'dev'
);

/**
 * Cache stats endpoint middleware
 * Adds /cache-stats endpoint to Express app
 */
export function addCacheStatsRoute(app) {
  app.get('/cache-stats', async (req, res) => {
    const { diskStats } = await import('../utils/persistentCache.js');
    res.json({
      success: true,
      data: {
        memory: cache.stats(),
        disk:   diskStats(),
      },
    });
  });
}

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
