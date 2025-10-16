import { prisma } from '../config/database';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
  QuerySuppliersInput,
} from '../schemas/supplier.schema';

export class SupplierService {
  async createSupplier(data: CreateSupplierInput) {
    const supplier = await prisma.supplier.create({
      data,
    });

    logger.info({ supplierId: supplier.id }, 'Supplier created');
    return supplier;
  }

  async getSuppliers(query: QuerySuppliersInput) {
    const { page, limit, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      ...(isActive !== undefined && { isActive }),
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              products: true,
              purchaseOrders: true,
            },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSupplierById(id: string) {
    const cacheKey = CACHE_KEYS.SUPPLIER(id);
    let supplier = await CacheService.get(cacheKey);

    if (!supplier) {
      supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          products: {
            select: {
              id: true,
              sku: true,
              name: true,
              unitPrice: true,
            },
          },
          _count: {
            select: {
              purchaseOrders: true,
            },
          },
        },
      });

      if (supplier) {
        await CacheService.set(cacheKey, supplier, CACHE_TTL.SUPPLIER);
      }
    }

    return supplier;
  }

  async updateSupplier(id: string, data: UpdateSupplierInput) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.SUPPLIER(id));

    logger.info({ supplierId: id }, 'Supplier updated');
    return supplier;
  }

  async deleteSupplier(id: string) {
    // Check if supplier has products
    const productCount = await prisma.product.count({
      where: {
        defaultSupplierId: id,
        isActive: true,
      },
    });

    if (productCount > 0) {
      throw new Error('Cannot delete supplier with active products');
    }

    // Check if supplier has pending orders
    const pendingOrders = await prisma.purchaseOrder.count({
      where: {
        supplierId: id,
        status: {
          in: ['PENDING', 'IN_TRANSIT'],
        },
      },
    });

    if (pendingOrders > 0) {
      throw new Error('Cannot delete supplier with pending orders');
    }

    // Soft delete
    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.SUPPLIER(id));

    logger.info({ supplierId: id }, 'Supplier deleted (soft)');
  }

  async getSupplierStatistics(id: string) {
    const [totalProducts, totalOrders, pendingOrders, totalValue] = await Promise.all([
      prisma.product.count({
        where: {
          defaultSupplierId: id,
          isActive: true,
        },
      }),
      prisma.purchaseOrder.count({
        where: { supplierId: id },
      }),
      prisma.purchaseOrder.count({
        where: {
          supplierId: id,
          status: {
            in: ['PENDING', 'IN_TRANSIT'],
          },
        },
      }),
      prisma.purchaseOrder.aggregate({
        where: {
          supplierId: id,
          status: { not: 'CANCELLED' },
        },
        _sum: { totalCost: true },
      }),
    ]);

    return {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalValue: totalValue._sum.totalCost || 0,
    };
  }
}

export const supplierService = new SupplierService();
