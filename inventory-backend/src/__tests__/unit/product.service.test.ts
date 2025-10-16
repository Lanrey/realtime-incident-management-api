import { ProductService } from '../../services/product.service';
import { prisma } from '../../config/database';
import { CacheService } from '../../config/redis';

jest.mock('../../config/redis', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  CACHE_KEYS: {
    PRODUCT: (id: string) => `product:${id}`,
  },
  CACHE_TTL: {
    PRODUCT: 3600,
  },
}));

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
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
        createdAt: new Date(),
        updatedAt: new Date(),
        defaultSupplier: {
          id: 'supplier-1',
          name: 'Test Supplier',
        },
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.createProduct({
        sku: 'SKU001',
        name: 'Test Product',
        description: 'Test description',
        unitPrice: 100,
        reorderThreshold: 10,
        reorderQuantity: 50,
        leadTimeDays: 7,
        defaultSupplierId: 'supplier-1',
      });

      expect(result).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          sku: 'SKU001',
          name: 'Test Product',
          description: 'Test description',
          unitPrice: 100,
          reorderThreshold: 10,
          reorderQuantity: 50,
          leadTimeDays: 7,
          defaultSupplierId: 'supplier-1',
        },
        include: {
          defaultSupplier: true,
        },
      });
    });
  });

  describe('getProducts', () => {
    it('should return paginated products with default parameters', async () => {
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

      const result = await productService.getProducts({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter products by search term', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await productService.getProducts({
        page: 1,
        limit: 20,
        search: 'laptop',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'laptop', mode: 'insensitive' } },
            { sku: { contains: 'laptop', mode: 'insensitive' } },
            { description: { contains: 'laptop', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter products by supplier', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await productService.getProducts({
        page: 1,
        limit: 20,
        supplierId: 'supplier-1',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          defaultSupplierId: 'supplier-1',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter products by active status', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await productService.getProducts({
        page: 1,
        limit: 20,
        isActive: true,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should handle pagination correctly', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(100);

      const result = await productService.getProducts({
        page: 3,
        limit: 25,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 25,
        total: 100,
        totalPages: 4,
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 50,
        take: 25,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getProductById', () => {
    it('should return cached product if available', async () => {
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Test Product',
      };

      (CacheService.get as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(CacheService.get).toHaveBeenCalledWith('product:1');
      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Test Product',
      };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(CacheService.get).toHaveBeenCalledWith('product:1');
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
      expect(CacheService.set).toHaveBeenCalledWith('product:1', mockProduct, 3600);
    });

    it('should return null for non-existent product', async () => {
      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await productService.getProductById('non-existent');

      expect(result).toBeNull();
      expect(CacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('getProductStock', () => {
    it('should return stock information for a product', async () => {
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
            capacity: 1000,
            currentStock: 500,
          },
          product: {
            id: 'product-1',
            sku: 'SKU001',
            name: 'Test Product',
            reorderThreshold: 10,
          },
        },
        {
          id: '2',
          productId: 'product-1',
          warehouseId: 'warehouse-2',
          quantity: 30,
          warehouse: {
            id: 'warehouse-2',
            name: 'Secondary Warehouse',
            location: 'Boston',
            capacity: 500,
            currentStock: 200,
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

      const result = await productService.getProductStock('product-1');

      expect(result).toEqual({
        productId: 'product-1',
        totalStock: 80,
        stockByWarehouse: mockStockRecords,
      });
    });

    it('should return zero total stock when no records exist', async () => {
      (prisma.productStock.findMany as jest.Mock).mockResolvedValue([]);

      const result = await productService.getProductStock('product-1');

      expect(result).toEqual({
        productId: 'product-1',
        totalStock: 0,
        stockByWarehouse: [],
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product and invalidate cache', async () => {
      const mockUpdatedProduct = {
        id: '1',
        sku: 'SKU001',
        name: 'Updated Product',
        unitPrice: 150,
      };

      (prisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      const result = await productService.updateProduct('1', {
        name: 'Updated Product',
        unitPrice: 150,
      });

      expect(result).toEqual(mockUpdatedProduct);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Product',
          unitPrice: 150,
        },
        include: {
          defaultSupplier: true,
        },
      });
      expect(CacheService.del).toHaveBeenCalledWith('product:1');
    });
  });

  describe('deleteProduct', () => {
    it('should throw error when product has pending orders', async () => {
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(2);

      await expect(productService.deleteProduct('1')).rejects.toThrow(
        'Cannot delete product with pending orders'
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('should soft delete product when no pending orders', async () => {
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);
      (prisma.product.update as jest.Mock).mockResolvedValue({});

      await productService.deleteProduct('1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
      expect(CacheService.del).toHaveBeenCalledWith('product:1');
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products sorted by deficit', async () => {
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
        {
          productId: 'product-2',
          warehouseId: 'warehouse-1',
          quantity: 18,
          product: {
            id: 'product-2',
            sku: 'SKU002',
            name: 'Product B',
            reorderThreshold: 20,
          },
          warehouse: {
            id: 'warehouse-1',
            name: 'Main Warehouse',
          },
        },
        {
          productId: 'product-3',
          warehouseId: 'warehouse-1',
          quantity: 50,
          product: {
            id: 'product-3',
            sku: 'SKU003',
            name: 'Product C',
            reorderThreshold: 20,
          },
          warehouse: {
            id: 'warehouse-1',
            name: 'Main Warehouse',
          },
        },
      ];

      (prisma.productStock.findMany as jest.Mock).mockResolvedValue(mockStockRecords);

      const result = await productService.getLowStockProducts();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        productId: 'product-1',
        sku: 'SKU001',
        name: 'Product A',
        reorderThreshold: 20,
        warehouseId: 'warehouse-1',
        warehouseName: 'Main Warehouse',
        currentQuantity: 5,
        deficit: 15,
      });
      expect(result[1]).toEqual({
        productId: 'product-2',
        sku: 'SKU002',
        name: 'Product B',
        reorderThreshold: 20,
        warehouseId: 'warehouse-1',
        warehouseName: 'Main Warehouse',
        currentQuantity: 18,
        deficit: 2,
      });
      // Product C should not be in results (quantity > threshold)
    });

    it('should filter by warehouse when warehouseId is provided', async () => {
      (prisma.productStock.findMany as jest.Mock).mockResolvedValue([]);

      await productService.getLowStockProducts('warehouse-1');

      expect(prisma.productStock.findMany).toHaveBeenCalledWith({
        where: {
          warehouseId: 'warehouse-1',
          product: {
            isActive: true,
          },
        },
        include: expect.any(Object),
      });
    });

    it('should return empty array when no low stock products', async () => {
      const mockStockRecords = [
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 100,
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

      const result = await productService.getLowStockProducts();

      expect(result).toEqual([]);
    });

    it('should include products at exactly reorder threshold', async () => {
      const mockStockRecords = [
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 20,
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

      const result = await productService.getLowStockProducts();

      expect(result).toHaveLength(1);
      expect(result[0].deficit).toBe(0);
    });
  });
});
