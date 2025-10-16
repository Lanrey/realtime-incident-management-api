import { prisma } from '../config/database';
import { rabbitmq, QUEUES } from '../config/rabbitmq';
import { logger } from '../utils/logger';
import { capacityManager } from './capacityManager.service';
import { Prisma } from '@prisma/client';

export interface LowStockProduct {
  productId: string;
  warehouseId: string;
  currentQuantity: number;
  reorderThreshold: number;
  reorderQuantity: number;
  supplierId: string;
  leadTimeDays: number;
}

/**
 * StockMonitorService
 *
 * Core service responsible for monitoring stock levels and triggering automatic reorders.
 * Implements efficient batch processing and capacity-aware ordering.
 *
 * Key Features:
 * - Batch processing of low-stock products across all warehouses
 * - Capacity-aware order quantity calculation
 * - Duplicate order prevention with idempotency
 * - Async order processing via message queue
 * - Alert generation for low stock situations
 */
export class StockMonitorService {
  /**
   * Main entry point: Check all products and trigger reorders
   * This is called periodically by the scheduler
   */
  async checkAndReorderLowStock(): Promise<void> {
    try {
      logger.info('Starting stock check cycle');

      const lowStockProducts = await this.findLowStockProducts();

      if (lowStockProducts.length === 0) {
        logger.info('No low stock products found');
        return;
      }

      logger.info(
        { count: lowStockProducts.length },
        'Found low stock products'
      );

      // Process reorders in parallel with controlled concurrency
      await this.processReorders(lowStockProducts);

      logger.info('Stock check cycle completed');
    } catch (error) {
      logger.error({ error }, 'Error in stock check cycle');
      throw error;
    }
  }

  /**
   * Find all products below reorder threshold
   * Uses efficient Prisma query with filtering
   */
  private async findLowStockProducts(): Promise<LowStockProduct[]> {
    const productStocks = await prisma.productStock.findMany({
      where: {
        product: {
          isActive: true,
        },
        warehouse: {
          isActive: true,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            reorderThreshold: true,
            reorderQuantity: true,
            defaultSupplierId: true,
            leadTimeDays: true,
          },
        },
        warehouse: {
          select: {
            id: true,
          },
        },
      },
      take: 100,
    });

    // Filter for low stock and check for pending orders
    const lowStockCandidates = productStocks.filter(
      (stock) => stock.quantity <= stock.product.reorderThreshold
    );

    // Check for existing pending orders in parallel
    const lowStockWithOrderCheck = await Promise.all(
      lowStockCandidates.map(async (stock) => {
        const hasPendingOrder = await prisma.purchaseOrder.findFirst({
          where: {
            productId: stock.productId,
            warehouseId: stock.warehouseId,
            status: {
              in: ['PENDING', 'IN_TRANSIT'],
            },
          },
        });

        if (hasPendingOrder) return null;

        return {
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          currentQuantity: stock.quantity,
          reorderThreshold: stock.product.reorderThreshold,
          reorderQuantity: stock.product.reorderQuantity,
          supplierId: stock.product.defaultSupplierId,
          leadTimeDays: stock.product.leadTimeDays,
        };
      })
    );

    // Filter out nulls and sort by deficit
    const lowStock = lowStockWithOrderCheck
      .filter((item): item is LowStockProduct => item !== null)
      .sort((a, b) => {
        const deficitA = a.reorderThreshold - a.currentQuantity;
        const deficitB = b.reorderThreshold - b.currentQuantity;
        return deficitB - deficitA;
      });

