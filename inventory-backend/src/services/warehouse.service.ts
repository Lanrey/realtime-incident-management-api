import { prisma } from '../config/database';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  QueryWarehousesInput,
} from '../schemas/warehouse.schema';

export class WarehouseService {
  async createWarehouse(data: CreateWarehouseInput) {
    const warehouse = await prisma.warehouse.create({
      data,
    });

    logger.info({ warehouseId: warehouse.id }, 'Warehouse created');
    return warehouse;
  }

  async getWarehouses(query: QueryWarehousesInput) {
    const { page, limit, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WarehouseWhereInput = {
      ...(isActive !== undefined && { isActive }),
    };

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              productStocks: true,
              purchaseOrders: true,
            },
          },
        },
      }),
      prisma.warehouse.count({ where }),
    ]);

    // Add utilization percentage
    const warehousesWithUtilization = warehouses.map((w) => ({
      ...w,
      utilizationPercentage:
        w.capacity > 0 ? Math.round((w.currentStock / w.capacity) * 10000) / 100 : 0,
    }));

    return {
      warehouses: warehousesWithUtilization,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWarehouseById(id: string) {
    const cacheKey = CACHE_KEYS.WAREHOUSE(id);
    let warehouse = await CacheService.get(cacheKey);

    if (!warehouse) {
      warehouse = await prisma.warehouse.findUnique({
        where: { id },
        include: {
          productStocks: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  reorderThreshold: true,
                },
              },
            },
            orderBy: {
              quantity: 'desc',
            },
          },
          _count: {
            select: {
              purchaseOrders: true,
            },
          },
        },
      });

      if (warehouse) {
        await CacheService.set(cacheKey, warehouse, CACHE_TTL.WAREHOUSE);
      }
    }

    if (warehouse) {
      const utilizationPercentage =
        warehouse.capacity > 0
          ? Math.round((warehouse.currentStock / warehouse.capacity) * 10000) / 100
          : 0;

      return {
        ...warehouse,
        utilizationPercentage,
      };
    }

    return null;
  }

  async updateWarehouse(id: string, data: UpdateWarehouseInput) {
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.WAREHOUSE(id));
    await CacheService.del(CACHE_KEYS.WAREHOUSE_CAPACITY(id));

    logger.info({ warehouseId: id }, 'Warehouse updated');
    return warehouse;
  }

  async deleteWarehouse(id: string) {
    // Check if warehouse has stock
    const stockCount = await prisma.productStock.count({
      where: {
        warehouseId: id,
        quantity: {
          gt: 0,
        },
      },
    });

    if (stockCount > 0) {
      throw new Error('Cannot delete warehouse with existing stock');
    }

    // Check if warehouse has pending orders
    const pendingOrders = await prisma.purchaseOrder.count({
      where: {
        warehouseId: id,
        status: {
          in: ['PENDING', 'IN_TRANSIT'],
        },
      },
    });

    if (pendingOrders > 0) {
      throw new Error('Cannot delete warehouse with pending orders');
    }

    // Soft delete
    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.WAREHOUSE(id));
    await CacheService.del(CACHE_KEYS.WAREHOUSE_CAPACITY(id));

    logger.info({ warehouseId: id }, 'Warehouse deleted (soft)');
  }

  async getWarehouseProducts(id: string) {
    const products = await prisma.productStock.findMany({
      where: { warehouseId: id },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
            reorderThreshold: true,
            unitPrice: true,
          },
        },
      },
      orderBy: {
        quantity: 'desc',
      },
    });

    return products;
  }

  async getWarehouseStatistics() {
    const [totalWarehouses, totalCapacity, totalStock, warehouses] =
      await Promise.all([
        prisma.warehouse.count({ where: { isActive: true } }),
        prisma.warehouse.aggregate({
          where: { isActive: true },
          _sum: { capacity: true },
        }),
        prisma.warehouse.aggregate({
          where: { isActive: true },
          _sum: { currentStock: true },
        }),
        prisma.warehouse.findMany({
          where: {
            isActive: true,
            capacity: { gt: 0 },
          },
          select: {
            currentStock: true,
            capacity: true,
          },
        }),
      ]);

    // Calculate average utilization
    const avgUtilization = warehouses.length > 0
      ? warehouses.reduce((sum, w) => sum + (w.currentStock / w.capacity) * 100, 0) / warehouses.length
      : 0;

    return {
      totalWarehouses,
      totalCapacity: totalCapacity._sum.capacity || 0,
      totalStock: totalStock._sum.currentStock || 0,
      averageUtilization: Math.round(avgUtilization * 100) / 100,
    };
  }
}

export const warehouseService = new WarehouseService();
