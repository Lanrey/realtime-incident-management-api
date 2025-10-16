import Fastify from 'fastify';
import { productRoutes } from '../../routes/product.routes';
import { prisma } from '../../config/database';
import { CacheService } from '../../config/redis';

jest.mock('../../config/redis');

const buildApp = async () => {
  const app = Fastify();
  await app.register(productRoutes, { prefix: '/api/products' });
  return app;
};

describe('Product Routes Integration Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = await buildApp();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'SKU001',
          name: 'Test Product',
          isActive: true,
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toHaveLength(1);
      expect(data.meta).toBeDefined();
    });

    it('should filter products by search term', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?search=laptop',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'laptop', mode: 'insensitive' } },
              { sku: { contains: 'laptop', mode: 'insensitive' } },
              { description: { contains: 'laptop', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should filter products by supplier', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?supplierId=supplier-1',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            defaultSupplierId: 'supplier-1',
          }),
        })
      );
    });

    it('should filter products by active status', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?isActive=true',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(100);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?page=3&limit=25',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.meta.page).toBe(3);
      expect(data.meta.limit).toBe(25);
    });

    it('should handle errors gracefully', async () => {
      (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Test Product',
        description: 'Test description',
        unitPrice: 100,
        reorderThreshold: 10,
        reorderQuantity: 50,
        leadTimeDays: 7,
        defaultSupplierId: 'supplier-1',
        isActive: true,
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          sku: 'SKU001',
          name: 'Test Product',
          description: 'Test description',
          unitPrice: 100,
          reorderThreshold: 10,
          reorderQuantity: 50,
          leadTimeDays: 7,
          defaultSupplierId: 'supplier-1',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.data.sku).toBe('SKU001');
    });

    it('should handle duplicate SKU error', async () => {
      (prisma.product.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['sku'] },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          sku: 'SKU001',
          name: 'Test Product',
          unitPrice: 100,
          reorderThreshold: 10,
          reorderQuantity: 50,
          leadTimeDays: 7,
          defaultSupplierId: 'supplier-1',
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Test Product',
          // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate unitPrice is positive', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          sku: 'SKU001',
          name: 'Test Product',
          unitPrice: -10,
          reorderThreshold: 10,
          reorderQuantity: 50,
          leadTimeDays: 7,
          defaultSupplierId: 'supplier-1',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product from cache', async () => {
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Test Product',
      };

      (CacheService.get as jest.Mock).mockResolvedValue(mockProduct);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/1',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.id).toBe('1');
      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch product from database if not cached', async () => {
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Test Product',
      };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/1',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        })
      );
      expect(CacheService.set).toHaveBeenCalled();
    });

    it('should return 404 for non-existent product', async () => {
      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/non-existent',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/products/:id/stock', () => {
    it('should return product stock information', async () => {
      const mockStockRecords = [
        {
          id: '1',
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 50,
          warehouse: {
            id: 'warehouse-1',
            name: 'Main Warehouse',
            location: 'New York',
          },
          product: {
            id: 'product-1',
            sku: 'SKU001',
            name: 'Test Product',
            reorderThreshold: 10,
          },
        },
      ];

      (prisma.productStock.findMany as jest.Mock).mockResolvedValue(mockStockRecords);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/product-1/stock',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.totalStock).toBe(50);
      expect(data.data.stockByWarehouse).toHaveLength(1);
    });

    it('should return zero stock when no records exist', async () => {
      (prisma.productStock.findMany as jest.Mock).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/product-1/stock',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.totalStock).toBe(0);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product and invalidate cache', async () => {
      const mockUpdatedProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Updated Product',
        unitPrice: 150,
      };

      (prisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/products/1',
        payload: {
          name: 'Updated Product',
          unitPrice: 150,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.name).toBe('Updated Product');
      expect(CacheService.del).toHaveBeenCalledWith('product:1');
    });

    it('should handle not found error', async () => {
      (prisma.product.update as jest.Mock).mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      const response = await app.inject({
        method: 'PUT',
        url: '/api/products/non-existent',
        payload: {
          name: 'Updated Product',
        },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should soft delete product when no pending orders', async () => {
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);
      (prisma.product.update as jest.Mock).mockResolvedValue({});

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/products/1',
      });

      expect(response.statusCode).toBe(204);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
      expect(CacheService.del).toHaveBeenCalledWith('product:1');
    });

    it('should reject delete when product has pending orders', async () => {
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(2);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/products/1',
      });

      expect(response.statusCode).toBe(400);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/products/low-stock', () => {
    it('should return low stock products', async () => {
      const mockStockRecords = [
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 5,
          product: {
            id: 'product-1',
            sku: 'SKU001',
            name: 'Product A',
            reorderThreshold: 20,
          },
          warehouse: {
            id: 'warehouse-1',
            name: 'Main Warehouse',
          },
        },
      ];

      (prisma.productStock.findMany as jest.Mock).mockResolvedValue(mockStockRecords);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/low-stock',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].deficit).toBe(15);
    });

    it('should filter low stock by warehouse', async () => {
      (prisma.productStock.findMany as jest.Mock).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/low-stock?warehouseId=warehouse-1',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.productStock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            warehouseId: 'warehouse-1',
          }),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long product names', async () => {
      const longName = 'A'.repeat(500);
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: longName,
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          sku: 'SKU001',
          name: longName,
          unitPrice: 100,
          reorderThreshold: 10,
          reorderQuantity: 50,
          leadTimeDays: 7,
          defaultSupplierId: 'supplier-1',
        },
      });

      expect(response.statusCode).toBeLessThan(500);
    });

    it('should handle special characters in search', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?search=' + encodeURIComponent('test@#$%'),
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle zero values for thresholds', async () => {
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Test Product',
        reorderThreshold: 0,
        reorderQuantity: 0,
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          sku: 'SKU001',
          name: 'Test Product',
          unitPrice: 100,
          reorderThreshold: 0,
          reorderQuantity: 0,
          leadTimeDays: 7,
          defaultSupplierId: 'supplier-1',
        },
      });

      expect(response.statusCode).toBeLessThan(500);
    });

    it('should handle concurrent updates to same product', async () => {
      (prisma.product.update as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Updated',
      });

      const requests = [
        app.inject({
          method: 'PUT',
          url: '/api/products/1',
          payload: { name: 'Update 1' },
        }),
        app.inject({
          method: 'PUT',
          url: '/api/products/1',
          payload: { name: 'Update 2' },
        }),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle products with no default supplier', async () => {
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Test Product',
        defaultSupplierId: null,
      };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/1',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.defaultSupplierId).toBeNull();
    });
  });
});
