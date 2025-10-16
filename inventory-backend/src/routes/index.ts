import { FastifyInstance } from 'fastify';
import { productRoutes } from './product.routes';
import { purchaseOrderRoutes } from './purchaseOrder.routes';
import { warehouseRoutes } from './warehouse.routes';
import { supplierRoutes } from './supplier.routes';
import { alertRoutes } from './alert.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // API routes
  fastify.register(productRoutes, { prefix: '/api/products' });
  fastify.register(purchaseOrderRoutes, { prefix: '/api/purchase-orders' });
  fastify.register(warehouseRoutes, { prefix: '/api/warehouses' });
  fastify.register(supplierRoutes, { prefix: '/api/suppliers' });
  fastify.register(alertRoutes, { prefix: '/api/alerts' });
}
