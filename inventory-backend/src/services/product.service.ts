import { prisma } from '../config/database';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { appEvents } from '../utils/eventEmitter';
import { Prisma } from '@prisma/client';
import type {
  CreateProductInput,
  UpdateProductInput,
  QueryProductsInput,
} from '../schemas/product.schema';

export class ProductService {
  async createProduct(data: CreateProductInput) {
    const product = await prisma.product.create({
      data,
      include: {
        defaultSupplier: true,
      },
    });

    logger.info({ productId: product.id }, 'Product created');

    // Emit SSE event for product creation
    appEvents.emitProductCreated({
      id: product.id,
      sku: product.sku,
      name: product.name,
      reorderThreshold: product.reorderThreshold,
    });

    return product;
  }

  async getProducts(query: QueryProductsInput) {
    const { page, limit, search, supplierId, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(supplierId && { defaultSupplierId: supplierId }),
      ...(isActive !== undefined && { isActive }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          defaultSupplier: {
            select: {
              id: true,
              name: true,
              contactEmail: true,
            },
          },
          _count: {
            select: { stockRecords: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string) {
    // Try cache first
    const cacheKey = CACHE_KEYS.PRODUCT(id);
    let product = await CacheService.get(cacheKey);

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id },
        include: {
          defaultSupplier: true,
          stockRecords: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
        },
      });

      if (product) {
        await CacheService.set(cacheKey, product, CACHE_TTL.PRODUCT);
      }
    }

    return product;
  }

  async getProductStock(productId: string) {
    const stockRecords = await prisma.productStock.findMany({
      where: { productId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
            capacity: true,
            currentStock: true,
          },
        },
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            reorderThreshold: true,
          },
        },
      },
    });

    // Calculate total stock
    const totalStock = stockRecords.reduce((sum, record) => sum + record.quantity, 0);

    return {
      productId,
      totalStock,
      stockByWarehouse: stockRecords,
    };
  }

  async updateProduct(id: string, data: UpdateProductInput) {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        defaultSupplier: true,
      },
    });

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.PRODUCT(id));

    logger.info({ productId: id }, 'Product updated');
    return product;
  }

  async deleteProduct(id: string) {
    // Check if product has pending orders
    const pendingOrders = await prisma.purchaseOrder.count({
      where: {
        productId: id,
        status: {
          in: ['PENDING', 'IN_TRANSIT'],
        },
      },
    });

    if (pendingOrders > 0) {
      throw new Error('Cannot delete product with pending orders');
    }

    // Soft delete by marking as inactive
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.PRODUCT(id));

    logger.info({ productId: id }, 'Product deleted (soft)');
  }

  async getLowStockProducts(warehouseId?: string) {
    const productStocks = await prisma.productStock.findMany({
      where: {
        ...(warehouseId && { warehouseId }),
        product: {
          isActive: true,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            reorderThreshold: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter low stock products and calculate deficit
    const lowStockProducts = productStocks
      .filter((stock) => stock.quantity <= stock.product.reorderThreshold)
      .map((stock) => ({
        productId: stock.product.id,
        sku: stock.product.sku,
        name: stock.product.name,
        reorderThreshold: stock.product.reorderThreshold,
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse.name,
        currentQuantity: stock.quantity,
        deficit: stock.product.reorderThreshold - stock.quantity,
      }))
      .sort((a, b) => b.deficit - a.deficit);

    return lowStockProducts;
  }
}

export const productService = new ProductService();
