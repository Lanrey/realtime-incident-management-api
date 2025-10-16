import { rabbitmq, QUEUES } from '../config/rabbitmq';
import { stockMonitor } from '../services/stockMonitor.service';
import { logger } from '../utils/logger';

/**
 * Queue Workers
 *
 * Background workers that process messages from RabbitMQ queues.
 * Each worker handles specific types of tasks asynchronously.
 */

/**
 * Stock Check Worker
 * Periodically checks stock levels and triggers reorders
 */
export async function startStockCheckWorker(): Promise<void> {
  logger.info('Starting stock check worker');

  await rabbitmq.consume(QUEUES.STOCK_CHECK, async (message) => {
    logger.info('Processing stock check message');
    await stockMonitor.checkAndReorderLowStock();
  });
}

/**
 * Order Process Worker
 * Creates purchase orders from reorder requests
 */
export async function startOrderProcessWorker(): Promise<void> {
  logger.info('Starting order process worker');

  await rabbitmq.consume(QUEUES.ORDER_PROCESS, async (message) => {
    logger.info({ message }, 'Processing order creation');

    try {
      await stockMonitor.createPurchaseOrder({
        productId: message.productId,
        warehouseId: message.warehouseId,
        supplierId: message.supplierId,
        quantity: message.quantity,
        leadTimeDays: message.leadTimeDays,
        reason: message.reason || 'AUTO_REORDER',
      });
    } catch (error) {
      logger.error({ error, message }, 'Failed to create purchase order');
      throw error; // Will be nacked and requeued
    }
  });
}

/**
 * Order Arrival Worker
 * Processes order arrivals and updates stock
 */
export async function startOrderArrivalWorker(): Promise<void> {
  logger.info('Starting order arrival worker');

  await rabbitmq.consume(QUEUES.ORDER_ARRIVAL, async (message) => {
    logger.info({ message }, 'Processing order arrival');

    try {
      await stockMonitor.processOrderArrival(message.purchaseOrderId);
    } catch (error) {
      logger.error({ error, message }, 'Failed to process order arrival');
      throw error;
    }
  });
}

/**
 * Capacity Alert Worker
 * Handles capacity warning notifications
 */
export async function startCapacityAlertWorker(): Promise<void> {
  logger.info('Starting capacity alert worker');

  await rabbitmq.consume(QUEUES.CAPACITY_ALERT, async (message) => {
    logger.warn({ message }, 'Capacity alert received');

    // Here you could:
    // - Send email notifications
    // - Trigger webhooks
    // - Update dashboards
    // - Log to external monitoring systems

    // For now, just log
    logger.warn(
      {
        warehouseId: message.warehouseId,
        alertType: message.alertType,
        currentCapacity: message.currentCapacity,
      },
      'Capacity alert processed'
    );
  });
}

/**
 * Start all queue workers
 */
export async function startAllWorkers(): Promise<void> {
  try {
    await Promise.all([
      startStockCheckWorker(),
      startOrderProcessWorker(),
      startOrderArrivalWorker(),
      startCapacityAlertWorker(),
    ]);

    logger.info('✅ All queue workers started successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to start queue workers');
    throw error;
  }
}
