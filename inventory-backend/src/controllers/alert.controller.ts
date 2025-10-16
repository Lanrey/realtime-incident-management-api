import { FastifyRequest, FastifyReply } from 'fastify';
import { alertService } from '../services/alert.service';
import { logger } from '../utils/logger';

export class AlertController {
  async getAlerts(
    request: FastifyRequest<{
      Querystring: {
        page?: number;
        limit?: number;
        type?: string;
        severity?: string;
        isResolved?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const result = await alertService.getAlerts(request.query);

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
