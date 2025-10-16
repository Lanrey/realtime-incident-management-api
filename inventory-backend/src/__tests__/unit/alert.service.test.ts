import { AlertService } from '../../services/alert.service';
import { prisma } from '../../config/database';
import { appEvents } from '../../utils/eventEmitter';

describe('AlertService', () => {
  let alertService: AlertService;

  beforeEach(() => {
    alertService = new AlertService();
    jest.clearAllMocks();
  });

  describe('getAlerts', () => {
    it('should return paginated alerts with default parameters', async () => {
      const mockAlerts = [
        {
          id: '1',
          type: 'LOW_STOCK',
          severity: 'WARNING',
          message: 'Product low in stock',
          metadata: {},
          isResolved: false,
          resolvedAt: null,
          createdAt: new Date(),
        },
      ];

      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);
      (prisma.alert.count as jest.Mock).mockResolvedValue(1);

      const result = await alertService.getAlerts({});

      expect(result.alerts).toEqual(mockAlerts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter alerts by type', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      await alertService.getAlerts({ type: 'LOW_STOCK' });

      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: { type: 'LOW_STOCK' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter alerts by severity', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      await alertService.getAlerts({ severity: 'CRITICAL' });

      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: { severity: 'CRITICAL' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter alerts by resolved status', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      await alertService.getAlerts({ isResolved: false });

      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: { isResolved: false },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle pagination correctly', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(50);

      const result = await alertService.getAlerts({ page: 2, limit: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle custom sorting', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      await alertService.getAlerts({ sortBy: 'severity', sortOrder: 'asc' });

      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { severity: 'asc' },
      });
    });

    it('should combine multiple filters', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      await alertService.getAlerts({
        type: 'LOW_STOCK',
        severity: 'CRITICAL',
        isResolved: false,
      });

      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          type: 'LOW_STOCK',
          severity: 'CRITICAL',
          isResolved: false,
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getAlertById', () => {
    it('should return alert by ID', async () => {
      const mockAlert = {
        id: '1',
        type: 'LOW_STOCK',
        severity: 'WARNING',
        message: 'Product low in stock',
        metadata: {},
        isResolved: false,
        resolvedAt: null,
        createdAt: new Date(),
      };

      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const result = await alertService.getAlertById('1');

      expect(result).toEqual(mockAlert);
      expect(prisma.alert.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null for non-existent alert', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await alertService.getAlertById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAlertStatistics', () => {
    it('should return comprehensive alert statistics', async () => {
      const mockAlertsByType = [
        { type: 'LOW_STOCK', _count: { id: 5 } },
        { type: 'CAPACITY_WARNING', _count: { id: 3 } },
      ];

      const mockAlertsBySeverity = [
        { severity: 'CRITICAL', _count: { id: 2 } },
        { severity: 'WARNING', _count: { id: 6 } },
      ];

      const mockRecentAlerts = [
        {
          id: '1',
          type: 'LOW_STOCK',
          severity: 'CRITICAL',
          message: 'Critical alert',
          metadata: {},
          isResolved: false,
          resolvedAt: null,
          createdAt: new Date(),
        },
      ];

      (prisma.alert.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8) // unresolved
        .mockResolvedValueOnce(2); // critical

      (prisma.alert.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockAlertsByType)
        .mockResolvedValueOnce(mockAlertsBySeverity);

      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockRecentAlerts);

      const result = await alertService.getAlertStatistics();

      expect(result).toEqual({
        total: 10,
        unresolved: 8,
        critical: 2,
        byType: {
          LOW_STOCK: 5,
          CAPACITY_WARNING: 3,
        },
        bySeverity: {
          CRITICAL: 2,
          WARNING: 6,
        },
        recent: mockRecentAlerts,
      });
    });

    it('should handle empty statistics', async () => {
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);
      (prisma.alert.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);

      const result = await alertService.getAlertStatistics();

      expect(result).toEqual({
        total: 0,
        unresolved: 0,
        critical: 0,
        byType: {},
        bySeverity: {},
        recent: [],
      });
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert by ID', async () => {
      const mockResolvedAlert = {
        id: '1',
        type: 'LOW_STOCK',
        severity: 'WARNING',
        message: 'Product low in stock',
        metadata: {},
        isResolved: true,
        resolvedAt: new Date(),
        createdAt: new Date(),
      };

      (prisma.alert.update as jest.Mock).mockResolvedValue(mockResolvedAlert);

      const result = await alertService.resolveAlert('1');

      expect(result.isResolved).toBe(true);
      expect(result.resolvedAt).toBeDefined();
      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isResolved: true,
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('should emit alert resolved event via SSE', async () => {
      const mockResolvedAlert = {
        id: '1',
        type: 'LOW_STOCK',
        severity: 'WARNING',
        message: 'Product low in stock',
        metadata: {},
        isResolved: true,
        resolvedAt: new Date(),
        createdAt: new Date(),
      };

      (prisma.alert.update as jest.Mock).mockResolvedValue(mockResolvedAlert);

      await alertService.resolveAlert('1');

      expect(appEvents.emitAlertResolved).toHaveBeenCalledWith({
        id: '1',
        type: 'LOW_STOCK',
      });
    });
  });

  describe('resolveAlertsByType', () => {
    it('should resolve multiple alerts by type', async () => {
      (prisma.alert.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await alertService.resolveAlertsByType('LOW_STOCK');

      expect(result.count).toBe(5);
      expect(prisma.alert.updateMany).toHaveBeenCalledWith({
        where: {
          type: 'LOW_STOCK',
          isResolved: false,
        },
        data: {
          isResolved: true,
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('should resolve alerts by type with metadata filter', async () => {
      const metadata = { productId: 'product-1' };
      (prisma.alert.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      await alertService.resolveAlertsByType('LOW_STOCK', metadata);

      expect(prisma.alert.updateMany).toHaveBeenCalledWith({
        where: {
          type: 'LOW_STOCK',
          isResolved: false,
          metadata: { path: ['productId'], equals: metadata },
        },
        data: {
          isResolved: true,
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('should return zero count when no alerts match', async () => {
      (prisma.alert.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await alertService.resolveAlertsByType('NON_EXISTENT_TYPE');

      expect(result.count).toBe(0);
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert by ID', async () => {
      (prisma.alert.delete as jest.Mock).mockResolvedValue({});

      await alertService.deleteAlert('1');

      expect(prisma.alert.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getAlertsByProduct', () => {
    it('should return unresolved alerts for a product', async () => {
      const mockAlerts = [
        {
          id: '1',
          type: 'LOW_STOCK',
          severity: 'WARNING',
          message: 'Product low in stock',
          metadata: { productId: 'product-1' },
          isResolved: false,
          resolvedAt: null,
          createdAt: new Date(),
        },
      ];

      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const result = await alertService.getAlertsByProduct('product-1');

      expect(result).toEqual(mockAlerts);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ metadata: { path: ['productId'], equals: 'product-1' } }],
          isResolved: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no alerts found', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);

      const result = await alertService.getAlertsByProduct('product-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAlertsByWarehouse', () => {
    it('should return unresolved alerts for a warehouse', async () => {
      const mockAlerts = [
        {
          id: '1',
          type: 'CAPACITY_WARNING',
          severity: 'WARNING',
          message: 'Warehouse capacity warning',
          metadata: { warehouseId: 'warehouse-1' },
          isResolved: false,
          resolvedAt: null,
          createdAt: new Date(),
        },
      ];

      (prisma.alert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const result = await alertService.getAlertsByWarehouse('warehouse-1');

      expect(result).toEqual(mockAlerts);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ metadata: { path: ['warehouseId'], equals: 'warehouse-1' } }],
          isResolved: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no alerts found', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);

      const result = await alertService.getAlertsByWarehouse('warehouse-1');

      expect(result).toEqual([]);
    });
  });
});
