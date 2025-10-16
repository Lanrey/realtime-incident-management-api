import Fastify from 'fastify';
import { alertRoutes } from '../../routes/alert.routes';
import { prisma } from '../../config/database';

const buildApp = async () => {
  const app = Fastify();
  await app.register(alertRoutes, { prefix: '/api/alerts' });
  return app;
};

describe('Alert Routes Integration Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = await buildApp();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/alerts', () => {
    it('should return paginated alerts', async () => {
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toHaveLength(1);
      expect(data.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter alerts by type', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?type=LOW_STOCK',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'LOW_STOCK' }),
        })
      );
    });

    it('should filter alerts by severity', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?severity=CRITICAL',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ severity: 'CRITICAL' }),
        })
      );
    });

    it('should filter alerts by resolved status', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?isResolved=false',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isResolved: false }),
        })
      );
    });

    it('should handle pagination parameters', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(100);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?page=2&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.meta.page).toBe(2);
      expect(data.meta.limit).toBe(10);
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should handle sorting parameters', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?sortBy=severity&sortOrder=asc',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { severity: 'asc' },
        })
      );
    });

    it('should handle errors gracefully', async () => {
      (prisma.alert.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts',
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('GET /api/alerts/statistics', () => {
    it('should return alert statistics', async () => {
      (prisma.alert.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);

      (prisma.alert.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { type: 'LOW_STOCK', _count: { id: 5 } },
          { type: 'CAPACITY_WARNING', _count: { id: 3 } },
        ])
        .mockResolvedValueOnce([
          { severity: 'CRITICAL', _count: { id: 2 } },
          { severity: 'WARNING', _count: { id: 6 } },
        ]);

      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts/statistics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toEqual({
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
        recent: [],
      });
    });

    it('should handle errors in statistics endpoint', async () => {
      (prisma.alert.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts/statistics',
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('GET /api/alerts/:id', () => {
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts/1',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.id).toBe('1');
    });

    it('should return 404 when alert not found', async () => {
      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts/non-existent',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle errors in get by ID endpoint', async () => {
      (prisma.alert.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts/1',
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('POST /api/alerts/:id/resolve', () => {
    it('should resolve an alert', async () => {
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

      const response = await app.inject({
        method: 'POST',
        url: '/api/alerts/1/resolve',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.isResolved).toBe(true);
      expect(data.data.resolvedAt).toBeDefined();
    });

    it('should handle errors in resolve endpoint', async () => {
      (prisma.alert.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/alerts/1/resolve',
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    it('should delete an alert', async () => {
      (prisma.alert.delete as jest.Mock).mockResolvedValue({});

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/alerts/1',
      });

      expect(response.statusCode).toBe(204);
      expect(prisma.alert.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should handle errors in delete endpoint', async () => {
      (prisma.alert.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/alerts/1',
      });

      expect(response.statusCode).toBe(500);
    });

    it('should handle not found error when deleting non-existent alert', async () => {
      (prisma.alert.delete as jest.Mock).mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/alerts/non-existent',
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large page numbers', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(100);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?page=1000',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data).toEqual([]);
    });

    it('should handle invalid query parameters gracefully', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?page=invalid&limit=abc',
      });

      // Should use default values or handle gracefully
      expect(response.statusCode).toBeLessThan(500);
    });

    it('should handle concurrent resolve requests', async () => {
      const mockResolvedAlert = {
        id: '1',
        isResolved: true,
        resolvedAt: new Date(),
      };

      (prisma.alert.update as jest.Mock).mockResolvedValue(mockResolvedAlert);

      const requests = [
        app.inject({ method: 'POST', url: '/api/alerts/1/resolve' }),
        app.inject({ method: 'POST', url: '/api/alerts/1/resolve' }),
        app.inject({ method: 'POST', url: '/api/alerts/1/resolve' }),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should handle empty metadata in alerts', async () => {
      const mockAlert = {
        id: '1',
        type: 'SYSTEM_ERROR',
        severity: 'ERROR',
        message: 'System error occurred',
        metadata: null,
        isResolved: false,
        resolvedAt: null,
        createdAt: new Date(),
      };

      (prisma.alert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts/1',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.metadata).toBeNull();
    });

    it('should handle multiple filter combinations', async () => {
      (prisma.alert.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/alerts?type=LOW_STOCK&severity=CRITICAL&isResolved=false&page=2&limit=5',
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: 'LOW_STOCK',
            severity: 'CRITICAL',
            isResolved: false,
          },
          skip: 5,
          take: 5,
        })
      );
    });
  });
});
