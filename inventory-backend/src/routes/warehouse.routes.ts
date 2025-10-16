import { FastifyInstance } from 'fastify';
import { warehouseController } from '../controllers/warehouse.controller';

export async function warehouseRoutes(fastify: FastifyInstance) {
  // Get all warehouses with pagination
  fastify.get(
    '/',
    warehouseController.getWarehouses.bind(warehouseController)
  );

  // Get warehouse statistics
  fastify.get(
    '/statistics',
    warehouseController.getStatistics.bind(warehouseController)
  );

  // Get warehouse by ID
  fastify.get('/:id', warehouseController.getWarehouseById.bind(warehouseController));

  // Get warehouse products
  fastify.get(
    '/:id/products',
    warehouseController.getWarehouseProducts.bind(warehouseController)
  );

  // Get warehouse capacity report
  fastify.get(
    '/:id/capacity',
    warehouseController.getCapacityReport.bind(warehouseController)
  );

  // Create new warehouse
  fastify.post(
    '/',
    warehouseController.createWarehouse.bind(warehouseController)
  );

  // Update warehouse
  fastify.patch(
    '/:id',
    warehouseController.updateWarehouse.bind(warehouseController)
  );

  // Delete warehouse
  fastify.delete('/:id', warehouseController.deleteWarehouse.bind(warehouseController));
}