    return lowStock;
  }

  /**
   * Process reorders with batch processing and capacity checks
   */
  private async processReorders(
    lowStockProducts: LowStockProduct[]
  ): Promise<void> {
    const orderPromises = lowStockProducts.map((product) =>
      this.createReorderIfNeeded(product)
    );

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < orderPromises.length; i += batchSize) {
      const batch = orderPromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
    }
  }

  /**
   * Create purchase order for a low-stock product
   * Includes capacity validation and optimal quantity calculation
   */
  private async createReorderIfNeeded(
    product: LowStockProduct
  ): Promise<void> {
    try {
      // Calculate optimal order quantity based on warehouse capacity
      const optimalQuantity = await capacityManager.calculateOptimalOrderQuantity(
        product.productId,
        product.warehouseId,
        product.reorderQuantity
      );

      if (optimalQuantity <= 0) {
        logger.warn(
          { product },
          'Cannot create order: insufficient warehouse capacity'
        );

        // Create low stock alert
        await this.createLowStockAlert(product);
        return;
      }

      // Adjust quantity if different from desired
      const adjustedQuantity =
        optimalQuantity < product.reorderQuantity
          ? optimalQuantity
          : product.reorderQuantity;

      // Publish order creation message to queue for async processing
      await rabbitmq.publish(
        'order.process',
        {
          productId: product.productId,
          warehouseId: product.warehouseId,
          supplierId: product.supplierId,
          quantity: adjustedQuantity,
          leadTimeDays: product.leadTimeDays,
          reason: 'AUTO_REORDER',
        },
        5 // High priority
      );

      logger.info(
        {
          productId: product.productId,
          warehouseId: product.warehouseId,
          quantity: adjustedQuantity,
        },
        'Reorder message published'
      );
    } catch (error) {
      logger.error({ error, product }, 'Error creating reorder');
      // Don't throw - continue processing other products
    }
  }

  /**
   * Generate unique order number with timestamp for uniqueness
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp

    return `PO-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Create purchase order in database
   * This is called by the queue consumer
   */
  async createPurchaseOrder(orderData: {
    productId: string;
    warehouseId: string;
    supplierId: string;
    quantity: number;
    leadTimeDays: number;
    reason: string;
  }): Promise<void> {
    try {
      // Double-check: prevent duplicate orders (idempotency)
      const existingOrder = await prisma.purchaseOrder.findFirst({
        where: {
          productId: orderData.productId,
          warehouseId: orderData.warehouseId,
          status: {
            in: ['PENDING', 'IN_TRANSIT'],
          },
        },
      });

      if (existingOrder) {
        logger.info(
          { orderData, existingOrderId: existingOrder.id },
          'Skipping duplicate order'
        );
        return;
      }

      // Get product price for total cost calculation
      const product = await prisma.product.findUnique({
        where: { id: orderData.productId },
        select: { unitPrice: true },
      });

      const orderDate = new Date();
      const expectedArrivalDate = new Date(orderDate);
      expectedArrivalDate.setDate(
        expectedArrivalDate.getDate() + orderData.leadTimeDays
      );

      // Create order with transaction for atomicity
      // Generate order number inside transaction to ensure uniqueness
      let orderNumber: string;
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          orderNumber = await this.generateOrderNumber();

          await prisma.$transaction(async (tx) => {
            await tx.purchaseOrder.create({
              data: {
                orderNumber,
                productId: orderData.productId,
                supplierId: orderData.supplierId,
                warehouseId: orderData.warehouseId,
                quantityOrdered: orderData.quantity,
                totalCost: (product?.unitPrice || 0) * orderData.quantity,
                status: 'PENDING',
                orderDate,
                expectedArrivalDate,
                isAutoGenerated: true,
                notes: `Automatic reorder - ${orderData.reason}`,
              },
            });
          });

          success = true;
        } catch (error: any) {
          if (error.code === 'P2002' && retries > 1) {
            // Unique constraint violation - retry with new order number
            retries--;
            logger.warn(
              { retries, orderData },
              'Order number collision, retrying...'
            );
            // Wait a bit before retry to avoid collision
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            throw error;
          }
        }
      }

      if (!success) {
        throw new Error('Failed to create purchase order after retries');
      }

      logger.info(
        { orderNumber: orderNumber!, ...orderData },
        'Purchase order created successfully'
      );
    } catch (error) {
      logger.error({ error, orderData }, 'Error creating purchase order');
      throw error;
    }
  }

  /**
   * Create low stock alert
   */
  private async createLowStockAlert(product: LowStockProduct): Promise<void> {
    const [productData, warehouseData] = await Promise.all([
      prisma.product.findUnique({
        where: { id: product.productId },
        select: { name: true, sku: true },
      }),
      prisma.warehouse.findUnique({
        where: { id: product.warehouseId },
        select: { name: true },
      }),
    ]);

    await prisma.alert.create({
      data: {
        type: 'LOW_STOCK',
        severity: 'WARNING',
        message: `Low stock: ${productData?.name} (${productData?.sku}) in ${warehouseData?.name}`,
        metadata: {
          productId: product.productId,
          warehouseId: product.warehouseId,
          currentQuantity: product.currentQuantity,
          reorderThreshold: product.reorderThreshold,
        },
      },
    });
  }

  /**
   * Process order arrival and update stock
   */
  async processOrderArrival(purchaseOrderId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Get order details
        const order = await tx.purchaseOrder.findUnique({
          where: { id: purchaseOrderId },
        });

        if (!order) {
          throw new Error(`Purchase order ${purchaseOrderId} not found`);
        }

        if (order.status === 'ARRIVED') {
          logger.info({ purchaseOrderId }, 'Order already processed');
          return;
        }

        // Update order status
        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: {
            status: 'ARRIVED',
            actualArrivalDate: new Date(),
          },
        });

        // Update product stock
        await tx.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: order.productId,
              warehouseId: order.warehouseId,
            },
          },
          create: {
            productId: order.productId,
            warehouseId: order.warehouseId,
            quantity: order.quantityOrdered,
            lastUpdated: new Date(),
          },
          update: {
            quantity: {
              increment: order.quantityOrdered,
            },
            lastUpdated: new Date(),
          },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            warehouseId: order.warehouseId,
            movementType: 'PURCHASE_ORDER_ARRIVAL',
            quantity: order.quantityOrdered,
            reference: order.orderNumber,
            performedBy: 'SYSTEM',
          },
        });
      });

      // Update warehouse stock count
      const order = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });

      if (order) {
        await capacityManager.updateWarehouseStock(order.warehouseId);
      }

      logger.info({ purchaseOrderId }, 'Order arrival processed successfully');
    } catch (error) {
      logger.error({ error, purchaseOrderId }, 'Error processing order arrival');
      throw error;
    }
  }

  /**
   * Manual stock adjustment
   */
  async adjustStock(
    productId: string,
    warehouseId: string,
    quantityChange: number,
    reason: string,
    performedBy: string
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update stock
        const stock = await tx.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId,
            },
          },
          create: {
            productId,
            warehouseId,
            quantity: Math.max(0, quantityChange),
            lastUpdated: new Date(),
          },
          update: {
            quantity: {
              increment: quantityChange,
            },
            lastUpdated: new Date(),
          },
        });

        // Ensure quantity doesn't go negative
        if (stock.quantity < 0) {
          throw new Error('Stock quantity cannot be negative');
        }

        // Record movement
        await tx.stockMovement.create({
          data: {
            productId,
            warehouseId,
            movementType: 'MANUAL_ADJUSTMENT',
            quantity: quantityChange,
            reason,
            performedBy,
          },
        });
      });

      // Update warehouse count
      await capacityManager.updateWarehouseStock(warehouseId);

      logger.info(
        { productId, warehouseId, quantityChange, reason },
        'Stock adjusted successfully'
      );
    } catch (error) {
      logger.error({ error, productId, warehouseId }, 'Error adjusting stock');
      throw error;
    }
  }
}

export const stockMonitor = new StockMonitorService();
