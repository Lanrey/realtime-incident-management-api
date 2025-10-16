import { FastifyRequest, FastifyReply } from 'fastify';
import { alertService, CreateAlertInput } from '../services/alert.service';
import { logger } from '../utils/logger';

export class AlertController {
  async createAlert(
    request: FastifyRequest<{
      Body: CreateAlertInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const alert = await alertService.createAlert(request.body);

      return reply.status(201).send({
        success: true,
        data: alert,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error creating alert');
      return reply.status(500).send({
        success: false,
        error: { message: error.message || 'Failed to create alert' },
      });
    }
  }

  async getAlerts(
    request: FastifyRequest<{
      Querystring: {
        page?: string | number;
        limit?: string | number;
        type?: string;
        severity?: string;
        isResolved?: string | boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const query: any = { ...request.query };

      // Convert query string parameters to proper types
      if (query.page !== undefined) {
        query.page = typeof query.page === 'string' ? parseInt(query.page, 10) : query.page;
      }

      if (query.limit !== undefined) {
        query.limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : query.limit;
      }

      if (query.isResolved !== undefined) {
        query.isResolved = query.isResolved === 'true' || query.isResolved === true;
      }

      const result = await alertService.getAlerts(query);

      return reply.send({
        success: true,
        data: result.alerts,
        meta: result.pagination,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching alerts');
      return reply.status(500).send({
        success: false,
        error: { message: error.message || 'Failed to fetch alerts' },
      });
    }
  }

  async getAlertById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const alert = await alertService.getAlertById(request.params.id);

      if (!alert) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Alert not found' },
        });
      }

      return reply.send({
        success: true,
        data: alert,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching alert');
      return reply.status(500).send({
        success: false,
        error: { message: error.message || 'Failed to fetch alert' },
      });
    }
  }

  async getAlertStatistics(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const statistics = await alertService.getAlertStatistics();

      return reply.send({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error fetching alert statistics');
      return reply.status(500).send({
        success: false,
        error: { message: error.message || 'Failed to fetch alert statistics' },
      });
    }
  }

  async resolveAlert(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const alert = await alertService.resolveAlert(request.params.id);

      return reply.send({
        success: true,
        data: alert,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error resolving alert');
      return reply.status(500).send({
        success: false,
        error: { message: error.message || 'Failed to resolve alert' },
      });
    }
  }

  async deleteAlert(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await alertService.deleteAlert(request.params.id);

      return reply.send({
        success: true,
        data: { message: 'Alert deleted successfully' },
      });
    } catch (error: any) {
      logger.error({ error }, 'Error deleting alert');
      return reply.status(500).send({
        success: false,
        error: { message: error.message || 'Failed to delete alert' },
      });
    }
  }
}

export const alertController = new AlertController();
