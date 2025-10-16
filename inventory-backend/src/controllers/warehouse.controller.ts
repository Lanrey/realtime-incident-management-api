import { FastifyRequest, FastifyReply } from 'fastify';
import { warehouseService } from '../services/warehouse.service';
import { capacityManager } from '../services/capacityManager.service';
import { ResponseHandler } from '../utils/response';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  queryWarehousesSchema,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
  type QueryWarehousesInput,
} from '../schemas/warehouse.schema';

export class WarehouseController {
  async createWarehouse(
    request: FastifyRequest<{ Body: CreateWarehouseInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = createWarehouseSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const warehouse = await warehouseService.createWarehouse(value);
      return ResponseHandler.success(reply, warehouse, 201);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getWarehouses(
    request: FastifyRequest<{ Querystring: QueryWarehousesInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = queryWarehousesSchema.validate(request.query);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const result = await warehouseService.getWarehouses(value);
      return ResponseHandler.successWithMeta(
        reply,
        result.warehouses,
        result.pagination
      );
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getWarehouseById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const warehouse = await warehouseService.getWarehouseById(request.params.id);

      if (!warehouse) {
        return ResponseHandler.notFound(reply, 'Warehouse not found');
      }

      return ResponseHandler.success(reply, warehouse);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async updateWarehouse(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateWarehouseInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = updateWarehouseSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const warehouse = await warehouseService.updateWarehouse(
        request.params.id,
        value
      );
      return ResponseHandler.success(reply, warehouse);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async deleteWarehouse(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await warehouseService.deleteWarehouse(request.params.id);
      return ResponseHandler.success(reply, {
        message: 'Warehouse deleted successfully',
      });
    } catch (error: any) {
      return ResponseHandler.badRequest(reply, error.message);
    }
  }

  async getWarehouseProducts(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const products = await warehouseService.getWarehouseProducts(request.params.id);
      return ResponseHandler.success(reply, products);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getCapacityReport(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const report = await capacityManager.getWarehouseUtilization(request.params.id);
      return ResponseHandler.success(reply, report);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await warehouseService.getWarehouseStatistics();
      return ResponseHandler.success(reply, stats);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }
}

export const warehouseController = new WarehouseController();
