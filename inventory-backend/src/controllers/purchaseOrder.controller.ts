import { FastifyRequest, FastifyReply } from 'fastify';
import { purchaseOrderService } from '../services/purchaseOrder.service';
import { ResponseHandler } from '../utils/response';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  queryPurchaseOrdersSchema,
  type CreatePurchaseOrderInput,
  type UpdatePurchaseOrderInput,
  type QueryPurchaseOrdersInput,
} from '../schemas/purchaseOrder.schema';

export class PurchaseOrderController {
  async createPurchaseOrder(
    request: FastifyRequest<{ Body: CreatePurchaseOrderInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = createPurchaseOrderSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const order = await purchaseOrderService.createPurchaseOrder(value);
      return ResponseHandler.success(reply, order, 201);
    } catch (error: any) {
      return ResponseHandler.badRequest(reply, error.message);
    }
  }

  async getPurchaseOrders(
    request: FastifyRequest<{ Querystring: QueryPurchaseOrdersInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = queryPurchaseOrdersSchema.validate(request.query);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const result = await purchaseOrderService.getPurchaseOrders(value);
      return ResponseHandler.successWithMeta(reply, result.orders, result.pagination);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getPurchaseOrderById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const order = await purchaseOrderService.getPurchaseOrderById(request.params.id);

      if (!order) {
        return ResponseHandler.notFound(reply, 'Purchase order not found');
      }

      return ResponseHandler.success(reply, order);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async updatePurchaseOrder(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdatePurchaseOrderInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = updatePurchaseOrderSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const order = await purchaseOrderService.updatePurchaseOrder(
        request.params.id,
        value
      );
      return ResponseHandler.success(reply, order);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async markAsArrived(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const result = await purchaseOrderService.markOrderAsArrived(request.params.id);
      return ResponseHandler.success(reply, result);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async cancelOrder(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await purchaseOrderService.cancelPurchaseOrder(request.params.id);
      return ResponseHandler.success(reply, {
        message: 'Order cancelled successfully',
      });
    } catch (error: any) {
      return ResponseHandler.badRequest(reply, error.message);
    }
  }

  async getPendingOrders(
    request: FastifyRequest<{ Querystring: { warehouseId?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const orders = await purchaseOrderService.getPendingOrders(
        request.query.warehouseId
      );
      return ResponseHandler.success(reply, orders);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getStatistics(
    request: FastifyRequest<{ Querystring: { warehouseId?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const stats = await purchaseOrderService.getOrderStatistics(
        request.query.warehouseId
      );
      return ResponseHandler.success(reply, stats);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }
}

export const purchaseOrderController = new PurchaseOrderController();
