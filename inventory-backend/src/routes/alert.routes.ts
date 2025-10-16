import { FastifyInstance } from 'fastify';
import { alertController } from '../controllers/alert.controller';

export async function alertRoutes(fastify: FastifyInstance) {
  // Create alert
  fastify.post('/', alertController.createAlert.bind(alertController));

  // Get all alerts with filtering and pagination
  fastify.get('/', alertController.getAlerts.bind(alertController));

  // Get alert statistics
  fastify.get('/statistics', alertController.getAlertStatistics.bind(alertController));

  // Get alert by ID
  fastify.get('/:id', alertController.getAlertById.bind(alertController));

  // Resolve alert
  fastify.post('/:id/resolve', alertController.resolveAlert.bind(alertController));

  // Delete alert
  fastify.delete('/:id', alertController.deleteAlert.bind(alertController));
}
