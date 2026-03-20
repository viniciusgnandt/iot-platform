// src/index.js
// Application entry point - Express server setup

import express from 'express';
import { config } from './config/index.js';
import routes   from './routes.js';
import {
  corsMiddleware,
  compressionMiddleware,
  requestLogger,
  rateLimiter,
  addCacheStatsRoute,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';
import { logger } from './utils/logger.js';
import { connectMongo, saveSensorReadingsBatch } from './db/mongo.js';
import { setMongoCache } from './utils/cache.js';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(compressionMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(rateLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
addCacheStatsRoute(app);
app.use('/api', routes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = config.server.port;
const server = app.listen(PORT, async () => {
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log(`  🌿 IoT Environmental Platform Backend`);
  console.log(`  🚀 Servidor iniciando na porta: ${PORT}`);
  console.log(`  📍 URL: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  logger.info(`🌿 IoT Environmental Platform API running on port ${PORT}`);
  logger.info(`   Environment: ${config.server.env}`);
  logger.info(`   CORS origin: ${config.server.corsOrigin}`);

  // Inicializar MongoDB (único storage)
  if (config.database.mongoEnabled) {
    logger.info('📦 Conectando ao MongoDB...');
    const mongoInstance = await connectMongo(config.database.mongoUri);

    // Usar MongoDB como cache centralizado
    if (mongoInstance) {
      const { mongoCacheManager } = await import('./db/mongo.js');
      setMongoCache(mongoCacheManager);
      logger.info('✅ MongoDB configurado como cache centralizado');
    }
  }

  // Warm-up: popula o cache logo após o servidor subir,
  // assim a primeira requisição nunca bloqueia esperando dados
  warmUpCache();
});

// Timeout generoso para não resetar conexões lentas na primeira carga
server.setTimeout(120_000); // 2 minutos

/**
 * Popula o cache na startup aguardando cada etapa terminar de verdade.
 * Chama as funções de fetch diretamente (sem passar pelo getOrSet)
 * para evitar a race condition onde os sensores ainda não chegaram
 * quando as cidades tentam agregá-los.
 */
async function warmUpCache() {
  logger.info('🔄 Iniciando warm-up do cache...');
  try {
    const { cache }   = await import('./utils/cache.js');
    const { config }  = await import('./config/index.js');

    // Importa as funções de fetch puras (não os getters de cache)
    const sensorMod = await import('./services/sensorService.js');
    const cityMod   = await import('./services/cityService.js');

    // 1. Sensores — aguarda o fetch completo das APIs externas
    logger.info('🔄 [1/3] Buscando sensores...');

    // Buscar TODOS os sensores brutos para salvar no MongoDB (histórico)
    let allSensorsRaw = [];
    try {
      allSensorsRaw = await sensorMod.fetchAllSensorsRaw();
      if (config.database.mongoEnabled && allSensorsRaw.length > 0) {
        await saveSensorReadingsBatch(allSensorsRaw);
        logger.info(`💾 ${allSensorsRaw.length} leituras de sensores salvas no MongoDB`);
      }
    } catch (err) {
      logger.warn(`⚠️  Erro ao buscar/salvar sensores brutos: ${err.message}`);
    }

    // Buscar sensores com ICAU-D completo para exibir no frontend
    const sensors = await sensorMod.fetchAllSensors();
    await cache.set('sensors:all', sensors, config.cache.ttlSensors);
    logger.info(`✅ [1/3] Sensores: ${sensors.length} com ICAU-D completo carregados`);
    logger.info(`         Total bruto no MongoDB: ${allSensorsRaw.length}`);

    // 2. Cidades — agrega usando os sensores já em cache
    logger.info('🔄 [2/3] Agregando cidades...');
    const cities = await cityMod.fetchAllCities();
    await cache.set('cities:aggregated', cities, config.cache.ttlCities);
    logger.info(`✅ [2/3] Cidades: ${cities.length} agregadas`);

    // 3. Ranking — instantâneo pois as cidades já estão prontas
    logger.info('🔄 [3/3] Construindo ranking...');
    const ranking = await cityMod.buildRanking(50);
    await cache.set('cities:ranking:50', ranking, config.cache.ttlRanking);
    logger.info(`✅ [3/3] Ranking: ${ranking.length} cidades — plataforma pronta! 🌿`);

  } catch (err) {
    logger.warn(`⚠️  Warm-up falhou: ${err.message}`);
    logger.warn('    Dados serão carregados na primeira requisição.');
  }
}

export default app;
