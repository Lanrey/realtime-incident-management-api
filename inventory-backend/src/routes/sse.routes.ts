import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { appEvents } from '../utils/eventEmitter';
import { logger } from '../utils/logger';

/**
 * Server-Sent Events (SSE) Routes
 *
 * Provides real-time updates to connected clients via SSE.
 * Automatically handles reconnection and keep-alive.
 *
 * Events broadcasted:
 * - stock: Stock level updates
 * - alert: New alerts and alert resolutions
 * - order: Purchase order updates
 * - warehouse: Warehouse capacity updates
 * - product: Product creation
 * - supplier: Supplier creation
 * - warehouse-created: Warehouse creation
 */

interface SSEClient {
  id: string;
  reply: FastifyReply;
  heartbeatTimer?: NodeJS.Timeout;
}

const connectedClients = new Set<SSEClient>();

export async function sseRoutes(fastify: FastifyInstance) {
  /**
   * SSE endpoint for real-time updates
   * GET /api/events
   */
  fastify.get('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Set SSE headers
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Explicit CORS headers for SSE (since we stream via raw response)
    const origin = (request.headers as any).origin as string | undefined;
    if (origin) {
      // Mirror the request origin (allowed by global CORS policy)
      reply.raw.setHeader('Access-Control-Allow-Origin', origin);
      reply.raw.setHeader('Vary', 'Origin');
    }
    reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');

    // Take over the response lifecycle for streaming
    reply.hijack();

    // Send initial connection event
    reply.raw.write(`event: connected\n`);
    reply.raw.write(`data: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

    const client: SSEClient = {
      id: clientId,
      reply,
    };

    connectedClients.add(client);
    logger.info({ clientId, totalClients: connectedClients.size }, 'SSE client connected');

    // Send heartbeat every 30 seconds to keep connection alive
    client.heartbeatTimer = setInterval(() => {
      try {
        reply.raw.write(`: heartbeat\n\n`);
      } catch (error) {
        logger.error({ clientId, error }, 'Failed to send heartbeat');
        cleanup();
      }
    }, 30000);

    // Helper function to send events
    const sendEvent = (eventType: string, data: any) => {
      try {
        reply.raw.write(`event: ${eventType}\n`);
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        logger.error({ clientId, eventType, error }, 'Failed to send event');
        cleanup();
      }
    };

    // Event listeners
    const stockUpdateListener = (data: any) => sendEvent('stock', data);
    const alertNewListener = (data: any) => sendEvent('alert', data);
    const alertResolvedListener = (data: any) => sendEvent('alert', { ...data, resolved: true });
    const orderCreatedListener = (data: any) => sendEvent('order', data);
    const orderUpdatedListener = (data: any) => sendEvent('order', data);
    const warehouseUpdatedListener = (data: any) => sendEvent('warehouse', data);
    const productCreatedListener = (data: any) => sendEvent('product', data);
    const supplierCreatedListener = (data: any) => sendEvent('supplier', data);
    const warehouseCreatedListener = (data: any) => sendEvent('warehouse-created', data);

    // Register event listeners
    appEvents.on('stock:update', stockUpdateListener);
    appEvents.on('alert:new', alertNewListener);
    appEvents.on('alert:resolved', alertResolvedListener);
    appEvents.on('order:created', orderCreatedListener);
    appEvents.on('order:updated', orderUpdatedListener);
    appEvents.on('warehouse:updated', warehouseUpdatedListener);
    appEvents.on('product:created', productCreatedListener);
    appEvents.on('supplier:created', supplierCreatedListener);
    appEvents.on('warehouse:created', warehouseCreatedListener);

    // Cleanup function
    const cleanup = () => {
      if (client.heartbeatTimer) {
        clearInterval(client.heartbeatTimer);
      }

      // Remove event listeners
      appEvents.off('stock:update', stockUpdateListener);
      appEvents.off('alert:new', alertNewListener);
      appEvents.off('alert:resolved', alertResolvedListener);
      appEvents.off('order:created', orderCreatedListener);
      appEvents.off('order:updated', orderUpdatedListener);
      appEvents.off('warehouse:updated', warehouseUpdatedListener);
      appEvents.off('product:created', productCreatedListener);
      appEvents.off('supplier:created', supplierCreatedListener);
      appEvents.off('warehouse:created', warehouseCreatedListener);

      connectedClients.delete(client);
      logger.info({ clientId, totalClients: connectedClients.size }, 'SSE client disconnected');
    };

    // Handle client disconnect
    request.raw.on('close', cleanup);
    request.raw.on('error', (error) => {
      logger.error({ clientId, error }, 'SSE connection error');
      cleanup();
    });

    // Keep the connection open
    await new Promise(() => {
      // Connection stays open until client disconnects
    });
  });

  /**
   * Get SSE connection statistics
   * GET /api/events/stats
   */
  fastify.get('/events/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      connectedClients: connectedClients.size,
      clients: Array.from(connectedClients).map(client => ({
        id: client.id,
        connected: true,
      })),
    };
  });
}

/**
 * Broadcast event to all connected clients
 * Useful for testing or manual event triggering
 */
export function broadcastToAll(eventType: string, data: any) {
  logger.info({ eventType, clientCount: connectedClients.size }, 'Broadcasting to all clients');

  for (const client of connectedClients) {
    try {
      client.reply.raw.write(`event: ${eventType}\n`);
      client.reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      logger.error({ clientId: client.id, error }, 'Failed to broadcast');
    }
  }
}
