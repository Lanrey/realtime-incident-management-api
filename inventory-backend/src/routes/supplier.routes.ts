import { FastifyInstance } from 'fastify';
import { supplierController } from '../controllers/supplier.controller';

export async function supplierRoutes(fastify: FastifyInstance) {
  // Get all suppliers with pagination
  fastify.get(
    '/',
    supplierController.getSuppliers.bind(supplierController)
  );

  // Get supplier by ID
  fastify.get('/:id', supplierController.getSupplierById.bind(supplierController));

  // Get supplier statistics
  fastify.get(
    '/:id/statistics',
    supplierController.getStatistics.bind(supplierController)
  );

  // Create new supplier
  fastify.post(
    '/',
    supplierController.createSupplier.bind(supplierController)
  );

  // Update supplier
  fastify.patch(
    '/:id',
    supplierController.updateSupplier.bind(supplierController)
  );

  // Delete supplier
  fastify.delete('/:id', supplierController.deleteSupplier.bind(supplierController));
}
