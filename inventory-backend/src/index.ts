import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { rabbitmq } from './config/rabbitmq';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { registerRoutes } from './routes';
import { startAllWorkers } from './jobs/queueWorkers';
import { startAllSchedulers, stopAllSchedulers } from './jobs/scheduler';

/**
 * Main Application Entry Point
 *
 * Initializes:
 * - Fastify web server
 * - Database connections (PostgreSQL, Redis, RabbitMQ)
 * - Background workers and schedulers
 * - API routes and middleware
 */

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: env.NODE_ENV === 'production',
  });

  // Register plugins
  await fastify.register(cors, {
    origin: env.NODE_ENV === 'development' ? '*' : ['http://localhost:5173'],
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100, // requests
    timeWindow: '1 minute',
  });

  await fastify.register(websocket);

  // WebSocket endpoint for real-time updates
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, request) => {
      logger.info('WebSocket client connected');

      socket.on('message', (message) => {
        const data = JSON.parse(message.toString());
        logger.info({ data }, 'WebSocket message received');

        // Echo back for now - can be extended for real-time stock updates
        socket.send(JSON.stringify({ type: 'ack', data }));
      });

      socket.on('close', () => {
        logger.info('WebSocket client disconnected');
      });
    });
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error({ error, url: request.url }, 'Request error');

    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
      },
    });
  });

  // Register routes
  await registerRoutes(fastify);

  return fastify;
}

async function start() {
  try {
    logger.info('🚀 Starting Inventory Management System...');

    // Connect to external services
    logger.info('Connecting to databases...');
    await connectDatabase();
    await rabbitmq.connect();

    // Wait for Redis connection
    await new Promise((resolve) => {
      if (redis.status === 'ready') {
        resolve(true);
      } else {
        redis.once('ready', resolve);
      }
    });

    // Start background workers
    logger.info('Starting background workers...');
    await startAllWorkers();

    // Start schedulers
    logger.info('Starting schedulers...');
    startAllSchedulers();

    // Build and start server
    const fastify = await buildServer();

    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`✅ Server running on http://${env.HOST}:${env.PORT}`);
    logger.info(`📊 Health check: http://${env.HOST}:${env.PORT}/health`);
    logger.info(`🔌 WebSocket: ws://${env.HOST}:${env.PORT}/ws`);
  } catch (error) {
    logger.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    stopAllSchedulers();
    await rabbitmq.close();
    await redis.quit();
    logger.info('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the application
start();
