import { prisma } from '../config/database';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';

export interface CapacityCheck {
  hasCapacity: boolean;
  availableSpace: number;
  currentStock: number;
  maxCapacity: number;
  utilizationPercentage: number;
  recommendedQuantity?: number;
}

/**
 * CapacityManagerService
 *
 * Handles warehouse capacity management with caching for high-performance.
 * Ensures orders don't exceed warehouse capacity limits.
 */
export class CapacityManagerService {
  /**
   * Check if warehouse has capacity for additional items
   * Uses Redis caching for performance optimization
   */
  async checkWarehouseCapacity(
    warehouseId: string,
    additionalQuantity: number
  ): Promise<CapacityCheck> {
    try {
      // Try to get from cache first
      const cacheKey = CACHE_KEYS.WAREHOUSE_CAPACITY(warehouseId);
      let warehouse = await CacheService.get<any>(cacheKey);

      if (!warehouse) {
        // Cache miss - fetch from database
        warehouse = await prisma.warehouse.findUnique({
          where: { id: warehouseId },
          select: {
            id: true,
            capacity: true,
            currentStock: true,
            name: true,
          },
        });

        if (!warehouse) {
          throw new Error(`Warehouse ${warehouseId} not found`);
        }

        // Cache for future requests
        await CacheService.set(cacheKey, warehouse, CACHE_TTL.WAREHOUSE);
      }

      // Consider pending orders that will arrive soon
      const pendingOrdersTotal = await this.getPendingOrdersQuantity(warehouseId);

      const projectedStock = warehouse.currentStock + pendingOrdersTotal;
      const availableSpace = warehouse.capacity - projectedStock;
      const hasCapacity = availableSpace >= additionalQuantity;
      const utilizationPercentage = (projectedStock / warehouse.capacity) * 100;

      const result: CapacityCheck = {
        hasCapacity,
        availableSpace,
        currentStock: warehouse.currentStock,
        maxCapacity: warehouse.capacity,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      };

      // If not enough space, suggest adjusted quantity
      if (!hasCapacity && availableSpace > 0) {
        result.recommendedQuantity = availableSpace;
      }

      return result;
    } catch (error) {
      logger.error({ error, warehouseId }, 'Error checking warehouse capacity');
      throw error;
    }
  }

  /**
   * Calculate optimal order quantity considering capacity constraints
   */
  async calculateOptimalOrderQuantity(
    productId: string,
    warehouseId: string,
    desiredQuantity: number
  ): Promise<number> {
    try {
      const capacityCheck = await this.checkWarehouseCapacity(
        warehouseId,
        desiredQuantity
      );

      if (capacityCheck.hasCapacity) {
        return desiredQuantity;
      }

      // If no capacity available at all
      if (capacityCheck.availableSpace <= 0) {
        logger.warn(
          { productId, warehouseId, capacityCheck },
          'Warehouse at full capacity'
        );

        // Create alert
        await this.createCapacityAlert(warehouseId, 'CAPACITY_EXCEEDED');

        return 0;
      }

      // Warn if utilization is high
      if (capacityCheck.utilizationPercentage >= 90) {
        await this.createCapacityAlert(warehouseId, 'CAPACITY_WARNING');
      }

      // Return adjusted quantity
      return capacityCheck.recommendedQuantity || 0;
    } catch (error) {
      logger.error({ error, productId, warehouseId }, 'Error calculating optimal quantity');
      throw error;
    }
  }

  /**
   * Get total quantity from pending orders for a warehouse
   */
  private async getPendingOrdersQuantity(warehouseId: string): Promise<number> {
    const result = await prisma.purchaseOrder.aggregate({
      where: {
        warehouseId,
        status: {
          in: ['PENDING', 'IN_TRANSIT'],
        },
      },
      _sum: {
        quantityOrdered: true,
      },
    });

    return result._sum.quantityOrdered || 0;
  }

  /**
   * Update warehouse current stock count
   * Called after stock movements
   */
  async updateWarehouseStock(warehouseId: string): Promise<void> {
    try {
      const totalStock = await prisma.productStock.aggregate({
        where: { warehouseId },
        _sum: { quantity: true },
      });

      await prisma.warehouse.update({
        where: { id: warehouseId },
        data: { currentStock: totalStock._sum.quantity || 0 },
      });

      // Invalidate cache
      await CacheService.del(CACHE_KEYS.WAREHOUSE_CAPACITY(warehouseId));

      logger.info({ warehouseId, totalStock: totalStock._sum.quantity }, 'Warehouse stock updated');
    } catch (error) {
      logger.error({ error, warehouseId }, 'Error updating warehouse stock');
      throw error;
    }
  }

  /**
   * Create capacity alert
   */
  private async createCapacityAlert(
    warehouseId: string,
    alertType: 'CAPACITY_WARNING' | 'CAPACITY_EXCEEDED'
  ): Promise<void> {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) return;

    const severity = alertType === 'CAPACITY_EXCEEDED' ? 'CRITICAL' : 'WARNING';
    const message =
      alertType === 'CAPACITY_EXCEEDED'
        ? `Warehouse ${warehouse.name} has reached maximum capacity`
        : `Warehouse ${warehouse.name} is at ${((warehouse.currentStock / warehouse.capacity) * 100).toFixed(1)}% capacity`;

    await prisma.alert.create({
      data: {
        type: alertType,
        severity,
        message,
        metadata: {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          currentStock: warehouse.currentStock,
          capacity: warehouse.capacity,
        },
      },
    });

    logger.warn({ warehouseId, alertType }, 'Capacity alert created');
  }

  /**
   * Get warehouse utilization report
   */
  async getWarehouseUtilization(warehouseId: string): Promise<any> {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        productStocks: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
          orderBy: { quantity: 'desc' },
          take: 10, // Top 10 products by quantity
        },
      },
    });

    if (!warehouse) {
      throw new Error(`Warehouse ${warehouseId} not found`);
    }

    const pendingQuantity = await this.getPendingOrdersQuantity(warehouseId);
    const utilizationPercentage = (warehouse.currentStock / warehouse.capacity) * 100;

    return {
      warehouseId: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      currentStock: warehouse.currentStock,
      pendingStock: pendingQuantity,
      availableSpace: warehouse.capacity - warehouse.currentStock - pendingQuantity,
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      topProducts: warehouse.productStocks,
    };
  }
}

export const capacityManager = new CapacityManagerService();
