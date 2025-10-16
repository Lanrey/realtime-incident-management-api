import { rabbitmq } from '../config/rabbitmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Job Scheduler
 *
 * Schedules periodic tasks like stock checks.
 * Publishes messages to queues at defined intervals.
 */

let stockCheckInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic stock checking
 */
export function startStockCheckScheduler(): void {
  const intervalMs = env.STOCK_CHECK_INTERVAL_MINUTES * 60 * 1000;

  logger.info(
    { intervalMinutes: env.STOCK_CHECK_INTERVAL_MINUTES },
    'Starting stock check scheduler'
  );

  // Run immediately on start
  triggerStockCheck();

  // Then run periodically
  stockCheckInterval = setInterval(() => {
    triggerStockCheck();
  }, intervalMs);
}

/**
 * Trigger a stock check by publishing to queue
 */
async function triggerStockCheck(): Promise<void> {
  try {
    await rabbitmq.publish('stock.check', {
      timestamp: new Date().toISOString(),
      triggeredBy: 'SCHEDULER',
    });

    logger.info('Stock check triggered');
  } catch (error) {
    logger.error({ error }, 'Failed to trigger stock check');
  }
}

/**
 * Stop the scheduler
 */
export function stopStockCheckScheduler(): void {
  if (stockCheckInterval) {
    clearInterval(stockCheckInterval);
    stockCheckInterval = null;
    logger.info('Stock check scheduler stopped');
  }
}

/**
 * Start all schedulers
 */
export function startAllSchedulers(): void {
  startStockCheckScheduler();
  logger.info('✅ All schedulers started');
}

/**
 * Stop all schedulers
 */
export function stopAllSchedulers(): void {
  stopStockCheckScheduler();
  logger.info('All schedulers stopped');
}
