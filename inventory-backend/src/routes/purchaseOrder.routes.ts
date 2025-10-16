import { FastifyInstance } from 'fastify';
import { purchaseOrderController } from '../controllers/purchaseOrder.controller';

export async function purchaseOrderRoutes(fastify: FastifyInstance) {
  // Get all purchase orders with pagination and filters
  fastify.get(
    '/',
    purchaseOrderController.getPurchaseOrders.bind(purchaseOrderController)
  );

  // Get pending orders
  fastify.get(
    '/pending',
    purchaseOrderController.getPendingOrders.bind(purchaseOrderController)
  );

  // Get order statistics
  fastify.get(
    '/statistics',
    purchaseOrderController.getStatistics.bind(purchaseOrderController)
  );

  // Get purchase order by ID
  fastify.get(
    '/:id',
    purchaseOrderController.getPurchaseOrderById.bind(purchaseOrderController)
  );

  // Create new purchase order
  fastify.post(
    '/',
    purchaseOrderController.createPurchaseOrder.bind(purchaseOrderController)
  );

  // Update purchase order
  fastify.patch(
    '/:id',
    purchaseOrderController.updatePurchaseOrder.bind(purchaseOrderController)
  );

  // Mark order as arrived
  fastify.post(
    '/:id/arrive',
    purchaseOrderController.markAsArrived.bind(purchaseOrderController)
  );

  // Cancel order
  fastify.post(
    '/:id/cancel',
    purchaseOrderController.cancelOrder.bind(purchaseOrderController)
  );
}
